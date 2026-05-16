# Done — Correction des tests et bug TemplateProvider

*2026-05-15*

---

## Résumé

Correction des tests des deux plugins pour les aligner sur l'implémentation v2 (tasks/ + vision.md + steps/),
et correction d'un bug de compilation dans TemplateProvider.kt.

---

## Changements

### plugin-intellij — `TemplateProvider.kt`

**Bug corrigé :** appel `projectReadme(projectRoot.name)` sur une variable `File` (fonction inexistante).

**Correction :**
- Ajout de la fonction `fun projectReadmeMd(projectName: String): String` dans l'objet `TemplateProvider`
- Remplacement de `projectReadme(projectRoot.name)` → `projectReadmeMd(projectRoot.name)`
- Correction mineure : suppression d'un espace parasite dans `historyLine()`

### plugin-intellij — `TemplateProviderTest.kt`

Réécriture complète pour aligner sur l'API v2 :

| Avant | Après |
|---|---|
| `scaffoldInit(root, profile, title, desc, todos)` | `scaffoldInit(root, profile, projectContext, vision, title, desc, todos, steps)` |
| `documents/done/`, `documents/specification/`, `documents/technical/` | `tasks/done/`, `tasks/specification/`, `tasks/technical/` |
| `scaffoldNewContext(root, title, desc, todos)` | `scaffoldNewTask(root, completedStep, title, desc, todos)` |
| `history.log` | `history.json` |
| Test "always overwrites CONTEXT.md" | Test "does not overwrite existing CONTEXT.md" (CONTEXT.md est permanent) |

Nouveaux tests ajoutés :
- `scaffoldInit writes vision in vision.md`
- `scaffoldInit creates step files`
- `scaffoldInit writes task title in context.json`
- `scaffoldNewTask records completed step in history.json`
- `scaffoldNewTask preserves vision.md and steps/`

### plugin-vscode — `extension.test.ts`

Mêmes corrections que pour IntelliJ :

| Avant | Après |
|---|---|
| `scaffoldInit(root, profile, title, desc, todos)` | `scaffoldInit(root, profile, projectContext, vision, title, desc, todos, steps)` |
| Suite `scaffoldNewContext` | Suite `scaffoldNewTask` |
| `documents/` | `tasks/` |
| `history.log` | `history.json` |
| "always overwrites CONTEXT.md" | "does not overwrite existing CONTEXT.md" |

Helper `defaultInit()` ajouté pour éviter la répétition des 8 paramètres.

---

## État post-correction

- Aucune erreur de compilation dans les 4 fichiers modifiés
- Les tests couvrent : structure complète v2, permanence de CONTEXT.md, vision.md, steps/, history.json, scaffoldNewTask

