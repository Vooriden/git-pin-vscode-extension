import * as vscode from 'vscode';

import { GitHelper } from './gitHelper';

export class PinnedBranch extends vscode.TreeItem {
  constructor(
    public readonly branchName: string,
    public readonly exists: boolean,
    public readonly isCurrent: boolean,
  ) {
    super(branchName, vscode.TreeItemCollapsibleState.None);

    this.tooltip = this.branchName;
    this.contextValue = 'pinnedBranch';

    // Set icon based on state
    if (isCurrent) {
      this.iconPath = new vscode.ThemeIcon(
        'check',
        new vscode.ThemeColor('charts.green'),
      );
      this.description = '(current)';
    } else if (!exists) {
      this.iconPath = new vscode.ThemeIcon(
        'warning',
        new vscode.ThemeColor('charts.yellow'),
      );
      this.description = '(not found)';
    } else {
      this.iconPath = new vscode.ThemeIcon('git-branch');
    }

    // Make it clickable to checkout
    if (exists && !isCurrent) {
      this.command = {
        command: 'git-pin.checkoutBranch',
        title: 'Checkout Branch',
        arguments: [this],
      };
    }
  }
}

export class PinnedBranchesProvider implements vscode.TreeDataProvider<PinnedBranch> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    PinnedBranch | undefined | null | void
  > = new vscode.EventEmitter<PinnedBranch | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    PinnedBranch | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private pinnedBranches: string[] = [];
  private gitHelper: GitHelper | undefined;

  constructor(private context: vscode.ExtensionContext) {
    this.loadPinnedBranches();
  }

  setGitHelper(gitHelper: GitHelper) {
    this.gitHelper = gitHelper;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: PinnedBranch): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: PinnedBranch): Promise<PinnedBranch[]> {
    if (element) {
      return [];
    }

    if (this.pinnedBranches.length === 0) {
      return [];
    }

    const currentBranch = await this.gitHelper?.getCurrentBranch();
    const items: PinnedBranch[] = [];

    for (const branchName of this.pinnedBranches) {
      const exists = (await this.gitHelper?.branchExists(branchName)) ?? false;
      const isCurrent = branchName === currentBranch;
      items.push(new PinnedBranch(branchName, exists, isCurrent));
    }

    return items;
  }

  async pinBranch(branchName: string): Promise<void> {
    if (!this.pinnedBranches.includes(branchName)) {
      this.pinnedBranches.push(branchName);
      await this.savePinnedBranches();
      this.refresh();
      vscode.window.showInformationMessage(`Pinned branch: ${branchName}`);
    } else {
      vscode.window.showInformationMessage(
        `Branch already pinned: ${branchName}`,
      );
    }
  }

  async unpinBranch(branchName: string): Promise<void> {
    const index = this.pinnedBranches.indexOf(branchName);
    if (index > -1) {
      this.pinnedBranches.splice(index, 1);
      await this.savePinnedBranches();
      this.refresh();
      vscode.window.showInformationMessage(`Unpinned branch: ${branchName}`);
    }
  }

  getPinnedBranches(): string[] {
    return [...this.pinnedBranches];
  }

  private loadPinnedBranches(): void {
    this.pinnedBranches = this.context.workspaceState.get<string[]>(
      'pinnedBranches',
      [],
    );
  }

  private async savePinnedBranches(): Promise<void> {
    await this.context.workspaceState.update(
      'pinnedBranches',
      this.pinnedBranches,
    );
  }
}
