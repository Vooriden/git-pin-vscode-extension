# Git Pin

A Visual Studio Code extension that allows you to pin your favorite Git branches and stashes for quick access and easy switching.

## Features

- **Pin Branches**: Pin any Git branch to keep it easily accessible
- **Pin Stashes**: Pin Git stashes to quickly find and apply them later
- **Quick Checkout**: Click on a pinned branch to quickly check it out
- **Quick Apply**: Click on a pinned stash to apply it to your working directory
- **Visual Indicators**: See which branch is currently active and which branches/stashes still exist
- **Persistent Storage**: Pinned branches and stashes are stored per workspace
- **Easy Management**: Pin and unpin branches and stashes with simple commands

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

### Pin a Stash

1. Click the pin icon (📌) in the "Pinned Stashes" view title bar
2. Select the stash you want to pin from the list
3. Or use the Command Palette: `Pin Stash`

### Apply a Pinned Stash

- Click on any pinned stash in the "Pinned Stashes" view to apply it
- Or click the archive icon next to the stash name
- The stash will be applied to your working directory (equivalent to `git stash apply`)

### Unpin a Stash

- Click the unpin icon next to a pinned stash in the view
- Or use the Command Palette: `Unpin Stash` and select from the list

### Refresh the View

- Click the refresh icon in the view title bar
- The view automatically refreshes when you switch branches

## View

The extension provides two views in the Source Control sidebar:

### Pinned Branches

Shows your pinned branches with:

- ✅ **Current branch** - marked with a green check icon and "(current)" label
- ⚠️ **Missing branches** - branches that no longer exist, marked with a warning icon
- 🌿 **Available branches** - branches that exist and can be checked out

### Pinned Stashes

Shows your pinned stashes with:

- 📦 **Available stashes** - stashes that exist and can be applied, showing stash index
- ⚠️ **Missing stashes** - stashes that no longer exist, marked with a warning icon

## Commands

This extension contributes the following commands:

**Branch Commands:**

- `git-pin.pinCurrentBranch` - Pin the current Git branch
- `git-pin.unpinBranch` - Unpin a branch
- `git-pin.checkoutBranch` - Checkout a pinned branch
- `git-pin.refresh` - Refresh the pinned branches view

**Stash Commands:**

- `git-pin.pinStash` - Pin a Git stash
- `git-pin.unpinStash` - Unpin a stash
- `git-pin.applyStash` - Apply a pinned stash
- `git-pin.refreshStashes` - Refresh the pinned stashes view

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

This extension stores pinned branches and stashes in the workspace state. No additional configuration is required.

## Known Issues

- The extension requires Git to be available in the system PATH
- Remote branches are supported but may show as "not found" if not fetched locally

## Release Notes

### 0.1.1

Bug fixes:

- Fixed activation error when Git extension is not yet loaded
- Made Git extension integration optional and non-blocking

### 0.1.0

New features:

- Pin and unpin Git stashes
- View pinned stashes in the Source Control sidebar
- Quick apply functionality for stashes
- Visual indicators for existing and missing stashes
- Persistent storage of pinned stashes per workspace

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
