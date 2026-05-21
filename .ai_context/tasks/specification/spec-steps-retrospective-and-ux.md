# Spec — Steps retrospective + Init minimale + CONTRACT session protocol

*Created: 2026-05-21*

---

## 1. Steps mini-rétrospective

### Comportement attendu

Quand un step est marqué "done" (via New Task), le plugin appende automatiquement
une section rétrospective dans le fichier `steps/<slug>.md` correspondant :

```markdown
## Retrospective — YYYY-MM-DD

- ✅ What worked:
- ⚠️ What blocked:
- 📌 To remember:
```

Les champs sont vides — le dev les remplit librement après coup, ou pas.
L'agent peut aussi les remplir dans son `done.md`.

### Logique de matching step → fichier

- Le `completedStep` est le nom exact du step (tel que stocké dans `dev-context.json`)
- Slugifier : `name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')`
- Chercher `steps/<slug>.md` — si trouvé, appender la section

### Fichiers touchés

- `src/generator/TemplateGenerator.ts` → `scaffoldNewTask` : append rétrospective
- `src/generator/TemplateGenerator.kt` → idem IntelliJ

---

## 2. Init minimale

### Comportement attendu

Au début du flow `initContext`, proposer un choix Quick/Full **avant** les étapes :

```
◉ Full init (recommended) — Profile, Context, Vision, Steps, First Task
○ Quick init — Profile + Context only (vision & steps to fill later)
```

Si "Quick init" : sauter les étapes vision, steps. Créer `vision.md` avec placeholder
`> ⚠️ Fill this before asking the agent to work` et `dev-context.json` sans steps.

### Fichiers touchés

- `src/commands/initContext.ts` : QuickPick mode au début
- `src/generator/TemplateGenerator.ts` : `scaffoldInit` accepte `quickMode?: boolean`
- IntelliJ : `DddActions.kt` `InitContextAction`

---

## 3. CONTRACT — Session close protocol enrichi

### Comportement attendu

Le `CONTRACT.md` généré inclut un protocole de clôture de session que l'agent
interprète lui-même, sans déclencheur plugin. Triggers :

1. Le développeur signale la fin (`stop`, `commit`, `à demain`, `done`, etc.)
2. Plus de 5 fichiers modifiés dans la session (seuil significatif)
3. Un gros sujet vient de se terminer (feature complète, bug résolu)
4. Un nouveau gros sujet est sur le point de commencer (point de rupture naturel)

### Format dans `dev-context.json`

```json
"lastSession": {
  "date": "2026-05-21",
  "done": "Implemented tree view icons and context panel refresh",
  "remaining": "ContextPanel webview rendering on dark theme",
  "blocker": "VSCode API for webview CSS variables unclear"
}
```

### Fichiers touchés

- `src/generator/TemplateGenerator.ts` : template `contractMd()` enrichi
- `TemplateProvider.kt` : idem IntelliJ

