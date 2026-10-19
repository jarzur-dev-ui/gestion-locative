# CLAUDE.md — gestion-locative (frontend)

SPA React de gestion locative pour bailleurs (biens, baux, locataires, garants, quittances) et locataires/garants (« Mon dossier »). Consomme le backend **`gestion-locative-api`** (cookie de session httpOnly).

**Stack** : React 19 + react-router-dom v7 + `@tanstack/react-query` v5 + `openapi-fetch` (client typé) + `react-aria-components` + SCSS modules + Vite 8. Gestionnaire de paquets : **pnpm**.

## Quick start

```bash
pnpm dev          # serveur de dev Vite (ouvre le navigateur)
pnpm build        # = tsc -b && vite build (type-check projet + bundle)
pnpm lint         # eslint (pnpm -r : chaque package qui a le script)
pnpm lint:css     # stylelint sur les *.scss (pnpm -r)
pnpm typecheck    # tsc -b (suit les références : src + vite.config.ts)
pnpm gen:api      # régénère apps/web/src/api/schema.gen.ts depuis l'OpenAPI du back
```

Vérification minimale après changement : `pnpm typecheck && pnpm build && pnpm lint && pnpm lint:css`.

**Workspace pnpm** (`pnpm-workspace.yaml` : `apps/*`, `packages/*`, `e2e`) :

- `apps/web` (`@gestion-locative/web`) : l'app ; build dans `apps/web/dist` (CI + `Dockerfile.ci`).
- `packages/lint-config` (`@gestion-locative/lint-config`) : ESLint (`/eslint`, exports `base` et `react`) et stylelint (`/stylelint`).
- Scripts racine : `dev`, `preview`, `gen:api` → `pnpm --filter @gestion-locative/web <script>` ; `build`, `lint`, `lint:css`, `typecheck` → `pnpm -r`.
- **Vite se lance depuis `apps/web`** (scripts racine ou `pnpm --filter`), jamais `vite --config apps/web/vite.config.ts` depuis la racine : `index.html` et `.env.local` sont lus dans le dossier courant (`apps/web/.env.local`).

**GOTCHA `pnpm gen:api`** : appelle `openapi-typescript ${API_URL:-http://localhost:3000}/openapi.json`. Le **backend doit tourner** (par défaut `localhost:3000`, sinon exporter `API_URL=...`). Sans API joignable, la commande échoue. Ne jamais éditer `apps/web/src/api/schema.gen.ts` à la main : c'est un artefact généré. Le code doit rester compatible avec ces types générés.

## Architecture (rapide)

- **Routing** (`apps/web/src/App.tsx`) : URLs localisées `/fr-FR/…` / `/en-US/…` (slugs dans `apps/web/src/config/routes.ts`, liens via `paths.*()`). Routes publiques (login, accept-invitation, forgot/reset password) eager pour la `LoginPage`, le reste en `lazy()`. Anciens liens sans langue émis par l'API → redirections (`apps/web/src/routes/LegacyRedirects.tsx`). Routes protégées via `<RequireAuth roles={[...]} />` (`apps/web/src/components/RequireAuth`) qui gate sur le rôle (`landlord` vs `tenant`/`guarantor`) puis monte `<Layout />`.
- **react-query** (`apps/web/src/api/query-client.ts`) : query keys par ressource (ex. `ME_QUERY_KEY`, `PROPERTIES_QUERY_KEY`), invalidation après mutation, optimistic update dans `useMarkPaid`, et **handler global 401** → toast + `window.location.href = '/login'`. `useAuth`/`useLandlordProfile` retournent `null` sur 401/404 plutôt que de throw.
- **Client API** (`apps/web/src/api/client.ts`) : `openapi-fetch` typé sur `paths` (de `schema.gen.ts`), `credentials: 'include'` (envoie le cookie `gl_session`), baseUrl = `API_BASE_URL` = `VITE_API_URL` (défaut `http://localhost:3000`). Chaque hook ressource suit le pattern `{ data, response }`.

## Conventions clés

- **Indentation = TABS** (tout le code source).
- **Copy UI en français.**
- **SCSS modules** : un `*.module.scss` par composant.
- Alias d'import **`@/` → `apps/web/src/`** (vite.config.ts + tsconfig.app.json).
- Les hooks API vivent dans `apps/web/src/api/<ressource>.ts`.
- Ne pas casser la compatibilité avec les types API générés (`schema.gen.ts`).

## GOTCHAS dépôt (introuvables dans le code)

- Le remote `origin` a **deux URLs de push** : GitLab (`gitlab.exanders.fr:infrajo/gestion-locative`) + GitHub (`jarzur-dev-ui/gestion-locative`). `git push origin main` pousse vers **les deux**.
- Branche par défaut : **`main`**.
- Le frontend est **déployé par la CI GitLab** au push sur `main`.

## Knowledge map

| Besoin de comprendre… | Fiche |
|---|---|
| Routing, react-query, client API, codegen, flux de données | `docs/architecture.md` |
| Pages et composants réutilisables | `docs/ui.md` |
| Conventions (TABS, naming, structure, lint) | `docs/conventions.md` |

## Règle de maintenance de la doc

Après un commit avec un changement **structurel** (page/route ajoutée ou supprimée, composant/hook public ajouté/supprimé, hook API ou contrat de données modifié, changement d'architecture / de flux), proposer de lancer `/dev:doc-sync` (skill du marketplace perso `claude-skills`) pour mettre à jour `CLAUDE.md` + `docs/`. **Ne pas** mettre à jour la doc pour : CSS/styling, libellés/i18n, bugfix préservant le comportement, refacto interne, bump de deps, fix de lint.
