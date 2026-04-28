import * as vscode from 'vscode';
import { findNearest } from '../utils/fileUtils';

export async function viewDone(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('DDD: Open a file first to find the nearest DONE.md.');
    return;
  }

  const currentFile = editor.document.uri.fsPath;

  // Try DONE.md first, then MIGRATION_DONE.md
  const donePath =
    findNearest(currentFile, 'DONE.md') ??
    findNearest(currentFile, 'MIGRATION_DONE.md');

  if (!donePath) {
    vscode.window.showWarningMessage(
      'DDD: No DONE.md found in the current DDD context.'
    );
    return;
  }

  const uri = vscode.Uri.file(donePath);
  await vscode.window.showTextDocument(uri, {
    viewColumn: vscode.ViewColumn.Beside,
    preserveFocus: false,
  });
}

