# Git Pin

A Visual Studio Code extension that allows you to pin your favorite Git branches for quick access and easy switching.

## Features

- **Pin Branches**: Pin any Git branch to keep it easily accessible
- **Quick Checkout**: Click on a pinned branch to quickly check it out
- **Visual Indicators**: See which branch is currently active and which branches still exist
- **Persistent Storage**: Pinned branches are stored per workspace
- **Easy Management**: Pin and unpin branches with simple commands

## Usage

### Pin a Branch

1. Switch to the branch you want to pin
2. Click the pin icon (📌) in the "Pinned Branches" view title bar
3. Or use the Command Palette: `Pin Current Branch`

### Checkout a Pinned Branch

- Click on any pinned branch in the "Pinned Branches" view to check it out
- Or click the branch icon next to the branch name

### Unpin a Branch

- Click the unpin icon next to a pinned branch in the view
- Or use the Command Palette: `Unpin Branch` and select from the list

### Refresh the View

- Click the refresh icon in the view title bar
- The view automatically refreshes when you switch branches

## View

The **Pinned Branches** view appears in the Source Control sidebar and shows:

- ✅ **Current branch** - marked with a green check icon and "(current)" label
- ⚠️ **Missing branches** - branches that no longer exist, marked with a warning icon
- 🌿 **Available branches** - branches that exist and can be checked out

## Commands

This extension contributes the following commands:

- `git-pin.pinCurrentBranch` - Pin the current Git branch
- `git-pin.unpinBranch` - Unpin a branch
- `git-pin.checkoutBranch` - Checkout a pinned branch
- `git-pin.refresh` - Refresh the pinned branches view

## Requirements

- Visual Studio Code 1.80.0 or higher
- Git must be installed and available in your PATH
- A workspace with a Git repository

## Installation

### From Source

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to compile the TypeScript code
4. Press F5 to open a new VS Code window with the extension loaded

### Package the Extension

```bash
npm install -g @vscode/vsce
vsce package
```

This creates a `.vsix` file that you can install manually:

```bash
code --install-extension git-pin-0.0.1.vsix
```

## Extension Settings

This extension stores pinned branches in the workspace state. No additional configuration is required.

## Known Issues

- The extension requires Git to be available in the system PATH
- Remote branches are supported but may show as "not found" if not fetched locally

## Release Notes

### 0.0.1

Initial release of Git Pin:

- Pin and unpin Git branches
- View pinned branches in the Source Control sidebar
- Quick checkout functionality
- Visual indicators for current and missing branches
- Auto-refresh on branch changes

## Contributing

If you find any bugs or have feature requests, please file an issue on the GitHub repository.

## License

This extension is released under the MIT License.
