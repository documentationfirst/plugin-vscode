import * as vscode from 'vscode';
import * as path from 'path';
import { exists, readFile, writeFile } from '../utils/fileUtils';
import { aiMdFilesPath, workspaceRoot } from '../utils/fileUtils';

const AGENT_FILES: Array<{ file: string; label: string }> = [
  { file: '.cursorrules', label: 'Cursor' },
  { file: 'CLAUDE.md', label: 'Claude Code' },
  { file: '.github/copilot-instructions.md', label: 'GitHub Copilot' },
  { file: 'AGENTS.md', label: 'OpenAI Codex / generic' },
];

const HEADER = (date: string) =>
  `<!-- DDD — Generated from ai_md_files/best-practices.md on ${date} -->
<!-- Do NOT edit manually — run "DDD: Generate Agent Files" to regenerate. -->

`;

export async function generateAgentFiles(): Promise<void> {
  const aiMdRoot = aiMdFilesPath();
  const root = workspaceRoot();

  if (!aiMdRoot || !root) {
    vscode.window.showErrorMessage('DDD: No workspace folder found.');
    return;
  }

  const bpPath = path.join(aiMdRoot, 'best-practices.md');
  if (!exists(bpPath)) {
    vscode.window.showErrorMessage(
      'DDD: best-practices.md not found. Run "DDD: Initialize Project" first.'
    );
    return;
  }

  const content = readFile(bpPath);
  const date = new Date().toISOString().split('T')[0];
  const fullContent = HEADER(date) + content;

  const generated: string[] = [];
  for (const { file, label } of AGENT_FILES) {
    const dest = path.join(root, file);
    writeFile(dest, fullContent);
    generated.push(`${file} (${label})`);
  }

  vscode.window.showInformationMessage(
    `DDD ✅ Agent files generated:\n${generated.join(', ')}`
  );
}

