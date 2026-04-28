import * as vscode from 'vscode';
import { TemplateGenerator } from '../generator/TemplateGenerator';
import { aiMdFilesPath } from '../utils/fileUtils';
import { DddTreeProvider } from '../treeview/DddTreeProvider';

export async function newFeatureContext(
  context: vscode.ExtensionContext,
  treeProvider: DddTreeProvider
): Promise<void> {
  const aiMdRoot = aiMdFilesPath();
  if (!aiMdRoot) {
    vscode.window.showErrorMessage('DDD: No workspace folder found.');
    return;
  }

  const featureName = await vscode.window.showInputBox({
    prompt: 'Feature name (e.g. authentication, notifications)',
    placeHolder: 'feature-name',
    validateInput: (value: any) => {
      if (!value || value.trim() === '') { return 'Feature name cannot be empty'; }
      if (!/^[a-z0-9-_]+$/i.test(value.trim())) {
        return 'Use only letters, numbers, hyphens, and underscores';
      }
      return undefined;
    },
  });

  if (!featureName) { return; }

  const generator = new TemplateGenerator(context.extensionPath);
  const openFile = generator.scaffoldFeature(aiMdRoot, featureName.trim().toLowerCase());

  treeProvider.refresh();

  const uri = vscode.Uri.file(openFile);
  await vscode.window.showTextDocument(uri);

  vscode.window.showInformationMessage(
    `DDD ✅ Feature context created: ai_md_files/features/${featureName}/`
  );
}

