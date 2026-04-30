# Done — Vérification du support `skills/` dans le plugin VSCode

*Complété : 2026-04-30*

---

## Ce qui a été fait

### Audit de l'implémentation existante

Tous les fichiers concernés ont été vérifiés — aucune modification de code n'était nécessaire.
Le plugin VSCode avait déjà implémenté `skills/` correctement, contrairement au plugin IntelliJ
qui avait un bug dans `scaffoldInit`.

---

### Fichiers vérifiés

**`src/generator/TemplateGenerator.ts` — `scaffoldInit`**
```typescript
ensureDir(path.join(aiContextRoot, 'skills'));
const skillsGitkeep = path.join(aiContextRoot, 'skills', '.gitkeep');
if (!fs.existsSync(skillsGitkeep)) { writeFile(skillsGitkeep, ''); }
```
✅ `skills/` créé à la racine de `.ai_context/`

---

**`src/generator/TemplateGenerator.ts` — `scaffoldNewContext`**
```typescript
for (const sub of ['specification', 'technical', 'skills']) {
  const subDir = sub === 'skills'
    ? path.join(aiContextRoot, sub)
    : path.join(aiContextRoot, 'documents', sub);
  // supprime tout sauf permanent-* et .gitkeep
}
```
✅ `skills/` nettoyé à la racine, `permanent-*` conservés

---

**`src/treeview/DddTreeProvider.ts`**
```typescript
const skillsPath = path.join(aiContextRoot, 'skills');
if (fs.existsSync(skillsPath)) {
  items.push(new DddTreeItem(skillsPath, true, vscode.TreeItemCollapsibleState.Expanded));
}
```
✅ `skills/` affiché au même niveau que `documents/` dans l'arborescence

---

**`package.json` — menus**
```json
{
  "command": "ddd.newDocument",
  "when": "view == dddExplorer && viewItem == dddFolder",
  "group": "inline"
}
```
✅ La commande `ddd.newDocument` s'applique à **tout** dossier `dddFolder`, y compris `skills/`

---

## Résultat

Le plugin VSCode produit la structure suivante, identique au plugin IntelliJ (après correction) :

```
.ai_context/
├── README.md
├── CONTRACT.md
├── CONTEXT.md
├── context.json
├── history.log
├── skills/                ← à la racine, côte à côte avec documents/
└── documents/
    ├── done/
    ├── specification/
    └── technical/
```

