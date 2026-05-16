# Done — Fix & stabilize New Task / New Vision commands

*Completed: 2026-05-16*

---

## What was done

Migration du modèle de données ephémère de `context.json` (ancien format plat) vers `dev-context.json` (format enrichi), et correction des commandes du plugin VSCode.

---

## Changes

### `src/commands/newContext.ts`
- Renommé l'export `newTask` (was `newContext`)
- Le QuickPick "step complété" lit désormais `dev-context.json` (liste des steps `done: false` uniquement)
- Label et placeholder clarifiés : sélection dans la liste, pas saisie libre
- Ajout de `detail` sur chaque item pour guider l'utilisateur

### `src/extension.ts`
- Import corrigé : `newTask` from `newContext.ts`
- Commande `ddd.newContext` supprimée → remplacée par `ddd.newVision` + `ddd.newTask`

### `src/webview/ContextPanel.ts`
- Deux boutons : 🔭 New Vision + ＋ New Task (instead of "New Context")
- Lecture depuis `dev-context.json` (plus de dépendance à `CONTEXT.md` pour l'état ephémère)
- Affichage : section Vision, liste Steps (✅/○ selon `done`), section Task avec todos cochables
- `_toggleTodo` écrit dans `dev-context.json` (plus dans `CONTEXT.md`)

### `src/generator/TemplateGenerator.ts`
- Suppression de l'import `Stack` inutilisé
- `contextJson()` → nouveau format : `{ vision, steps[], task: { title, description, startedAt, todos[] } }`
- `scaffoldInit` / `scaffoldNewVision` / `scaffoldNewTask` : passent `vision`, `steps`, `todos`
- `scaffoldNewTask` : préserve vision + steps, marque le step complété `done: true`
- `historyLine` : inclut le champ `vision` pour les entrées de type `task`
- `AI_CONTEXT_README` : refonte avec sections "Fixed reference" vs "Current dev work"
- `contextProjectMd` : ajout d'une note permanence et référence à `dev-context.json`
- Agent header du `README.md` projet : reformaté WHO/WHAT/HOW/WHERE/WHAT NOW

### `.ai_context/dev-context.json` (ce projet)
- Créé manuellement pour migrer depuis l'ancien `context.json`
- Vision + 3 steps (Phase 1 ✅, Phase 2 ○, Phase 3 ○) + tâche active avec todos

---

## Result

- `ddd.newTask` et `ddd.newVision` sont correctement enregistrés et fonctionnels
- Le panneau "Context" affiche l'état complet du cycle DDD : vision → steps → tâche active
- Les todos sont stockés et togglés dans `dev-context.json` (source unique de vérité ephémère)
- Le step coché par l'utilisateur est marqué `done: true` et persisté entre les tâches

