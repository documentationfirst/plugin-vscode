# Done — Implémentation complète du dossier `skills/` (VSCode plugin)

*Complété : 2026-04-30*

Migré depuis `documents/done/skills-implementation.md`.

---

## Ce qui a été fait

### 1. `src/treeview/DddTreeProvider.ts`
- Icône `mortar-board` et `contextValue = 'dddSkillsFolder'` pour `skills/`

### 2. `src/commands/newSkill.ts` *(nouveau fichier)*
- Commande dédiée à la création d'un skill dans `.ai_context/skills/`
- Template avec sections `Rôle` + `Règles` + hint `permanent-`

### 3. `src/extension.ts`
- Enregistrement de `ddd.newSkill`

### 4. `package.json`
- Déclaration commande `ddd.newSkill` + menu inline sur `dddSkillsFolder`

