import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { aiContextPath } from '../utils/fileUtils';

// ─── Tree Item ───────────────────────────────────────────────────────────────

export class DddTreeItem extends vscode.TreeItem {
  constructor(
    public readonly fullPath: string,
    public readonly isDirectory: boolean,
    collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    const baseName = path.basename(fullPath);
    const isPermanent = !isDirectory && baseName.startsWith('permanent-');
    const isDoneFile  = !isDirectory && path.basename(path.dirname(fullPath)) === 'done';

    const displayName = isPermanent ? baseName.replace('permanent-', '') : baseName;
    super(displayName, collapsibleState);

    this.resourceUri = vscode.Uri.file(fullPath);

    if (!isDirectory) {
      this.command = {
        command: 'vscode.open',
        title: 'Open',
        arguments: [vscode.Uri.file(fullPath)],
      };
      this.contextValue = 'dddFile';

      if (isPermanent) {
        this.iconPath = new vscode.ThemeIcon('bookmark', new vscode.ThemeColor('charts.purple'));
        this.description = '★ permanent';
      } else if (isDoneFile) {
        this.iconPath = new vscode.ThemeIcon('check', new vscode.ThemeColor('disabledForeground'));
      } else {
        this.iconPath = new vscode.ThemeIcon('markdown');
      }
    } else {
      this.iconPath = new vscode.ThemeIcon('folder');
      this.contextValue = 'dddFolder';
    }
  }
}

// ─── Tree Data Provider ──────────────────────────────────────────────────────

export class DddTreeProvider implements vscode.TreeDataProvider<DddTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<DddTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: DddTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: DddTreeItem): vscode.ProviderResult<DddTreeItem[]> {
    const aiContextRoot = aiContextPath();
    const documentsRoot = aiContextRoot ? path.join(aiContextRoot, 'documents') : undefined;

    if (!documentsRoot || !fs.existsSync(documentsRoot)) {
      return [
        new DddTreeItem(
          'No .ai_context/ found — run: Initialize Context',
          false,
          vscode.TreeItemCollapsibleState.None
        )
      ];
    }

    const dirToRead = element ? element.fullPath : documentsRoot;

    if (!fs.statSync(dirToRead).isDirectory()) { return []; }

    const entries = fs.readdirSync(dirToRead, { withFileTypes: true });
    const dirs  = entries.filter((e: fs.Dirent) => e.isDirectory());
    const files = entries.filter((e: fs.Dirent) => !e.isDirectory() && e.name !== '.gitkeep');

    return [...dirs, ...files].map(entry => {
      const fullPath = path.join(dirToRead, entry.name);
      const isDir = entry.isDirectory();
      return new DddTreeItem(
        fullPath,
        isDir,
        isDir ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None
      );
    });
  }
}
