import * as vscode from 'vscode';

import { GitHelper } from './gitHelper';
import {
  PinnedBranchItem,
  PinnedItemsProvider,
  PinnedStashItem,
} from './pinnedItemsProvider';

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

  // Create unified tree data provider
  const pinnedItemsProvider = new PinnedItemsProvider(context);
  pinnedItemsProvider.setGitHelper(gitHelper);

  // Register single view with branch/stash sections
  const treeView = vscode.window.createTreeView('pinnedItems', {
    treeDataProvider: pinnedItemsProvider,
    showCollapseAll: false,
  });

  context.subscriptions.push(treeView);

  // Command: Pin current branch
  const pinCurrentBranchCommand = vscode.commands.registerCommand(
    'git-pin.pinCurrentBranch',
    async () => {
      const currentBranch = await gitHelper.getCurrentBranch();
      if (currentBranch) {
        await pinnedItemsProvider.pinBranch(currentBranch);
      } else {
        vscode.window.showErrorMessage('Could not determine current branch');
      }
    },
  );

  // Command: Pin branch from list
  const pinBranchFromListCommand = vscode.commands.registerCommand(
    'git-pin.pinBranchFromList',
    async () => {
      const allBranches = await gitHelper.getAllBranches();
      if (allBranches.length === 0) {
        vscode.window.showInformationMessage('No branches found');
        return;
      }

      const pinnedBranches = pinnedItemsProvider.getPinnedBranches();
      const unpinnedBranches = allBranches.filter(
        (b) => !pinnedBranches.includes(b),
      );

      if (unpinnedBranches.length === 0) {
        vscode.window.showInformationMessage('All branches are already pinned');
        return;
      }

      const selected = await vscode.window.showQuickPick(unpinnedBranches, {
        placeHolder: 'Select a branch to pin',
      });

      if (selected) {
        await pinnedItemsProvider.pinBranch(selected);
      }
    },
  );

  // Command: Unpin branch
  const unpinBranchCommand = vscode.commands.registerCommand(
    'git-pin.unpinBranch',
    async (item: PinnedBranchItem) => {
      if (item && item.branchName) {
        await pinnedItemsProvider.unpinBranch(item.branchName);
      } else {
        // Show quick pick if called from command palette
        const pinnedBranches = pinnedItemsProvider.getPinnedBranches();
        if (pinnedBranches.length === 0) {
          vscode.window.showInformationMessage('No pinned branches');
          return;
        }

        const selected = await vscode.window.showQuickPick(pinnedBranches, {
          placeHolder: 'Select a branch to unpin',
        });

        if (selected) {
          await pinnedItemsProvider.unpinBranch(selected);
        }
      }
    },
  );

  // Command: Checkout branch
  const checkoutBranchCommand = vscode.commands.registerCommand(
    'git-pin.checkoutBranch',
    async (item: PinnedBranchItem) => {
      if (item && item.branchName && item.exists) {
        const success = await gitHelper.checkoutBranch(item.branchName);
        if (success) {
          // Refresh the view to update current branch indicator
          setTimeout(() => pinnedItemsProvider.refresh(), 500);
        }
      }
    },
  );

  // Command: Refresh view
  const refreshCommand = vscode.commands.registerCommand(
    'git-pin.refresh',
    () => {
      pinnedItemsProvider.refresh();
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
        await pinnedItemsProvider.pinStash(selected.index, selected.message);
      }
    },
  );

  // Command: Unpin stash
  const unpinStashCommand = vscode.commands.registerCommand(
    'git-pin.unpinStash',
    async (item: PinnedStashItem) => {
      if (item && item.stashIndex !== undefined && item.message) {
        await pinnedItemsProvider.unpinStash(item.stashIndex, item.message);
      } else {
        // Show quick pick if called from command palette
        const pinnedStashes = pinnedItemsProvider.getPinnedStashes();
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
          await pinnedItemsProvider.unpinStash(
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
    async (item: PinnedStashItem) => {
      if (item && item.stashIndex !== undefined && item.exists) {
        const success = await gitHelper.applyStash(item.stashIndex);
        if (success) {
          // Refresh the view to check if stash still exists
          setTimeout(() => pinnedItemsProvider.refresh(), 500);
        }
      }
    },
  );

  // Command: Pop stash
  const popStashCommand = vscode.commands.registerCommand(
    'git-pin.popStash',
    async (item: PinnedStashItem) => {
      if (item && item.stashIndex !== undefined && item.exists) {
        const success = await gitHelper.popStash(item.stashIndex);
        if (success) {
          // Refresh the view to update stash list
          setTimeout(() => pinnedItemsProvider.refresh(), 500);
        }
      }
    },
  );

  // Register all commands
  context.subscriptions.push(
    pinCurrentBranchCommand,
    pinBranchFromListCommand,
    unpinBranchCommand,
    checkoutBranchCommand,
    refreshCommand,
    pinStashCommand,
    unpinStashCommand,
    applyStashCommand,
    popStashCommand,
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
          pinnedItemsProvider.refresh();
        });
      }
    }
  } catch (error) {
    // Git extension integration is optional, continue without it
    console.log('Git extension not available, auto-refresh disabled', error);
  }
}

export function deactivate() {}
