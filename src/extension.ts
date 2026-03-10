import * as vscode from 'vscode';

import { GitHelper } from './gitHelper';
import { PinnedBranch, PinnedBranchesProvider } from './pinnedBranchesProvider';
import { PinnedStash, PinnedStashesProvider } from './pinnedStashesProvider';

export async function activate(context: vscode.ExtensionContext) {
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

  // Create stash tree data provider
  const pinnedStashesProvider = new PinnedStashesProvider(context);
  pinnedStashesProvider.setGitHelper(gitHelper);

  // Register stash tree data provider
  const stashTreeView = vscode.window.createTreeView('pinnedStashes', {
    treeDataProvider: pinnedStashesProvider,
    showCollapseAll: false,
  });

  context.subscriptions.push(stashTreeView);

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

  // Command: Pin stash from list
  const pinStashCommand = vscode.commands.registerCommand(
    'git-pin.pinStash',
    async () => {
      const stashes = await gitHelper.getStashes();
      if (stashes.length === 0) {
        vscode.window.showInformationMessage('No stashes found');
        return;
      }

      const items = stashes.map((stash) => ({
        label: `stash@{${stash.index}}`,
        description: stash.message,
        index: stash.index,
        message: stash.message,
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a stash to pin',
      });

      if (selected) {
        await pinnedStashesProvider.pinStash(selected.index, selected.message);
      }
    },
  );

  // Command: Unpin stash
  const unpinStashCommand = vscode.commands.registerCommand(
    'git-pin.unpinStash',
    async (item: PinnedStash) => {
      if (item && item.stashIndex !== undefined && item.message) {
        await pinnedStashesProvider.unpinStash(item.stashIndex, item.message);
      } else {
        // Show quick pick if called from command palette
        const pinnedStashes = pinnedStashesProvider.getPinnedStashes();
        if (pinnedStashes.length === 0) {
          vscode.window.showInformationMessage('No pinned stashes');
          return;
        }

        const items = pinnedStashes.map((stash) => ({
          label: `stash@{${stash.index}}`,
          description: stash.message,
          index: stash.index,
          message: stash.message,
        }));

        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: 'Select a stash to unpin',
        });

        if (selected) {
          await pinnedStashesProvider.unpinStash(
            selected.index,
            selected.message,
          );
        }
      }
    },
  );

  // Command: Apply stash
  const applyStashCommand = vscode.commands.registerCommand(
    'git-pin.applyStash',
    async (item: PinnedStash) => {
      if (item && item.stashIndex !== undefined && item.exists) {
        const success = await gitHelper.applyStash(item.stashIndex);
        if (success) {
          // Refresh the view to check if stash still exists
          setTimeout(() => pinnedStashesProvider.refresh(), 500);
        }
      }
    },
  );

  // Command: Refresh stashes view
  const refreshStashesCommand = vscode.commands.registerCommand(
    'git-pin.refreshStashes',
    () => {
      pinnedStashesProvider.refresh();
    },
  );

  // Register all commands
  context.subscriptions.push(
    pinCurrentBranchCommand,
    unpinBranchCommand,
    checkoutBranchCommand,
    refreshCommand,
    pinStashCommand,
    unpinStashCommand,
    applyStashCommand,
    refreshStashesCommand,
  );

  // Listen for Git changes to refresh the view (optional, non-blocking)
  try {
    const gitExtension = vscode.extensions.getExtension('vscode.git');
    if (gitExtension) {
      // Activate the Git extension if not already active
      if (!gitExtension.isActive) {
        await gitExtension.activate();
      }

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
  } catch (error) {
    // Git extension integration is optional, continue without it
    console.log('Git extension not available, auto-refresh disabled', error);
  }
}

export function deactivate() {}
