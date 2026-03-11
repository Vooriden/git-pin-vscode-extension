import * as vscode from 'vscode';

export type OcticonName = 'git-branch' | 'package' | 'check' | 'alert';

export type OcticonPath = {
  light: vscode.Uri;
  dark: vscode.Uri;
};

export type OcticonMap = Record<OcticonName, OcticonPath>;

export class OcticonHelper {
  constructor(private readonly extensionUri: vscode.Uri) {}

  createMap(): OcticonMap {
    return {
      'git-branch': this.getPath('git-branch'),
      package: this.getPath('package'),
      check: this.getPath('check'),
      alert: this.getPath('alert'),
    };
  }

  private getPath(name: OcticonName): OcticonPath {
    return {
      light: vscode.Uri.joinPath(
        this.extensionUri,
        'media',
        'octicons',
        'light',
        `${name}-16.svg`,
      ),
      dark: vscode.Uri.joinPath(
        this.extensionUri,
        'media',
        'octicons',
        'dark',
        `${name}-16.svg`,
      ),
    };
  }
}
