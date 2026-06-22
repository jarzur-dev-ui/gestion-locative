# Conventions

## Indentation

**TABS** dans tout le code source (`.ts`, `.tsx`, `.scss`). Ne pas convertir en espaces.

## Langue

La **copy UI est en français** (labels, messages, toasts). Les commentaires de code sont en français dans ce repo. Les libellés de types de documents (`MonDossierPage` : `DOC_TYPE_LABELS`) mappent des clés i18n du back vers du français côté front (statique en V1).

## Structure de fichiers

```
src/
  api/            hooks react-query + client typé (un fichier par ressource)
                  client.ts, query-client.ts, schema.gen.ts (généré), <ressource>.ts
  components/     composants réutilisables — un dossier par composant :
                  <Name>/<Name>.tsx, <Name>.module.scss, <Name>.types.ts, index.ts
  documents/      composants de rendu imprimable (BailDocument, QuittanceDocument)
  pages/          une page par dossier : <Page>/<Page>.tsx + .module.scss
  utils/          helpers purs (format, dates, quittance, bail-adapter)
  types/          types métier locaux (Bail, Bailleur, etc.)
  styles/         global.scss, tokens.scss
```

Un dossier composant expose généralement : implémentation `.tsx`, `*.module.scss`, parfois `*.types.ts` (props/types), et un `index.ts` barrel.

## Naming

- Composants et pages en **PascalCase** (dossier + fichier identiques).
- Hooks en **camelCase** préfixés `use` (`useLeases`, `useMarkPaid`).
- Query keys : constante `SCREAMING_SNAKE` se terminant par `_QUERY_KEY`.
- Props : interface `{Composant}Props`.

## Imports

- Alias **`@/` → `src/`** (déclaré dans `vite.config.ts` et `tsconfig.app.json`). Préférer `@/...` aux chemins relatifs longs.
- Style importé **en dernier** : `import styles from './X.module.scss'`.

## API & types

- Les hooks API vivent dans `src/api/<ressource>.ts` ; voir `docs/architecture.md` pour le pattern.
- Tous les types de données dérivent de `components['schemas'][...]` (de `src/api/schema.gen.ts`, **généré**). Ne pas éditer le fichier généré ; le code doit rester compatible avec lui.

## Lint / TypeScript

- ESLint flat config (`eslint.config.js`) : `@eslint/js` recommended, `typescript-eslint` recommended, **`eslint-plugin-react-hooks` v7** (flat recommended), `eslint-plugin-react-refresh` (vite). `dist` ignoré.
  - Conséquence react-refresh : un fichier qui exporte un composant ne doit exporter que des composants (raison de la séparation `Toast.tsx` / `toast-store.ts`).
- TypeScript strict (`tsconfig.app.json`) : `strict`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` (imports de types via `import type`), `noImplicitOverride`. `noUncheckedIndexedAccess` est **désactivé** volontairement.
- Vérifs : `pnpm lint`, `pnpm typecheck`, `pnpm build`.
