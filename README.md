# gestion-locative

Application web unifiée de gestion locative : génère les **contrats de location** (baux) et les **quittances de loyer + avis d'échéance**, à partir des biens saisis une seule fois.

Les données (bailleur, baux, signature) sont stockées **dans le navigateur** (`localStorage`) — rien n'est envoyé sur un serveur. La génération PDF se fait via l'**impression du navigateur** (Imprimer → Enregistrer en PDF).

> Versions CLI / Python autonomes (sans interface) : [`bail-generator`](https://github.com/jarzur-dev-ui/bail-generator) et [`quittance-generator`](https://github.com/jarzur-dev-ui/quittance-generator). Cette app web les réunit.

## Stack

- Vite + React + TypeScript, **pnpm**
- React Router, SCSS modules, tokens CSS maison (pas de dépendance UI externe)
- Architecture de dossiers : `components/`, `documents/`, `pages/`, `hooks/`, `contexts/`, `utils/`, `config/`, `types/`, `styles/`

## Développement

```bash
pnpm install
pnpm dev      # http://localhost:5173
pnpm build    # typecheck + build de prod
pnpm preview  # sert le build
```

## Utilisation

1. **Réglages** — saisis tes coordonnées de bailleur et importe ta signature (image). Pré-rempli, modifiable.
2. **Biens & baux** — ajoute un bail (locataire, bien, durée, conditions financières). L'`id` du bien est dérivé de la ville et reste stable quand le locataire change.
   - « Enregistrer & aperçu du bail » → aperçu imprimable du contrat type (loi 1989 / décret 2015-587) → **Imprimer / PDF**.
3. **Quittances** — choisis le mois, ajoute les régularisations ponctuelles si besoin (solde antérieur, TEOM, régul. charges — TEOM et régul. réservées au logement), puis « Générer l'aperçu » → **Imprimer / PDF**. Une quittance + avis d'échéance par bien, l'échéance reprenant le `jour d'échéance` du bail.

## Impression PDF

Chaque document est rendu en HTML/CSS optimisé pour l'impression (`@media print` isole la zone document). Clique sur **Imprimer / PDF**, puis choisis « Enregistrer au format PDF » dans la boîte d'impression. Pense à activer les **arrière-plans** dans les options d'impression pour conserver les bandeaux colorés.

## Données

Tout est dans le `localStorage` du navigateur (clés `gl.bailleur`, `gl.baux`). Sauvegarde/transfert : exporte via les outils dev du navigateur si besoin. Aucune donnée ne quitte ta machine.
