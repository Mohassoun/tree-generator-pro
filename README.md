# Tree Generator Pro

A VS Code extension that generates a professional file tree from your workspace or selection.

---

## Author

* **Programmer:** Mohamad Hassoun
* **Portfolio:** https://portfoliohassoun.web.app/
* **Email:** [mohamadhassoun21698@gmail.com](mailto:mohamadhassoun21698@gmail.com)

---

## Features

* Generates a structured tree representation of files and folders.
* Supports **WebView** and **text output** modes.
* Includes **copy-to-clipboard** workflows.
* Works from **workspace root** or **selected folder**.

---

## Usage

### Step 1 — Generate Tree

Right-click on a folder or open the Command Palette and run one of the commands:

* `Tree Generator: Generate From Selection`
* `Tree Generator: Generate From Workspace Root`
* `Tree Generator: Generate To Clipboard`

![Step 1](./images/step_1.webp)

---

### Step 2 — View the Generated Tree

The extension will generate a structured tree view of your files and folders.

You can also:

* Copy the tree
* Copy file names only
* Expand or collapse folders

![Step 2](./images/step_2.webp)

---

## Development

### Prerequisites

* Node.js
* npm

### Setup

1. Clone the repository.
2. Run:

```
npm install
```

3. Build the extension:

```
npm run compile
```

4. Press **F5** in VS Code to launch the extension in debug mode.

If `npm` is not available globally on your machine, this workspace includes a portable Node.js runtime under:

```
node-v20.11.1-win-x64/
```

Pressing **F5** in VS Code will use the local runtime via:

```
.vscode/tasks.json
```

---

## Testing

Run the following command for static checks:

```
npm run lint
```

Currently, the project does not include an automated test suite.
