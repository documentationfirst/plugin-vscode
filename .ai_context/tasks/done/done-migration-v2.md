# Done — Migration `.ai_context` v2

*2026-05-15*

Migré depuis `documents/done/done-migration-ai-context-v2.md`.

---

## Résumé

Migration de la structure `.ai_context/` vers v2 pour les deux plugins.

### plugin-vscode
- `TemplateGenerator.ts` : `tasks/`, `steps/`, `vision.md`, `history.json`
- `initContext.ts` : flow 5 étapes (profil → vision → titre → steps → todos)
- `newContext.ts` : avertissement mis à jour (`tasks/`)
- `DddTreeProvider.ts` : racine `tasks/` + `steps/` + `skills/`

### plugin-intellij
- `TemplateProvider.kt` : même structure
- `DddActions.kt` : flow init enrichi
- `DddToolWindowFactory.kt` : arborescence v2

### `.ai_context` des deux plugins
- `README.md` mis à jour, `vision.md` créés, `tasks/` + `steps/` créés
- `documents/` conservé (migration progressive)

