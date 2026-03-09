import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { buildTree, SortMode, TreeSettings, toTextTree } from './treeGenerator';
import { showTreeWebview } from './treeWebview';

const CONFIG_SECTION = 'treeGenerator';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.generateFromSelection', async (resource?: vscode.Uri) => {
            const rootPath = resolveTreeRootFromSelection(resource);
            if (!rootPath) {
                return;
            }
            await generateAndPresentTree(rootPath, false);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('extension.generateFromRoot', async () => {
            const rootPath = resolveWorkspaceRoot();
            if (!rootPath) {
                return;
            }
            await generateAndPresentTree(rootPath, false);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('extension.generateToClipboard', async (resource?: vscode.Uri) => {
            const rootPath = resolveTreeRootFromSelection(resource) ?? resolveWorkspaceRoot();
            if (!rootPath) {
                return;
            }
            await generateAndPresentTree(rootPath, true);
        })
    );
}

export function deactivate() {}

export function resolveTreeRootFromSelection(resource?: vscode.Uri): string | undefined {
    if (!resource?.fsPath) {
        return undefined;
    }

    try {
        const stat = fs.statSync(resource.fsPath);
        return stat.isDirectory() ? resource.fsPath : path.dirname(resource.fsPath);
    } catch {
        vscode.window.showErrorMessage(`Selected path is not accessible: ${resource.fsPath}`);
        return undefined;
    }
}

export function resolveWorkspaceRoot(): string | undefined {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
        vscode.window.showErrorMessage('No workspace folder open.');
        return undefined;
    }
    return folders[0].uri.fsPath;
}

async function generateAndPresentTree(rootPath: string, forceClipboard: boolean): Promise<void> {
    const settings = getSettings();

    const result = await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: 'Generating file tree...',
            cancellable: false
        },
        async () => buildTree(rootPath, settings)
    );

    if (result.warnings.length > 0) {
        vscode.window.showWarningMessage(`Tree generated with ${result.warnings.length} warning(s). Open output for details.`);
    }

    const textTree = toTextTree(result);
    if (forceClipboard) {
        await vscode.env.clipboard.writeText(textTree);
        vscode.window.showInformationMessage(`Tree copied to clipboard (${result.totalItems} items).`);
        return;
    }

    if (settings.outputMode === 'text') {
        const document = await vscode.workspace.openTextDocument({
            language: 'text',
            content: textTree
        });
        await vscode.window.showTextDocument(document, { preview: false });
        return;
    }

    await showTreeWebview(result);
}

function getSettings(): TreeSettings {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    return {
        excludedFolders: config.get<string[]>('excludedFolders', ['.git', 'node_modules', '.vscode-test']),
        maxDepth: clamp(config.get<number>('maxDepth', 8), 0, 50),
        showHiddenFiles: config.get<boolean>('showHiddenFiles', false),
        outputMode: config.get<'webview' | 'text'>('outputMode', 'webview'),
        foldersFirst: config.get<boolean>('foldersFirst', true),
        sortMode: config.get<SortMode>('sortMode', 'alphabetical'),
        timeoutMs: clamp(config.get<number>('timeoutMs', 5000), 500, 60000),
        maxItems: clamp(config.get<number>('maxItems', 5000), 100, 100000)
    };
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}
