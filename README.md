# Tree Generator Pro

A VS Code extension that generates a professional file tree from your workspace or selection.

## Author

- Programmer: Mohamad Hassoun
- Portfolio: https://portfoliohassoun.web.app/
- Email: mohamadhassoun21698@gmail.com

## Features

- Generates a structured tree representation of files and folders.
- Supports webview and text output modes.
- Includes copy-to-clipboard workflows.

## Usage

1. Open a workspace in VS Code.
2. Run one of these commands from Command Palette:
   - `Tree Generator: Generate From Selection`
   - `Tree Generator: Generate From Workspace Root`
   - `Tree Generator: Generate To Clipboard`
3. View the result in webview or text mode based on extension settings.

## Development

### Prerequisites

- Node.js
- npm

### Setup

1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Run `npm run compile` to build the extension.
4. Press F5 to launch the extension in debug mode.

If `npm` is not available globally on your machine, this workspace includes a portable Node.js runtime under `node-v20.11.1-win-x64/`.
In VS Code, pressing F5 uses the local runtime via `.vscode/tasks.json`.

### Testing

Run `npm run lint` for static checks. The project currently has no automated test suite.
