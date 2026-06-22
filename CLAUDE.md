# CLAUDE.md — gestion-locative (frontend)

SPA React de gestion locative pour bailleurs (biens, baux, locataires, garants, quittances) et locataires/garants (« Mon dossier »). Consomme le backend **`gestion-locative-api`** (cookie de session httpOnly).

**Stack** : React 19 + react-router-dom v7 + `@tanstack/react-query` v5 + `openapi-fetch` (client typé) + `react-aria-components` + SCSS modules + Vite 8. Gestionnaire de paquets : **pnpm**.

## Quick start

```bash
pnpm dev          # serveur de dev Vite (ouvre le navigateur)
pnpm build        # = tsc -b && vite build (type-check projet + bundle)
pnpm lint         # eslint .
pnpm typecheck    # tsc --noEmit
pnpm gen:api      # régénère src/api/schema.gen.ts depuis l'OpenAPI du back
```

Vérification minimale après changement : `pnpm build` **et** `node_modules/.bin/eslint .`.

**GOTCHA `pnpm gen:api`** : appelle `openapi-typescript ${API_URL:-http://localhost:3000}/openapi.json`. Le **backend doit tourner** (par défaut `localhost:3000`, sinon exporter `API_URL=...`). Sans API joignable, la commande échoue. Ne jamais éditer `src/api/schema.gen.ts` à la main : c'est un artefact généré. Le code doit rester compatible avec ces types générés.

## Architecture (rapide)

- **Routing** (`src/App.tsx`) : routes publiques (login, accept-invitation, forgot/reset password) eager pour la `LoginPage`, le reste en `lazy()`. Routes protégées via `<RequireAuth roles={[...]} />` (`src/components/RequireAuth`) qui gate sur le rôle (`landlord` vs `tenant`/`guarantor`) puis monte `<Layout />`.
- **react-query** (`src/api/query-client.ts`) : query keys par ressource (ex. `ME_QUERY_KEY`, `PROPERTIES_QUERY_KEY`), invalidation après mutation, optimistic update dans `useMarkPaid`, et **handler global 401** → toast + `window.location.href = '/login'`. `useAuth`/`useLandlordProfile` retournent `null` sur 401/404 plutôt que de throw.
- **Client API** (`src/api/client.ts`) : `openapi-fetch` typé sur `paths` (de `schema.gen.ts`), `credentials: 'include'` (envoie le cookie `gl_session`), baseUrl = `VITE_API_URL` (défaut `http://localhost:3000`). Chaque hook ressource suit le pattern `{ data, response }`.

## Conventions clés

- **Indentation = TABS** (tout le code source).
- **Copy UI en français.**
- **SCSS modules** : un `*.module.scss` par composant.
- Alias d'import **`@/` → `src/`** (vite.config.ts + tsconfig.app.json).
- Les hooks API vivent dans `src/api/<ressource>.ts`.
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
