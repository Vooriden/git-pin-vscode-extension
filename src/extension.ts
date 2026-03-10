import * as vscode from 'vscode';

import { GitHelper } from './gitHelper';
import { PinnedBranch, PinnedBranchesProvider } from './pinnedBranchesProvider';

export function activate(context: vscode.ExtensionContext) {
  console.log('Git Pin extension is now active');
  // Get workspace root
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showWarningMessage(
      'No workspace folder found. Git Pin requires a workspace.',
    );
    return;
  }

  const workspaceRoot = workspaceFolders[0].uri.fsPath;
  const gitHelper = new GitHelper(workspaceRoot);

  // Create tree data provider
  const pinnedBranchesProvider = new PinnedBranchesProvider(context);
  pinnedBranchesProvider.setGitHelper(gitHelper);

  // Register tree data provider
  const treeView = vscode.window.createTreeView('pinnedBranches', {
    treeDataProvider: pinnedBranchesProvider,
    showCollapseAll: false,
  });

  context.subscriptions.push(treeView);

  // Command: Pin current branch
  const pinCurrentBranchCommand = vscode.commands.registerCommand(
    'git-pin.pinCurrentBranch',
    async () => {
      const currentBranch = await gitHelper.getCurrentBranch();
      if (currentBranch) {
        await pinnedBranchesProvider.pinBranch(currentBranch);
      } else {
        vscode.window.showErrorMessage('Could not determine current branch');
      }
    },
  );

  // Command: Unpin branch
  const unpinBranchCommand = vscode.commands.registerCommand(
    'git-pin.unpinBranch',
    async (item: PinnedBranch) => {
      if (item && item.branchName) {
        await pinnedBranchesProvider.unpinBranch(item.branchName);
      } else {
        // Show quick pick if called from command palette
        const pinnedBranches = pinnedBranchesProvider.getPinnedBranches();
        if (pinnedBranches.length === 0) {
          vscode.window.showInformationMessage('No pinned branches');
          return;
        }

        const selected = await vscode.window.showQuickPick(pinnedBranches, {
          placeHolder: 'Select a branch to unpin',
        });

        if (selected) {
          await pinnedBranchesProvider.unpinBranch(selected);
        }
      }
    },
  );

  // Command: Checkout branch
  const checkoutBranchCommand = vscode.commands.registerCommand(
    'git-pin.checkoutBranch',
    async (item: PinnedBranch) => {
      if (item && item.branchName && item.exists) {
        const success = await gitHelper.checkoutBranch(item.branchName);
        if (success) {
          // Refresh the view to update current branch indicator
          setTimeout(() => pinnedBranchesProvider.refresh(), 500);
        }
      }
    },
  );

  // Command: Refresh view
  const refreshCommand = vscode.commands.registerCommand(
    'git-pin.refresh',
    () => {
      pinnedBranchesProvider.refresh();
    },
  );

  // Register all commands
  context.subscriptions.push(
    pinCurrentBranchCommand,
    unpinBranchCommand,
    checkoutBranchCommand,
    refreshCommand,
  );

  // Listen for Git changes to refresh the view
  const gitExtension = vscode.extensions.getExtension('vscode.git');
  if (gitExtension) {
    const git = gitExtension.exports;
    const api = git.getAPI(1);

    if (api && api.repositories.length > 0) {
      const repo = api.repositories[0];

      // Refresh when HEAD changes
      repo.state.onDidChange(() => {
        pinnedBranchesProvider.refresh();
      });
    }
  }
}

export function deactivate() {}
