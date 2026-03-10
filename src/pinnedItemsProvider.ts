import * as vscode from 'vscode';

import { GitHelper } from './gitHelper';

type PinnedSectionKind = 'branches' | 'stashes';

type PinnedStashData = {
  index: number;
  message: string;
};

export class PinnedSection extends vscode.TreeItem {
  constructor(public readonly kind: PinnedSectionKind) {
    super(
      kind === 'branches' ? 'Branches' : 'Stashes',
      vscode.TreeItemCollapsibleState.Expanded,
    );

    this.contextValue =
      kind === 'branches' ? 'pinnedSectionBranches' : 'pinnedSectionStashes';
    this.iconPath = new vscode.ThemeIcon(
      kind === 'branches' ? 'git-branch' : 'archive',
    );
  }
}

export class PinnedBranchItem extends vscode.TreeItem {
  constructor(
    public readonly branchName: string,
    public readonly exists: boolean,
    public readonly isCurrent: boolean,
  ) {
    super(branchName, vscode.TreeItemCollapsibleState.None);

    this.tooltip = this.branchName;
    this.contextValue = 'pinnedBranch';

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

    if (exists && !isCurrent) {
      this.command = {
        command: 'git-pin.checkoutBranch',
        title: 'Checkout Branch',
        arguments: [this],
      };
    }
  }
}

export class PinnedStashItem extends vscode.TreeItem {
  constructor(
    public readonly stashIndex: number,
    public readonly message: string,
    public readonly exists: boolean,
  ) {
    super(message, vscode.TreeItemCollapsibleState.None);

    this.tooltip = `stash@{${stashIndex}}: ${message}`;
    this.contextValue = 'pinnedStash';

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

    if (exists) {
      this.command = {
        command: 'git-pin.applyStash',
        title: 'Apply Stash',
        arguments: [this],
      };
    }
  }
}

export type PinnedItem = PinnedSection | PinnedBranchItem | PinnedStashItem;

export class PinnedItemsProvider implements vscode.TreeDataProvider<PinnedItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    PinnedItem | undefined | null | void
  > = new vscode.EventEmitter<PinnedItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    PinnedItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private pinnedBranches: string[] = [];
  private pinnedStashes: PinnedStashData[] = [];
  private gitHelper: GitHelper | undefined;

  constructor(private context: vscode.ExtensionContext) {
    this.loadPinnedState();
  }

  setGitHelper(gitHelper: GitHelper) {
    this.gitHelper = gitHelper;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: PinnedItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: PinnedItem): Promise<PinnedItem[]> {
    if (!element) {
      return [new PinnedSection('branches'), new PinnedSection('stashes')];
    }

    if (element instanceof PinnedSection) {
      if (element.kind === 'branches') {
        return this.getBranchItems();
      }

      return this.getStashItems();
    }

    return [];
  }

  async pinBranch(branchName: string): Promise<void> {
    if (!this.pinnedBranches.includes(branchName)) {
      this.pinnedBranches.push(branchName);
      await this.savePinnedState();
      this.refresh();
      vscode.window.showInformationMessage(`Pinned branch: ${branchName}`);
      return;
    }

    vscode.window.showInformationMessage(
      `Branch already pinned: ${branchName}`,
    );
  }

  async unpinBranch(branchName: string): Promise<void> {
    const index = this.pinnedBranches.indexOf(branchName);
    if (index > -1) {
      this.pinnedBranches.splice(index, 1);
      await this.savePinnedState();
      this.refresh();
      vscode.window.showInformationMessage(`Unpinned branch: ${branchName}`);
    }
  }

  getPinnedBranches(): string[] {
    return [...this.pinnedBranches];
  }

  async pinStash(stashIndex: number, message: string): Promise<void> {
    const existingIndex = this.pinnedStashes.findIndex(
      (s) => s.index === stashIndex && s.message === message,
    );

    if (existingIndex === -1) {
      this.pinnedStashes.push({ index: stashIndex, message });
      await this.savePinnedState();
      this.refresh();
      vscode.window.showInformationMessage(
        `Pinned stash: stash@{${stashIndex}}`,
      );
      return;
    }

    vscode.window.showInformationMessage(
      `Stash already pinned: stash@{${stashIndex}}`,
    );
  }

  async unpinStash(stashIndex: number, message: string): Promise<void> {
    const index = this.pinnedStashes.findIndex(
      (s) => s.index === stashIndex && s.message === message,
    );
    if (index > -1) {
      this.pinnedStashes.splice(index, 1);
      await this.savePinnedState();
      this.refresh();
      vscode.window.showInformationMessage(
        `Unpinned stash: stash@{${stashIndex}}`,
      );
    }
  }

  getPinnedStashes(): PinnedStashData[] {
    return [...this.pinnedStashes];
  }

  private async getBranchItems(): Promise<PinnedBranchItem[]> {
    const currentBranch = await this.gitHelper?.getCurrentBranch();
    const items: PinnedBranchItem[] = [];

    for (const branchName of this.pinnedBranches) {
      const exists = (await this.gitHelper?.branchExists(branchName)) ?? false;
      const isCurrent = branchName === currentBranch;
      items.push(new PinnedBranchItem(branchName, exists, isCurrent));
    }

    return items;
  }

  private async getStashItems(): Promise<PinnedStashItem[]> {
    const items: PinnedStashItem[] = [];

    for (const stash of this.pinnedStashes) {
      const exists = (await this.gitHelper?.stashExists(stash.index)) ?? false;
      items.push(new PinnedStashItem(stash.index, stash.message, exists));
    }

    return items;
  }

  private loadPinnedState(): void {
    this.pinnedBranches = this.context.workspaceState.get<string[]>(
      'pinnedBranches',
      [],
    );
    this.pinnedStashes = this.context.workspaceState.get<PinnedStashData[]>(
      'pinnedStashes',
      [],
    );
  }

  private async savePinnedState(): Promise<void> {
    await this.context.workspaceState.update(
      'pinnedBranches',
      this.pinnedBranches,
    );
    await this.context.workspaceState.update(
      'pinnedStashes',
      this.pinnedStashes,
    );
  }
}
