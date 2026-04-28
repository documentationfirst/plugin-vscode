import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function workspaceRoot(): string | undefined {
  if (process.env['DDD_TEST_ROOT']) {
    return process.env['DDD_TEST_ROOT'];
  }
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

export function aiContextPath(): string | undefined {
  const root = workspaceRoot();
  return root ? path.join(root, '.ai_context') : undefined;
}

// Keep for backward compat during transition
export function aiMdFilesPath(): string | undefined {
  return aiContextPath();
}

export function exists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

export function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

export function writeFile(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

export function appendFile(filePath: string, content: string): void {
  fs.appendFileSync(filePath, content, 'utf8');
}

export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function nowIso(): string {
  return new Date().toISOString();
}
