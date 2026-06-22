# UI — Pages & composants

Convention transverse : chaque composant/page a son **SCSS module** (`*.module.scss`) à côté du `.tsx`, importé en `import styles from './X.module.scss'`. Les composants interactifs s'appuient sur **`react-aria-components`** (Button → `onPress`, Modal/DatePicker, etc.).

## Pages — `src/pages/<Page>/<Page>.tsx`

| Page | Rôle | Rôle accès |
|---|---|---|
| `BiensPage` | Liste des biens + baux ; création/suppression bien (Modal + ConfirmDialog) | landlord |
| `BailEditPage` | Création/édition d'un bail (tenants/garants, statut, patch partiel) | landlord |
| `BailPrintPage` | Aperçu imprimable du bail + signature ; rend `<BailDocument>` | landlord |
| `LocatairesPage` | CRUD locataires + invitation (magic link) | landlord |
| `GarantsPage` | CRUD garants (personne/organisation, onglets) + invitation | landlord |
| `QuittancesPage` | Périodes de loyer : marquer payé/impayé, ajustements, avis d'échéance | landlord |
| `ReglagesPage` | Profil bailleur (upsert) + signature | landlord |
| `MigrationPage` | Import des données legacy V1 depuis localStorage vers l'API | landlord |
| `MonDossierPage` | Vue locataire/garant : baux, documents (upload, partage, download) | tenant/guarantor |
| `LoginPage` | Connexion ; redirige selon le rôle si déjà authentifié | public |
| `AcceptInvitationPage` | Active un compte via `:token` (définit le mot de passe) | public |
| `ForgotPasswordPage` | Demande de réinitialisation (réponse générique anti-énumération) | public |
| `ResetPasswordPage` | Réinit du mot de passe via `:token` | public |

Sous-composants notables : `LocatairesPage/TenantFormModal.tsx`, `LocatairesPage/InviteLinkModal.tsx` (réutilisé par GarantsPage), `GarantsPage/GuarantorFormModal.tsx`.

## Composants réutilisables — `src/components/<Name>/`

| Composant | Description |
|---|---|
| `TextField` | Input labellisé, étend `InputHTMLAttributes`, `forwardRef`, prop `hint` |
| `Button` | Wrapper sur `react-aria-components/Button` ; **`onPress`** (pas `onClick`), prop `variant` |
| `Toast` + `toast-store` | `<ToastProvider />` (monté une fois) + queue impérative singleton ; API `toast.success/error/info` utilisable hors React (ex. `query-client.ts`) |
| `Modal` | Wrapper `react-aria-components` (backdrop, ESC, focus trap, animation) |
| `Modal/ConfirmDialog` | Confirmation d'actions sensibles ; `variant: 'danger'` met le focus initial sur Annuler |
| `SignaturePad` | Signature en mode texte ou dessin (canvas) ; `value`/`onChange` (dataURL) |
| `Skeleton` | Placeholder de chargement, prop `lines` / `height` |
| `Layout` | Shell authentifié : header + nav filtrée par rôle (`NAV_LINKS`) + déconnexion + `<Outlet />` |
| `DatePicker` | `DatePickerField` sur react-aria + `@internationalized/date` (locale FR) |
| `SelectField` | Select labellisé |
| `ComboBox` | Combobox (recherche + sélection) |
| `Tabs` | Onglets (utilisé par GarantsPage) |
| `FileUpload` | Sélecteur de fichier (utilisé par MonDossierPage) |
| `RequireAuth` | Gate de route par rôle (voir `docs/architecture.md`) |

## Documents — `src/documents/<Name>/`

| Composant | Description |
|---|---|
| `BailDocument` | Rendu imprimable d'un bail ; consomme `Bail`/`Bailleur` (via `@/utils/bail-adapter`) |
| `QuittanceDocument` | Rendu imprimable d'une quittance ; consomme `QuittanceVM` (`@/utils/quittance`) |

Helpers de vue/format associés : `src/utils/format.ts`, `src/utils/dates.ts`, `src/utils/quittance.ts`, `src/utils/bail-adapter.ts`.
