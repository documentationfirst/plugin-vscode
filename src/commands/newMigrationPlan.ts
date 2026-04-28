import * as vscode from 'vscode';
import { TemplateGenerator } from '../generator/TemplateGenerator';
import { aiMdFilesPath } from '../utils/fileUtils';
import { DddTreeProvider } from '../treeview/DddTreeProvider';

export async function newMigrationPlan(
  context: vscode.ExtensionContext,
  treeProvider: DddTreeProvider
): Promise<void> {
  const aiMdRoot = aiMdFilesPath();
  if (!aiMdRoot) {
    vscode.window.showErrorMessage('DDD: No workspace folder found.');
    return;
  }

  const migrationName = await vscode.window.showInputBox({
    prompt: 'Migration name (e.g. angular-21, db-schema-v2)',
    placeHolder: 'migration-name',
    validateInput: (value: any) => {
      if (!value || value.trim() === '') { return 'Migration name cannot be empty'; }
      if (!/^[a-z0-9-_]+$/i.test(value.trim())) {
        return 'Use only letters, numbers, hyphens, and underscores';
      }
      return undefined;
    },
  });

  if (!migrationName) { return; }

  const generator = new TemplateGenerator(context.extensionPath);
  const openFile = generator.scaffoldMigration(aiMdRoot, migrationName.trim().toLowerCase());

  treeProvider.refresh();

  const uri = vscode.Uri.file(openFile);
  await vscode.window.showTextDocument(uri);

  vscode.window.showInformationMessage(
    `DDD ✅ Migration plan created: ai_md_files/migrations/${migrationName}/`
  );
}

