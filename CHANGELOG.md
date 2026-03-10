# Changelog

All notable changes to Git Pin will be documented in this file.

## [0.2.4]

New features:

- Added **`+`** button on the Branches section header to pin any branch from a list without switching to it first
- The picker automatically excludes already-pinned branches

## [0.2.3]

New features:

- Added Pop Stash action to apply and remove stashes in one action
- Pop and Apply actions now both appear inline on pinned stash items
- Pop uses `git stash pop`, Apply uses `git stash apply`

## [0.2.2]

Updates:

- Added "Git Pin:" prefix to all command titles for better organization in Command Palette

## [0.2.1]

Improvements:

- Moved pin actions from the shared view title to the Branches and Stashes subtree headers
- Added section-specific inline icons to reduce confusion between branch and stash pinning

## [0.2.0]

New features:

- Merged pinned branches and pinned stashes into a single **Pinned** view
- Added top-level Branches and Stashes sections inside the same view
- Unified refresh action for all pinned items

## [0.1.1]

Bug fixes:

- Fixed activation error when Git extension is not yet loaded
- Made Git extension integration optional and non-blocking

## [0.1.0]

New features:

- Pin and unpin Git stashes
- View pinned stashes in the Source Control sidebar
- Quick apply functionality for stashes
- Visual indicators for existing and missing stashes
- Persistent storage of pinned stashes per workspace

## [0.0.1]

Initial release of Git Pin:

- Pin and unpin Git branches
- View pinned branches in the Source Control sidebar
- Quick checkout functionality
- Visual indicators for current and missing branches
- Auto-refresh on branch changes
