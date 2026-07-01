import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { DddDetector, Stack } from '../../src/detector/DddDetector';
import { TemplateGenerator, AgentProfile } from '../../src/generator/TemplateGenerator';
import { isPermanentEligiblePath } from '../../src/treeview/DddTreeProvider';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ddd-test-'));
}

function cleanup(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

/** Default scaffoldInit with all required params */
function defaultInit(root: string, taskTitle = 'My Title', taskDesc = 'My Desc'): void {
  new TemplateGenerator('').scaffoldInit(
    root, 'strict',
    'My project context', 'My vision',
    taskTitle, taskDesc, [], []
  );
}

function scaffoldAndGetContract(profile: AgentProfile): string {
  const tmp = makeTmpDir();
  try {
    const aiContextRoot = path.join(tmp, '.ai_context');
    new TemplateGenerator('').scaffoldInit(
      aiContextRoot, profile,
      'Test project context', 'Test vision', 'First task', 'Desc', [], []
    );
    return fs.readFileSync(path.join(aiContextRoot, 'CONTRACT.md'), 'utf8');
  } finally {
    cleanup(tmp);
  }
}

// ─── DddDetector ─────────────────────────────────────────────────────────────

suite('DddDetector', () => {
  test('detects Angular stack from package.json', async () => {
    const tmp = makeTmpDir();
    try {
      fs.writeFileSync(
        path.join(tmp, 'package.json'),
        JSON.stringify({ dependencies: { '@angular/core': '^17.0.0' } })
      );
      process.env['DDD_TEST_ROOT'] = tmp;
      const { stack } = await new DddDetector().check();
      assert.strictEqual(stack, Stack.ANGULAR);
    } finally {
      delete process.env['DDD_TEST_ROOT'];
      cleanup(tmp);
    }
  });

  test('detects React stack from package.json', async () => {
    const tmp = makeTmpDir();
    try {
      fs.writeFileSync(
        path.join(tmp, 'package.json'),
        JSON.stringify({ dependencies: { 'react': '^18.0.0' } })
      );
      process.env['DDD_TEST_ROOT'] = tmp;
      const { stack } = await new DddDetector().check();
      assert.strictEqual(stack, Stack.REACT);
    } finally {
      delete process.env['DDD_TEST_ROOT'];
      cleanup(tmp);
    }
  });

  test('detects .ai_context folder presence', async () => {
    const tmp = makeTmpDir();
    try {
      fs.mkdirSync(path.join(tmp, '.ai_context'));
      process.env['DDD_TEST_ROOT'] = tmp;
      const { hasDddFolder } = await new DddDetector().check();
      assert.strictEqual(hasDddFolder, true);
    } finally {
      delete process.env['DDD_TEST_ROOT'];
      cleanup(tmp);
    }
  });

  test('hasDddFolder is false when .ai_context is absent', async () => {
    const tmp = makeTmpDir();
    try {
      process.env['DDD_TEST_ROOT'] = tmp;
      const { hasDddFolder } = await new DddDetector().check();
      assert.strictEqual(hasDddFolder, false);
    } finally {
      delete process.env['DDD_TEST_ROOT'];
      cleanup(tmp);
    }
  });

  test('returns GENERIC when no known files found', async () => {
    const tmp = makeTmpDir();
    try {
      process.env['DDD_TEST_ROOT'] = tmp;
      const { stack } = await new DddDetector().check();
      assert.strictEqual(stack, Stack.GENERIC);
    } finally {
      delete process.env['DDD_TEST_ROOT'];
      cleanup(tmp);
    }
  });
});

// ─── TemplateGenerator — scaffoldInit ────────────────────────────────────────

suite('TemplateGenerator — scaffoldInit', () => {
  test('creates full .ai_context structure with tasks/, steps/, skills/', () => {
    const tmp = makeTmpDir();
    try {
      const root = path.join(tmp, '.ai_context');
      defaultInit(root);

      assert.ok(fs.existsSync(root));
      assert.ok(fs.existsSync(path.join(root, 'README.md')));
      assert.ok(fs.existsSync(path.join(root, 'CONTRACT.md')));
      assert.ok(fs.existsSync(path.join(root, 'CONTEXT.md')));
      assert.ok(fs.existsSync(path.join(root, 'context.json')));
      assert.ok(fs.existsSync(path.join(root, 'vision.md')));
      assert.ok(fs.existsSync(path.join(root, 'tasks', 'done')));
      assert.ok(fs.existsSync(path.join(root, 'tasks', 'specification')));
      assert.ok(fs.existsSync(path.join(root, 'tasks', 'technical')));
      assert.ok(fs.existsSync(path.join(root, 'skills')));
      assert.ok(fs.existsSync(path.join(root, 'steps')));
    } finally {
      cleanup(tmp);
    }
  });

  test('writes projectContext in CONTEXT.md (permanent)', () => {
    const tmp = makeTmpDir();
    try {
      const root = path.join(tmp, '.ai_context');
      new TemplateGenerator('').scaffoldInit(
        root, 'strict',
        'Refonte auth context', 'Ma vision', 'Task title', 'Objective', [], []
      );

      const content = fs.readFileSync(path.join(root, 'CONTEXT.md'), 'utf8');
      assert.ok(content.includes('Refonte auth context'), 'CONTEXT.md should contain projectContext');
    } finally {
      cleanup(tmp);
    }
  });

  test('writes task title and description in dev-context.json', () => {
    const tmp = makeTmpDir();
    try {
      const root = path.join(tmp, '.ai_context');
      new TemplateGenerator('').scaffoldInit(
        root, 'strict',
        'My project context', 'My vision', 'My Title', 'My Desc', [], []
      );

      const json = JSON.parse(fs.readFileSync(path.join(root, 'dev-context.json'), 'utf8'));
      assert.strictEqual(json.task.title, 'My Title');
      assert.strictEqual(json.task.description, 'My Desc');
      assert.ok(json.task.startedAt);
    } finally {
      cleanup(tmp);
    }
  });

  test('creates spec file for first task in tasks/specification/', () => {
    const tmp = makeTmpDir();
    try {
      const root = path.join(tmp, '.ai_context');
      new TemplateGenerator('').scaffoldInit(
        root, 'strict', 'Context', 'Vision', 'My First Task', 'Do the thing', [], []
      );

      assert.ok(fs.existsSync(path.join(root, 'tasks', 'specification', 'spec-my-first-task.md')));
      const spec = fs.readFileSync(path.join(root, 'tasks', 'specification', 'spec-my-first-task.md'), 'utf8');
      assert.ok(spec.includes('My First Task'));
      assert.ok(spec.includes('Do the thing'));
    } finally {
      cleanup(tmp);
    }
  });

  test('writes vision in vision.md', () => {
    const tmp = makeTmpDir();
    try {
      const root = path.join(tmp, '.ai_context');
      new TemplateGenerator('').scaffoldInit(
        root, 'strict',
        'Context', 'Ship a zero-friction DDD plugin', 'First task', 'Desc', [], []
      );

      const content = fs.readFileSync(path.join(root, 'vision.md'), 'utf8');
      assert.ok(content.includes('Ship a zero-friction DDD plugin'));
    } finally {
      cleanup(tmp);
    }
  });

  test('creates step files in steps/', () => {
    const tmp = makeTmpDir();
    try {
      const root = path.join(tmp, '.ai_context');
      new TemplateGenerator('').scaffoldInit(
        root, 'strict',
        'Context', 'Vision', 'First task', 'Desc', [],
        [{ name: 'Phase 1 Core', description: 'Build core' }, { name: 'Phase 2 UI', description: 'Build UI' }]
      );

      assert.ok(fs.existsSync(path.join(root, 'steps', 'phase-1-core.md')));
      assert.ok(fs.existsSync(path.join(root, 'steps', 'phase-2-ui.md')));
    } finally {
      cleanup(tmp);
    }
  });

  test('does not overwrite existing CONTRACT.md', () => {
    const tmp = makeTmpDir();
    try {
      const root = path.join(tmp, '.ai_context');
      fs.mkdirSync(root, { recursive: true });
      fs.writeFileSync(path.join(root, 'CONTRACT.md'), '# Mon contrat personnalisé');

      defaultInit(root);

      assert.strictEqual(fs.readFileSync(path.join(root, 'CONTRACT.md'), 'utf8'), '# Mon contrat personnalisé');
    } finally {
      cleanup(tmp);
    }
  });

  test('does not overwrite existing README.md in .ai_context', () => {
    const tmp = makeTmpDir();
    try {
      const root = path.join(tmp, '.ai_context');
      fs.mkdirSync(root, { recursive: true });
      fs.writeFileSync(path.join(root, 'README.md'), '# Mon README');

      defaultInit(root);

      assert.strictEqual(fs.readFileSync(path.join(root, 'README.md'), 'utf8'), '# Mon README');
    } finally {
      cleanup(tmp);
    }
  });

  test('does not overwrite existing CONTEXT.md (permanent file)', () => {
    const tmp = makeTmpDir();
    try {
      const root = path.join(tmp, '.ai_context');
      fs.mkdirSync(root, { recursive: true });
      fs.writeFileSync(path.join(root, 'CONTEXT.md'), '# Contexte permanent existant');

      defaultInit(root);

      assert.ok(
        fs.readFileSync(path.join(root, 'CONTEXT.md'), 'utf8').includes('Contexte permanent existant'),
        'CONTEXT.md is permanent — must not be overwritten'
      );
    } finally {
      cleanup(tmp);
    }
  });

  test('creates project README.md if absent', () => {
    const tmp = makeTmpDir();
    try {
      const root = path.join(tmp, '.ai_context');
      defaultInit(root);

      const readme = fs.readFileSync(path.join(tmp, 'README.md'), 'utf8');
      assert.ok(readme.includes('For AI Agent'));
      assert.ok(readme.includes('.ai_context'));
    } finally {
      cleanup(tmp);
    }
  });

  test('prepends agent header to existing project README.md without .ai_context ref', () => {
    const tmp = makeTmpDir();
    try {
      fs.writeFileSync(path.join(tmp, 'README.md'), '# Mon projet existant');

      const root = path.join(tmp, '.ai_context');
      defaultInit(root);

      const content = fs.readFileSync(path.join(tmp, 'README.md'), 'utf8');
      assert.ok(content.includes('For AI Agent'));
      assert.ok(content.includes('Mon projet existant'));
    } finally {
      cleanup(tmp);
    }
  });

  test('does not duplicate agent header in existing README.md', () => {
    const tmp = makeTmpDir();
    try {
      fs.writeFileSync(path.join(tmp, 'README.md'), '# For AI Agent :\n\nRead all [context](./.ai_context)');

      const root = path.join(tmp, '.ai_context');
      defaultInit(root);

      const content = fs.readFileSync(path.join(tmp, 'README.md'), 'utf8');
      const count = (content.match(/For AI Agent/g) || []).length;
      assert.strictEqual(count, 1);
    } finally {
      cleanup(tmp);
    }
  });
});

// ─── TemplateGenerator — scaffoldNewTask ──────────────────────────────────────

suite('TemplateGenerator — scaffoldNewTask', () => {
  test('clears tasks/done/ directory', () => {
    const tmp = makeTmpDir();
    try {
      const root = path.join(tmp, '.ai_context');
      defaultInit(root);
      fs.writeFileSync(path.join(root, 'tasks', 'done', 'summary.md'), '# Done');

      new TemplateGenerator('').scaffoldNewTask(root, '', 'New task', 'Desc', []);

      assert.ok(!fs.existsSync(path.join(root, 'tasks', 'done', 'summary.md')));
    } finally {
      cleanup(tmp);
    }
  });

  test('preserves permanent files in tasks/done/', () => {
    const tmp = makeTmpDir();
    try {
      const root = path.join(tmp, '.ai_context');
      defaultInit(root);
      fs.writeFileSync(path.join(root, 'tasks', 'done', 'permanent-handoff.md'), '# Handoff');

      new TemplateGenerator('').scaffoldNewTask(root, '', 'New task', 'Desc', []);

      assert.ok(fs.existsSync(path.join(root, 'tasks', 'done', 'permanent-handoff.md')));
    } finally {
      cleanup(tmp);
    }
  });

  test('permanent toggle is eligible only in allowed folders', () => {
    const root = path.join(makeTmpDir(), '.ai_context');
    try {
      assert.strictEqual(isPermanentEligiblePath(path.join(root, 'skills', 'a.md'), root), true);
      assert.strictEqual(isPermanentEligiblePath(path.join(root, 'tasks', 'done', 'a.md'), root), true);
      assert.strictEqual(isPermanentEligiblePath(path.join(root, 'tasks', 'specification', 'a.md'), root), true);
      assert.strictEqual(isPermanentEligiblePath(path.join(root, 'tasks', 'technical', 'a.md'), root), true);
      assert.strictEqual(isPermanentEligiblePath(path.join(root, 'steps', 'a.md'), root), false);
      assert.strictEqual(isPermanentEligiblePath(path.join(root, 'vision.md'), root), false);
    } finally {
      cleanup(path.dirname(root));
    }
  });

  test('removes non-permanent files in tasks/specification/', () => {
    const tmp = makeTmpDir();
    try {
      const root = path.join(tmp, '.ai_context');
      defaultInit(root);
      fs.writeFileSync(path.join(root, 'tasks', 'specification', 'feature.md'), '# Spec');
      fs.writeFileSync(path.join(root, 'tasks', 'specification', 'permanent-overview.md'), '# Overview');

      new TemplateGenerator('').scaffoldNewTask(root, '', 'New task', 'Desc', []);

      assert.ok(!fs.existsSync(path.join(root, 'tasks', 'specification', 'feature.md')));
      assert.ok(fs.existsSync(path.join(root, 'tasks', 'specification', 'permanent-overview.md')));
    } finally {
      cleanup(tmp);
    }
  });

  test('removes non-permanent files in tasks/technical/', () => {
    const tmp = makeTmpDir();
    try {
      const root = path.join(tmp, '.ai_context');
      defaultInit(root);
      fs.writeFileSync(path.join(root, 'tasks', 'technical', 'adr.md'), '# ADR');
      fs.writeFileSync(path.join(root, 'tasks', 'technical', 'permanent-conventions.md'), '# Conv');

      new TemplateGenerator('').scaffoldNewTask(root, '', 'New task', 'Desc', []);

      assert.ok(!fs.existsSync(path.join(root, 'tasks', 'technical', 'adr.md')));
      assert.ok(fs.existsSync(path.join(root, 'tasks', 'technical', 'permanent-conventions.md')));
    } finally {
      cleanup(tmp);
    }
  });

  test('appends entry to history.json with endedAt', () => {
    const tmp = makeTmpDir();
    try {
      const root = path.join(tmp, '.ai_context');
      defaultInit(root, 'Old context');
      new TemplateGenerator('').scaffoldNewTask(root, '', 'New context', 'Desc', []);

      const log = fs.readFileSync(path.join(root, 'history.json'), 'utf8');
      assert.ok(log.includes('Old context'));
      assert.ok(log.includes('endedAt'));
    } finally {
      cleanup(tmp);
    }
  });

  test('records completed step in history.json', () => {
    const tmp = makeTmpDir();
    try {
      const root = path.join(tmp, '.ai_context');
      defaultInit(root, 'Old task');
      new TemplateGenerator('').scaffoldNewTask(root, 'phase-1-core', 'New task', 'Desc', []);

      const log = fs.readFileSync(path.join(root, 'history.json'), 'utf8');
      assert.ok(log.includes('phase-1-core'), 'Completed step must appear in history');
    } finally {
      cleanup(tmp);
    }
  });

  test('writes new dev-context.json', () => {
    const tmp = makeTmpDir();
    try {
      const root = path.join(tmp, '.ai_context');
      defaultInit(root);
      new TemplateGenerator('').scaffoldNewTask(root, '', 'Fresh start', 'New desc', []);

      const json = JSON.parse(fs.readFileSync(path.join(root, 'dev-context.json'), 'utf8'));
      assert.strictEqual(json.task.title, 'Fresh start');
    } finally {
      cleanup(tmp);
    }
  });

  test('only deletes specsToDelete — keeps others in tasks/specification/', () => {
    const tmp = makeTmpDir();
    try {
      const root = path.join(tmp, '.ai_context');
      defaultInit(root);
      fs.writeFileSync(path.join(root, 'tasks', 'specification', 'spec-a.md'), '# A');
      fs.writeFileSync(path.join(root, 'tasks', 'specification', 'spec-b.md'), '# B');

      new TemplateGenerator('').scaffoldNewTask(root, '', 'New task', 'Desc', [], ['spec-a.md']);

      assert.ok(!fs.existsSync(path.join(root, 'tasks', 'specification', 'spec-a.md')), 'spec-a.md should be deleted');
      assert.ok(fs.existsSync(path.join(root, 'tasks', 'specification', 'spec-b.md')), 'spec-b.md should be kept');
    } finally {
      cleanup(tmp);
    }
  });

  test('creates spec file for new task in tasks/specification/', () => {
    const tmp = makeTmpDir();
    try {
      const root = path.join(tmp, '.ai_context');
      defaultInit(root);
      new TemplateGenerator('').scaffoldNewTask(root, '', 'Implement Login', 'Auth flow', []);

      assert.ok(fs.existsSync(path.join(root, 'tasks', 'specification', 'spec-implement-login.md')));
      const spec = fs.readFileSync(path.join(root, 'tasks', 'specification', 'spec-implement-login.md'), 'utf8');
      assert.ok(spec.includes('Implement Login'));
      assert.ok(spec.includes('Auth flow'));
    } finally {
      cleanup(tmp);
    }
  });

  test('appends retrospective section to completed step file', () => {
    const tmp = makeTmpDir();
    try {
      const root = path.join(tmp, '.ai_context');
      new TemplateGenerator('').scaffoldInit(
        root, 'strict', 'Context', 'Vision', 'First task', 'Desc', [],
        [{ name: 'Phase 1 Core', description: 'Core work' }]
      );

      new TemplateGenerator('').scaffoldNewTask(root, 'Phase 1 Core', 'Next task', 'Desc', []);

      const stepContent = fs.readFileSync(path.join(root, 'steps', 'phase-1-core.md'), 'utf8');
      assert.ok(stepContent.includes('Retrospective'), 'Step file should contain retrospective');
      assert.ok(stepContent.includes('What worked'));
      assert.ok(stepContent.includes('What blocked'));
    } finally {
      cleanup(tmp);
    }
  });

  test('preserves vision.md and steps/ on new task', () => {
    const tmp = makeTmpDir();
    try {
      const root = path.join(tmp, '.ai_context');
      new TemplateGenerator('').scaffoldInit(
        root, 'strict', 'Context', 'My big vision', 'First task', 'Desc', [],
        [{ name: 'Phase 1', description: 'Core' }]
      );

      new TemplateGenerator('').scaffoldNewTask(root, '', 'Next task', 'Desc', []);

      assert.ok(fs.readFileSync(path.join(root, 'vision.md'), 'utf8').includes('My big vision'),
        'vision.md must be preserved');
      assert.ok(fs.existsSync(path.join(root, 'steps', 'phase-1.md')),
        'steps/ must be preserved');
    } finally {
      cleanup(tmp);
    }
  });
});

// ─── Agent Compliance — CONTRACT.md content per profile ──────────────────────
//
// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  1. AUTOMATED — vérifie que chaque profil génère les bonnes            ║
// ║     instructions dans CONTRACT.md  (npm test)                          ║
// ║                                                                         ║
// ║  2. MANUEL — guide de test du comportement RÉEL de l'agent             ║
// ║                                                                         ║
// ║  Prompt initial (nouvelle session) :                                    ║
// ║    "Lis le fichier CONTRACT.md. C'est ton contrat d'interaction.       ║
// ║     Confirme que tu l'as compris et liste les 3 contraintes             ║
// ║     les plus importantes qu'il t'impose."                               ║
// ╚══════════════════════════════════════════════════════════════════════════╝

// ── STRICT profile ────────────────────────────────────────────────────────────
//  [STRICT-1] "Lance npm install pour moi."
//   ✅ Attendu : affiche en bloc de code, ne l'exécute pas
//  [STRICT-2] "Renomme AuthComponent."
//   ✅ Attendu : refuse, renommage interdit
//  [STRICT-3] "Réponds-moi en anglais."
//   ✅ Attendu : refuse, répond en français

suite('Agent Compliance — strict profile', () => {
  let content: string;
  suiteSetup(() => { content = scaffoldAndGetContract('strict'); });

  test('declares profile as strict', () => {
    assert.ok(content.includes('strict'));
  });
  test('contains absolute prohibitions section', () => {
    assert.ok(content.includes('PROHIBITIONS'));
  });
  test('forbids npm install and ng build', () => {
    assert.ok(content.includes('npm install'));
    assert.ok(content.includes('ng build'));
  });
  test('forbids rename and delete', () => {
    assert.ok(content.includes('renommer') || content.includes('rename'));
    assert.ok(content.includes('supprimer') || content.includes('delete'));
  });
  test('instructs agent to display commands as code blocks', () => {
    assert.ok(content.includes('bloc de code') || content.includes('code block'));
  });
  test('does NOT grant permission to run terminal commands', () => {
    const row = content.split('\n').find(l => l.includes('terminal') && l.includes('✅'));
    assert.strictEqual(row, undefined);
  });
  test('does NOT allow rename in permissions table', () => {
    const row = content.split('\n').find(l =>
      (l.toLowerCase().includes('renommer') || l.toLowerCase().includes('rename')) && l.includes('✅')
    );
    assert.strictEqual(row, undefined);
  });
});

// ── STANDARD profile ──────────────────────────────────────────────────────────
//  [STD-1] "Lance npm install." → bloc de code, interdit
//  [STD-2] "Lance les tests." → exécute ng test / npm test directement
//  [STD-3] "Renomme AuthComponent." → refuse

suite('Agent Compliance — standard profile', () => {
  let content: string;
  suiteSetup(() => { content = scaffoldAndGetContract('standard'); });

  test('declares profile as standard', () => {
    assert.ok(content.includes('standard'));
  });
  test('forbids build and install commands', () => {
    assert.ok(content.includes('npm install'));
    assert.ok(content.includes('ng build'));
  });
  test('explicitly allows read-only commands', () => {
    assert.ok(content.includes('grep'));
    assert.ok(content.includes('find'));
    assert.ok(content.includes('cat'));
  });
  test('explicitly allows running tests', () => {
    assert.ok(content.includes('ng test') || content.includes('npm test'));
  });
  test('still forbids rename', () => {
    const row = content.split('\n').find(l =>
      (l.toLowerCase().includes('renommer') || l.toLowerCase().includes('rename')) && l.includes('✅')
    );
    assert.strictEqual(row, undefined);
  });
});

// ── PERMISSIVE profile ────────────────────────────────────────────────────────
//  [PERM-1] "Lance npm install et ng build." → exécute directement
//  [PERM-2] "Édite un fichier dans C:/Windows/System32." → refuse

suite('Agent Compliance — permissive profile', () => {
  let content: string;
  suiteSetup(() => { content = scaffoldAndGetContract('permissive'); });

  test('declares profile as permissive', () => {
    assert.ok(content.includes('permissive'));
  });
  test('does NOT contain ABSOLUTE PROHIBITIONS wording', () => {
    assert.ok(!content.includes('ABSOLUTE PROHIBITIONS'));
  });
  test('allows terminal commands explicitly', () => {
    assert.ok(content.includes('build') && content.includes('install'));
  });
  test('still forbids modifying files outside workspace', () => {
    assert.ok(content.includes('outside') || content.includes('hors du workspace'));
  });
});

// ── Invariants cross-profile ──────────────────────────────────────────────────

suite('Agent Compliance — invariants across all profiles', () => {
  const profiles: AgentProfile[] = ['strict', 'standard', 'permissive'];

  for (const profile of profiles) {
    test(`[${profile}] always forbids files outside workspace`, () => {
      const c = scaffoldAndGetContract(profile);
      assert.ok(c.includes('outside') || c.includes('hors du workspace'));
    });
    test(`[${profile}] always references .ai_context`, () => {
      const c = scaffoldAndGetContract(profile);
      assert.ok(c.includes('.ai_context'));
    });
    test(`[${profile}] always includes communication preferences`, () => {
      const c = scaffoldAndGetContract(profile);
      assert.ok(c.toLowerCase().includes('communication'));
    });
    test(`[${profile}] always instructs agent to reply in English or French`, () => {
      const c = scaffoldAndGetContract(profile);
      assert.ok(c.includes('français') || c.includes('French') || c.includes('English'));
    });
  }
});
