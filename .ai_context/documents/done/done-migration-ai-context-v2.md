# Done — Migration `.ai_context` v2 + enrichissement du flow init

*2026-05-15*

---

## Résumé

Migration complète de la structure `.ai_context/` vers la v2 définie dans `skills/methodology-ddd-ai.md`,
pour les deux plugins (VSCode et IntelliJ). Enrichissement du flow `init` pour capturer
vision, steps et tasks dès la première initialisation.

---

## Changements effectués

### plugin-vscode

#### `src/generator/TemplateGenerator.ts`
- `AI_CONTEXT_README` mis à jour : nouvelle structure avec `tasks/`, `steps/`, `vision.md`
- Ajout de `visionMd(vision)` et `stepMd(name, description)` — templates permanents
- `scaffoldInit` : signature étendue avec `vision`, `steps[]` ; crée `tasks/`, `steps/`, `vision.md`
- `scaffoldNewContext` : archive dans `history.json` (au lieu de `history.log`), vide `tasks/`

#### `src/commands/initContext.ts`
- Flow enrichi en 5 étapes : profil → vision → titre/description → steps (loop) → todos (loop)

#### `src/commands/newContext.ts`
- Message d'avertissement mis à jour : `tasks/` au lieu de `documents/`

#### `src/treeview/DddTreeProvider.ts`
- Root level : affiche `tasks/`, `steps/`, `skills/`
- Icônes : `list-ordered` pour `steps/`, `inbox` pour `tasks/`

### plugin-intellij

#### `TemplateProvider.kt`
- Ajout de `visionMd()` et `stepMd()`
- `scaffoldInit` étendu avec `vision` et `steps: List<Pair<String,String>>`
- `scaffoldNewContext` : archive dans `history.json`, vide `tasks/`

#### `DddActions.kt`
- `InitContextAction` : flow enrichi avec dialog vision + loop steps

#### `DddToolWindowFactory.kt`
- Arborescence : `tasks/`, `steps/`, `skills/`
- Icônes distinctes pour chaque dossier racine

### `.ai_context` des deux plugins
- `README.md` réécrits, `CONTEXT.md` mis à jour, `vision.md` créés
- `steps/` et `tasks/` à créer via les commandes bash dans `CONTEXT.md`

---

## État post-migration

| Élément | Avant | Après |
|---------|-------|-------|
| Dossier des tâches | `documents/` | `tasks/` |
| Journal | `history.log` | `history.json` |
| Vision produit | absent | `vision.md` |
| Jalons / features | absent | `steps/` |
| Flow init | profil + titre + desc + todos | profil + vision + titre + desc + steps + todos |
| Arborescence | `documents/` + `skills/` | `tasks/` + `steps/` + `skills/` |

