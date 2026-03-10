import * as cp from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';

const exec = promisify(cp.exec);

export class GitHelper {
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  async getCurrentBranch(): Promise<string | undefined> {
    try {
      const { stdout } = await exec('git rev-parse --abbrev-ref HEAD', {
        cwd: this.workspaceRoot,
      });
      return stdout.trim();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to get current branch: ${error}`);
      return undefined;
    }
  }

  async getAllBranches(): Promise<string[]> {
    try {
      const { stdout } = await exec(
        'git branch --all --format="%(refname:short)"',
        {
          cwd: this.workspaceRoot,
        },
      );
      return stdout
        .trim()
        .split('\n')
        .filter((branch) => branch.length > 0);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to get branches: ${error}`);
      return [];
    }
  }

  async checkoutBranch(branchName: string): Promise<boolean> {
    try {
      await exec(`git checkout "${branchName}"`, {
        cwd: this.workspaceRoot,
      });
      vscode.window.showInformationMessage(`Checked out branch: ${branchName}`);
      return true;
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to checkout branch: ${error}`);
      return false;
    }
  }

  async branchExists(branchName: string): Promise<boolean> {
    try {
      await exec(`git rev-parse --verify "${branchName}"`, {
        cwd: this.workspaceRoot,
      });
      return true;
    } catch {
      return false;
    }
  }

  async getStashes(): Promise<{ index: number; message: string }[]> {
    try {
      const { stdout } = await exec('git stash list', {
        cwd: this.workspaceRoot,
      });
      if (!stdout.trim()) {
        return [];
      }

      return stdout
        .trim()
        .split('\n')
        .map((line) => {
          const match = line.match(/^stash@\{(\d+)\}: (.+)$/);
          if (match) {
            return {
              index: parseInt(match[1], 10),
              message: match[2],
            };
          }
          return null;
        })
        .filter(
          (stash): stash is { index: number; message: string } =>
            stash !== null,
        );
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to get stashes: ${error}`);
      return [];
    }
  }

  async applyStash(stashIndex: number): Promise<boolean> {
    try {
      await exec(`git stash apply stash@{${stashIndex}}`, {
        cwd: this.workspaceRoot,
      });
      vscode.window.showInformationMessage(
        `Applied stash stash@{${stashIndex}}`,
      );
      return true;
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to apply stash: ${error}`);
      return false;
    }
  }

  async popStash(stashIndex: number): Promise<boolean> {
    try {
      await exec(`git stash pop stash@{${stashIndex}}`, {
        cwd: this.workspaceRoot,
      });
      vscode.window.showInformationMessage(
        `Popped stash stash@{${stashIndex}}`,
      );
      return true;
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to pop stash: ${error}`);
      return false;
    }
  }

  async stashExists(stashIndex: number): Promise<boolean> {
    try {
      await exec(`git rev-parse --verify stash@{${stashIndex}}`, {
        cwd: this.workspaceRoot,
      });
      return true;
    } catch {
      return false;
    }
  }
}
