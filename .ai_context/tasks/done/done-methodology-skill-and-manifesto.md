# Done — Manifesto update + methodology skill at init

*Completed: 2026-05-16*

---

## What was done

Deux évolutions majeures :
1. Ajout du skill `permanent-methodology.md` généré automatiquement à l'init du contexte
2. Mise à jour du manifesto (index.html, fanzine, poster) pour refléter le nouveau positionnement "Agentif DDD Framework for Developers" et les nouvelles références (GitAgent Protocol, article Markdown, fichiers -preview et -test)

---

## Changes

### `src/generator/TemplateGenerator.ts`

**Nouvelle fonction `methodologySkillMd()`**
- Génère `skills/permanent-methodology.md` à l'init (si absent)
- Contenu : ordre de lecture des fichiers `.ai_context/`, protocole de session en 4 étapes (Read → Spec → Implement → Done), conventions artefacts (`spec-*-preview.html`, `done-*-test.html`), règles de communication
- Le fichier est préfixé `permanent-` : il survit à tous les resets de contexte

**`scaffoldInit()`** : appel de `methodologySkillMd()` lors de la création du dossier `skills/`

---

### `manifesto/index.html`

- **Hero** : badge → *"Agentif DDD Framework for Developers — v2.0 — 2026"* + sous-titre enrichi
- **TOC** : 2 nouvelles entrées (⑤ Preview & Test Artefacts, ⑩ GitAgent Protocol & Interoperability), numérotation mise à jour
- **Nouvelle section `#preview-test`** (après file-types) :
  - Explication des fichiers `spec-*-preview.html` (validation visuelle avant code) et `done-*-test.html` (test runner acceptance sans framework)
  - Tableau artefacts : spec.md / preview.html / done.md / test.html
  - Convention `permanent-` applicable
- **Nouvelle section `#gitagent`** (après scientific-proof) :
  - GitAgent Protocol : Git comme bus de communication agents/humains, complémentarité avec DDD
  - Réponse à l'article "Markdown was a mistake for agent output" : dans DDD, les humains écrivent le Markdown, les agents le lisent — inverse du problème décrit
  - Tableau : AI chat output vs DDD context files vs DDD done/ reports

### `manifesto/fanzine/index.html`
- Couverture : *"An agentif DDD framework for developers. Structure your context. Harness your agent. Own your knowledge."*
- Page "What's Next" : nouvelle section Preview/Test + DDD+GitAgent + callout Markdown question

### `manifesto/poster/index.html`
- Header subtitle → "Agentif DDD Framework for Developers"
- Badge → "DDD Framework v2.0 — 2026"

---

## Result

- Tout nouveau projet initialisé avec le plugin reçoit automatiquement `skills/permanent-methodology.md`
- L'agent connaît dès le premier init : l'ordre de lecture, le protocole spec→code→done, les conventions preview/test, les règles de communication
- Le manifesto positionne clairement DDD comme framework agentif développeur-centré avec ancrage dans les références externes (GitAgent, Microsoft Research, Naur)

