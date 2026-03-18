import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { SortMode } from './treeGenerator';

type TreeEntry = {
    name: string;
    fullPath: string;
    isDirectory: boolean;
    extension: string;
};

type TreeExplorerSettings = {
    excludedFolders: string[];
    showHiddenFiles: boolean;
    foldersFirst: boolean;
    sortMode: SortMode;
};

export class CustomTreeItem extends vscode.TreeItem {
    constructor(
        public readonly fullPath: string | undefined,
        public readonly isDirectory: boolean,
        label: string,
        collapsibleState: vscode.TreeItemCollapsibleState,
        contextValue: string
    ) {
        super(label, collapsibleState);

        this.contextValue = contextValue;
        this.id = fullPath ?? `message:${label}`;
        this.tooltip = fullPath ?? label;

        if (fullPath) {
            this.resourceUri = vscode.Uri.file(fullPath);
        }

        if (isDirectory) {
            this.iconPath = vscode.ThemeIcon.Folder;
            return;
        }

        if (fullPath) {
            this.iconPath = vscode.ThemeIcon.File;
            this.command = {
                command: 'vscode.open',
                title: 'Open File',
                arguments: [vscode.Uri.file(fullPath)]
            };
            return;
        }

        this.iconPath = new vscode.ThemeIcon('info');
    }
}

export class TreeDataProvider implements vscode.TreeDataProvider<CustomTreeItem> {
    private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<CustomTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<CustomTreeItem | undefined | null | void> = this.onDidChangeTreeDataEmitter.event;

    refresh(): void {
        this.onDidChangeTreeDataEmitter.fire();
    }

    getTreeItem(element: CustomTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: CustomTreeItem): vscode.ProviderResult<CustomTreeItem[]> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return [this.createMessageItem('Open a workspace folder to browse the tree.')];
        }

        if (!element) {
            return workspaceFolders.map((folder) =>
                this.createDirectoryItem(
                    folder.name,
                    folder.uri.fsPath,
                    vscode.TreeItemCollapsibleState.Collapsed
                )
            );
        }

        if (!element.fullPath || !element.isDirectory) {
            return [];
        }

        return this.readDirectoryItems(element.fullPath);
    }

    private readDirectoryItems(dirPath: string): CustomTreeItem[] {
        const settings = this.getSettings();
        const excluded = new Set(settings.excludedFolders.map((entry) => entry.trim()).filter(Boolean));
        let names: string[];

        try {
            names = fs.readdirSync(dirPath);
        } catch {
            return [this.createMessageItem('(Unable to read folder)')];
        }

        const entries: TreeEntry[] = [];
        names.forEach((name) => {
            if (!settings.showHiddenFiles && name.startsWith('.')) {
                return;
            }

            const fullPath = path.join(dirPath, name);
            let stat: fs.Stats;
            try {
                stat = fs.statSync(fullPath);
            } catch {
                return;
            }

            const isDirectory = stat.isDirectory();
            if (isDirectory && excluded.has(name)) {
                return;
            }

            entries.push({
                name,
                fullPath,
                isDirectory,
                extension: isDirectory ? '' : path.extname(name).toLowerCase()
            });
        });

        const sortedEntries = this.sortEntries(entries, settings);
        if (sortedEntries.length === 0) {
            return [this.createMessageItem('(Empty folder)')];
        }

        return sortedEntries.map((entry) =>
            entry.isDirectory
                ? this.createDirectoryItem(entry.name, entry.fullPath, vscode.TreeItemCollapsibleState.Collapsed)
                : this.createFileItem(entry.name, entry.fullPath)
        );
    }

    private createDirectoryItem(
        label: string,
        fullPath: string,
        collapsibleState: vscode.TreeItemCollapsibleState
    ): CustomTreeItem {
        return new CustomTreeItem(fullPath, true, label, collapsibleState, 'treeNode');
    }

    private createFileItem(label: string, fullPath: string): CustomTreeItem {
        return new CustomTreeItem(fullPath, false, label, vscode.TreeItemCollapsibleState.None, 'treeNode');
    }

    private createMessageItem(label: string): CustomTreeItem {
        return new CustomTreeItem(undefined, false, label, vscode.TreeItemCollapsibleState.None, 'treeMessage');
    }

    private getSettings(): TreeExplorerSettings {
        const config = vscode.workspace.getConfiguration('treeGenerator');
        return {
            excludedFolders: config.get<string[]>('excludedFolders', ['.git', 'node_modules', '.vscode-test']),
            showHiddenFiles: config.get<boolean>('showHiddenFiles', false),
            foldersFirst: config.get<boolean>('foldersFirst', true),
            sortMode: config.get<SortMode>('sortMode', 'alphabetical')
        };
    }

    private sortEntries(entries: TreeEntry[], settings: TreeExplorerSettings): TreeEntry[] {
        return [...entries].sort((a, b) => {
            if (settings.foldersFirst && a.isDirectory !== b.isDirectory) {
                return a.isDirectory ? -1 : 1;
            }

            if (settings.sortMode === 'byType') {
                const extensionComparison = a.extension.localeCompare(b.extension);
                if (extensionComparison !== 0) {
                    return extensionComparison;
                }
            }

            return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        });
    }
}

