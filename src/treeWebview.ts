import * as path from 'path';
import * as vscode from 'vscode';
import { TreeBuildResult, toTextTree } from './treeGenerator';

export async function showTreeWebview(result: TreeBuildResult): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
        'treeGeneratorView',
        `Tree: ${path.basename(result.rootPath) || result.rootPath}`,
        vscode.ViewColumn.Active,
        {
            enableScripts: true,
            enableFindWidget: true
        }
    );

    panel.webview.html = buildTreeHtml(result);
    panel.webview.onDidReceiveMessage(async (message) => {
        if (message?.type === 'copy') {
            await vscode.env.clipboard.writeText(toTextTree(result));
            vscode.window.showInformationMessage('Tree copied to clipboard.');
        }
        if (message?.type === 'copyWarnings' && result.warnings.length > 0) {
            await vscode.env.clipboard.writeText(result.warnings.join('\n'));
            vscode.window.showInformationMessage('Warnings copied to clipboard.');
        }
        if (message?.type === 'copyNamesDone') {
            vscode.window.showInformationMessage('Names copied to clipboard.');
        }
    });
}

function buildTreeHtml(result: TreeBuildResult): string {
    const nonce = getNonce();
    const linesHtml = result.lines
        .map((line) => {
            const kindClass = line.isDirectory ? 'dir' : 'file';
            return `<div class="line" data-depth="${line.depth}">
<span class="prefix">${escapeHtml(line.prefix)}</span><span class="${kindClass}">${escapeHtml(line.name)}</span>
</div>`;
        })
        .join('\n');

    const warnings = result.warnings.length > 0
        ? `<div class="warnings">
<strong>Warnings</strong>
<ul>${result.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join('')}</ul>
<button id="copyWarnings">Copy Warnings</button>
</div>`
        : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<style>
:root {
  color-scheme: light dark;
}
body {
  margin: 0;
  color: var(--vscode-editor-foreground);
  background: var(--vscode-editor-background);
  font-family: var(--vscode-editor-font-family), Consolas, 'Courier New', monospace;
  font-size: var(--vscode-editor-font-size);
  line-height: 1.5;
}
.header {
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 10px 12px;
  border-bottom: 1px solid var(--vscode-panel-border);
  background: var(--vscode-sideBar-background);
}
.title {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}
.root {
  color: var(--vscode-breadcrumb-foreground);
  word-break: break-all;
}
.count {
  color: var(--vscode-descriptionForeground);
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
button {
  border: 1px solid var(--vscode-button-border, transparent);
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  padding: 4px 10px;
  cursor: pointer;
}
button:hover {
  background: var(--vscode-button-hoverBackground);
}
.button-secondary {
  background: var(--vscode-editorWidget-background);
  color: var(--vscode-foreground);
  border-color: var(--vscode-panel-border);
}
.button-secondary:hover {
  background: var(--vscode-list-hoverBackground);
}
.toolbar-note {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border: 1px solid var(--vscode-panel-border);
  color: var(--vscode-descriptionForeground);
}
.content {
  padding: 12px;
}
.line {
  white-space: pre;
}
.prefix {
  color: var(--vscode-disabledForeground);
}
.dir {
  color: var(--vscode-symbolIcon-folderForeground);
  font-weight: 600;
}
.file {
  color: var(--vscode-symbolIcon-fileForeground);
}
.collapsed {
  display: none;
}
.warnings {
  margin: 12px;
  padding: 10px;
  border: 1px solid var(--vscode-inputValidation-warningBorder);
  background: var(--vscode-inputValidation-warningBackground);
  color: var(--vscode-inputValidation-warningForeground);
}
.warnings ul {
  margin-top: 6px;
}
</style>
</head>
<body>
  <div class="header">
    <div class="title">
      <span class="root">Root: ${escapeHtml(result.rootPath)}</span>
      <span class="count">Items: ${result.totalItems}</span>
    </div>
    <div class="actions">
      <button id="copyTree">Copy Tree</button>
      <button id="copyNames" class="button-secondary">Copy Names Only</button>
      <button id="expandAll" class="button-secondary">Expand All</button>
      <button id="collapseAll" class="button-secondary">Collapse All</button>
    </div>
  </div>
  ${warnings}
  <div class="content">
    ${linesHtml || '<div>(No files found)</div>'}
  </div>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const lines = Array.from(document.querySelectorAll('.line'));

    document.getElementById('copyTree').addEventListener('click', () => {
      vscode.postMessage({ type: 'copy' });
    });
    document.getElementById('copyNames').addEventListener('click', () => {
      const names = lines.map((line) => {
        const nameEl = line.querySelector('.dir, .file');
        return nameEl ? nameEl.textContent : '';
      }).filter(Boolean).join('\\n');
      navigator.clipboard.writeText(names).then(() => {
        vscode.postMessage({ type: 'copyNamesDone' });
      });
    });

    const copyWarnings = document.getElementById('copyWarnings');
    if (copyWarnings) {
      copyWarnings.addEventListener('click', () => {
        vscode.postMessage({ type: 'copyWarnings' });
      });
    }

    document.getElementById('collapseAll').addEventListener('click', () => {
      lines.forEach((line) => {
        const depth = Number(line.getAttribute('data-depth') || '0');
        line.classList.toggle('collapsed', depth > 0);
      });
    });

    document.getElementById('expandAll').addEventListener('click', () => {
      lines.forEach((line) => line.classList.remove('collapsed'));
    });
  </script>
</body>
</html>`;
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getNonce(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let value = '';
    for (let i = 0; i < 24; i += 1) {
        value += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return value;
}
