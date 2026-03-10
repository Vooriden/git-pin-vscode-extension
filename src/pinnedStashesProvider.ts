import * as vscode from 'vscode';

import { GitHelper } from './gitHelper';

export class PinnedStash extends vscode.TreeItem {
  constructor(
    public readonly stashIndex: number,
    public readonly message: string,
    public readonly exists: boolean,
  ) {
    super(message, vscode.TreeItemCollapsibleState.None);

    this.tooltip = `stash@{${stashIndex}}: ${message}`;
    this.contextValue = 'pinnedStash';

    // Set icon based on state
    if (!exists) {
      this.iconPath = new vscode.ThemeIcon(
        'warning',
        new vscode.ThemeColor('charts.yellow'),
      );
      this.description = '(not found)';
    } else {
      this.iconPath = new vscode.ThemeIcon('archive');
      this.description = `stash@{${stashIndex}}`;
    }

    // Make it clickable to apply
    if (exists) {
      this.command = {
        command: 'git-pin.applyStash',
        title: 'Apply Stash',
        arguments: [this],
      };
    }
  }
}

export class PinnedStashesProvider implements vscode.TreeDataProvider<PinnedStash> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    PinnedStash | undefined | null | void
  > = new vscode.EventEmitter<PinnedStash | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    PinnedStash | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private pinnedStashes: Array<{ index: number; message: string }> = [];
  private gitHelper: GitHelper | undefined;

  constructor(private context: vscode.ExtensionContext) {
    this.loadPinnedStashes();
  }

  setGitHelper(gitHelper: GitHelper) {
    this.gitHelper = gitHelper;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: PinnedStash): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: PinnedStash): Promise<PinnedStash[]> {
    if (element) {
      return [];
    }

    if (this.pinnedStashes.length === 0) {
      return [];
    }

    const items: PinnedStash[] = [];

    for (const stash of this.pinnedStashes) {
      const exists = (await this.gitHelper?.stashExists(stash.index)) ?? false;
      items.push(new PinnedStash(stash.index, stash.message, exists));
    }

    return items;
  }

  async pinStash(stashIndex: number, message: string): Promise<void> {
    const existingIndex = this.pinnedStashes.findIndex(
      (s) => s.index === stashIndex && s.message === message,
    );

    if (existingIndex === -1) {
      this.pinnedStashes.push({ index: stashIndex, message });
      await this.savePinnedStashes();
      this.refresh();
      vscode.window.showInformationMessage(
        `Pinned stash: stash@{${stashIndex}}`,
      );
    } else {
      vscode.window.showInformationMessage(
        `Stash already pinned: stash@{${stashIndex}}`,
      );
    }
  }

  async unpinStash(stashIndex: number, message: string): Promise<void> {
    const index = this.pinnedStashes.findIndex(
      (s) => s.index === stashIndex && s.message === message,
    );
    if (index > -1) {
      this.pinnedStashes.splice(index, 1);
      await this.savePinnedStashes();
      this.refresh();
      vscode.window.showInformationMessage(
        `Unpinned stash: stash@{${stashIndex}}`,
      );
    }
  }

  getPinnedStashes(): Array<{ index: number; message: string }> {
    return [...this.pinnedStashes];
  }

  private loadPinnedStashes(): void {
    this.pinnedStashes = this.context.workspaceState.get<
      Array<{ index: number; message: string }>
    >('pinnedStashes', []);
  }

  private async savePinnedStashes(): Promise<void> {
    await this.context.workspaceState.update(
      'pinnedStashes',
      this.pinnedStashes,
    );
  }
}
