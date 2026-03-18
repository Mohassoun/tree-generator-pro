# Build and Release Task: file-branch-1.0.4

## Current Status
On branch main. Modified files: README.md, package-lock.json, package.json, src/extension.ts.
Untracked: TODO.md, images/explorer-tree.svg, src/treeDataProvider.ts.

## Steps:
- [ ] 1. Create and switch to branch: `git checkout -b file-branch-1.0.4`
- [ ] 2. Add all changes: `git add .`
- [ ] 3. Commit: `git commit -m \"Build v1.0.4: add treeDataProvider.ts, TODO.md, images, sync version, updates to extension.ts/package.json/README.md\"`
- [ ] 4. Push branch: `git push -u origin file-branch-1.0.4`
- [ ] 5. Sync deps: `npm install`
- [ ] 6. Compile: `npm run compile`
- [ ] 7. Install vsce: `npm install -g @vscode/vsce`
- [ ] 8. Package VSIX: `vsce package`
- [ ] 9. Test extension load
- [ ] 10. [Optional] Create PR with gh CLI
