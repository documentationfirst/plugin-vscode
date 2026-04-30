# Contexte — Ajout du dossier `skills/` et alignement plugins

*Démarré : 2026-04-30*

---

## Description

Vérification et finalisation du support du dossier `skills/` dans le plugin VSCode,
en cohérence avec le plugin IntelliJ (où un bug a été corrigé : `documents/skills/` → `skills/`).
Le plugin VSCode avait déjà la bonne position pour `skills/` dans `TemplateGenerator.ts`
et `DddTreeProvider.ts`. Aucun code n'était à modifier — la tâche consistait à documenter
l'état réel de l'implémentation et à mettre en ordre le `.ai_context/` du projet.

---

## Todo

- [x] Vérifier `scaffoldInit` dans `TemplateGenerator.ts` : `skills/` à la racine ✅
- [x] Vérifier `scaffoldNewContext` : `skills/` nettoyé sauf `permanent-*` ✅
- [x] Vérifier `DddTreeProvider.ts` : `skills/` affiché côte à côte avec `documents/` ✅
- [x] Vérifier `package.json` : `ddd.newDocument` s'applique à tout `dddFolder` ✅
- [x] Rédiger `specs-functional.md` dans `documents/specification/`
- [x] Rédiger le fichier `done/` résumant l'état de l'implémentation
- [x] `DddTreeProvider` : `contextValue = 'dddSkillsFolder'` + icône `mortar-board`
- [x] Créer `commands/newSkill.ts` avec template dédié
- [x] Enregistrer `ddd.newSkill` dans `extension.ts`
- [x] Déclarer `ddd.newSkill` dans `package.json` + menu inline `dddSkillsFolder`
- [x] Rédiger `done/skills-implementation.md`
