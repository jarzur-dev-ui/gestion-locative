# Architecture

## Bootstrap

`src/main.tsx` monte, dans l'ordre : `QueryClientProvider` (client de `@/api/query-client`) → `BrowserRouter` → `<App />`, plus `<ToastProvider />` (monté une seule fois, hors Router) et `<ReactQueryDevtools>` en dev uniquement. Styles globaux : `@/styles/global.scss`.

## Routing — `src/App.tsx`

- Toutes les routes sont enveloppées dans un `<Suspense>` (fallback = `<Skeleton>`).
- **URLs localisées** : chaque route vit sous un préfixe de langue (`/fr-FR/…`, `/en-US/…`) avec des slugs traduits (`SEGMENTS` dans `src/config/routes.ts`, ex. `/fr-FR/connexion` ↔ `/en-US/login`). `LangGate` aligne i18next sur le préfixe. Les liens se construisent avec `paths.*()` (langue courante), jamais en dur.
- **Routes publiques** (eager pour `LoginPage`, le reste en `lazy()`) : `login`, `acceptInvitation/:token`, `forgotPassword`, `resetPassword/:token`.
- **Routes bailleur** — gate `<RequireAuth roles={['landlord']} />` puis `<Layout />` : `biens`, `biens/:propertyId/baux/nouveau`, `biens/:propertyId/baux/:leaseId`, `…/:leaseId/print`, `locataires`, `garants`, `quittances`, `reglages`, `migration` ; `/:lang` → `biens`.
- **Routes locataire/garant** — gate `<RequireAuth roles={['tenant','guarantor']} />` : `monDossier`.
- **Liens hérités** (`src/routes/LegacyRedirects.tsx`, hors préfixe de langue) : l'API émet encore des liens sans langue et des emails sont déjà partis. `/accept-invitation/:token` et `/reset-password/:token` → page localisée ; `/leases/:leaseId` → `monDossier` (destinataires locataires) ; `/share/:token` → `${API_BASE_URL}/share/:token` (fichier servi par l'API).
- `/` et `*` → `paths.biens()` (puis `RequireAuth` renvoie vers la connexion si besoin).

### Role-gating — `src/components/RequireAuth/RequireAuth.tsx`

`RequireAuth` appelle `useAuth()` : pendant le chargement affiche « Chargement… », sur erreur ou absence d'utilisateur redirige vers `paths.login()` (en mémorisant `location` dans `state.from`), et si `roles` est fourni mais ne contient pas le rôle de l'utilisateur affiche « Accès refusé ». Sinon rend `<Outlet />`.

`defaultRouteForRole(role)` (`src/api/auth.ts`) : `landlord` → `paths.biens()`, sinon → `paths.monDossier()` (utilisé par Login/AcceptInvitation pour rediriger après authentification).

## react-query — `src/api/query-client.ts`

- **Handler global d'erreur** sur `QueryCache` et `MutationCache` (`handleApiError`) :
  - 401 (`isAuthError` matche `HTTP 401` / `Non authentifi`) sur page protégée → `toast.error(...)` + hard redirect `window.location.href = '/login'` (wipe state + cache). Sur page publique (`PUBLIC_PATHS` = `/login`, `/accept-invitation`, chemins non localisés) → silencieux.
  - autres erreurs → toast (préfixe `Erreur : ` pour les mutations).
- **defaultOptions** : queries `staleTime` 60 s, pas de retry sur 4xx (sinon 1 retry), `refetchOnWindowFocus: false` ; mutations sans retry.

### Pattern des hooks ressource — `src/api/*.ts`

Chaque module ressource (`auth`, `me`, `properties`, `leases`, `rent-periods`, `tenants`, `guarantors`, `invitations`, `landlord-profiles`, `documents`, `migration`) :

- exporte une **query key racine** constante (ex. `LEASES_QUERY_KEY`, `RENT_PERIODS_QUERY_KEY`) et les types tirés de `components['schemas'][...]`.
- chaque `queryFn`/`mutationFn` déstructure `{ data, response }` du client, et fait `if (!data) throw new Error(\`HTTP ${response.status}\`)`.
- les mutations **invalident** la query key racine après succès, et `setQueryData` sur la clé détail quand pertinent.

Patterns particuliers à connaître :

- **401/404 → null** : `useAuth` (`src/api/auth.ts:useAuth`) renvoie `null` sur 401 ; `useLandlordProfile` (`src/api/landlord-profiles.ts`) renvoie `null` sur 404 (profil pas encore créé). Le composant teste l'absence plutôt que de gérer une erreur.
- **Optimistic update** : `useMarkPaid` (`src/api/rent-periods.ts`) — `onMutate` annule les refetch en cours, snapshot multi-clés via `getQueriesData`, patche `statusKey:'paid'`+`paidAt` ; `onError` rollback chaque clé ; `onSettled` invalide pour récupérer la vérité serveur. `useMarkUnpaid` ne fait PAS d'optimistic update (action rare).
- **Filtres dans la query key** : `useLeases`, `useRentPeriods`, `useGuarantors`, `useDocuments` incluent les filtres dans la clé → changer un filtre déclenche le refetch.
- **Magic link reconstruit côté client** : `useCreateInvitation` (`src/api/invitations.ts`) ajoute `shareUrl` (`${origin}${paths.acceptInvitation(token)}`, localisé) que le back ne renvoie pas, puis invalide tenants ou guarantors selon `targetType`.
- **Upload multipart hors openapi-fetch** : `useUploadDocument` (`src/api/documents.ts`) utilise `fetch` brut + `FormData` (les types ne gèrent pas FormData) ; `getDocumentDownloadUrl` retourne une URL absolue pour `<a href>` (le cookie part automatiquement).
- **Import legacy** : `useImportLegacy` (`src/api/migration.ts`) invalide largement (profile, properties, tenants, guarantors, leases) ; `readLegacyLocalStorage()` lit les clés localStorage `gl.bailleur` / `gl.baux`.

## Client typé — `src/api/client.ts`

`createClient<paths>` (openapi-fetch) avec `baseUrl = API_BASE_URL` (exporté : `import.meta.env.VITE_API_URL ?? 'http://localhost:3000'`) et `credentials: 'include'` (envoie le cookie de session `gl_session`, httpOnly, posé par le back au login). Réexporte `paths` et `components` (consommés partout via `components['schemas'][...]`).

## Codegen — `src/api/schema.gen.ts`

Généré par `pnpm gen:api` (`openapi-typescript ${API_URL:-http://localhost:3000}/openapi.json -o src/api/schema.gen.ts`). **Artefact — ne pas éditer à la main.** Nécessite le backend en cours d'exécution. Tous les types de l'app dérivent de ce fichier.
