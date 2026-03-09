import * as fs from 'fs';
import * as path from 'path';

export type SortMode = 'alphabetical' | 'byType';

export interface TreeSettings {
    excludedFolders: string[];
    maxDepth: number;
    showHiddenFiles: boolean;
    outputMode: 'webview' | 'text';
    foldersFirst: boolean;
    sortMode: SortMode;
    timeoutMs: number;
    maxItems: number;
}

export interface TreeLine {
    depth: number;
    prefix: string;
    name: string;
    fullPath: string;
    isDirectory: boolean;
}

export interface TreeBuildResult {
    rootPath: string;
    lines: TreeLine[];
    totalItems: number;
    warnings: string[];
    timedOut: boolean;
    truncated: boolean;
}

type Entry = {
    name: string;
    fullPath: string;
    isDirectory: boolean;
    extension: string;
};

export function buildTree(rootPath: string, settings: TreeSettings): TreeBuildResult {
    const excluded = new Set(settings.excludedFolders.map((entry) => entry.trim()).filter(Boolean));
    const warnings: string[] = [];
    const lines: TreeLine[] = [];
    const deadline = Date.now() + Math.max(500, settings.timeoutMs);
    let timedOut = false;
    let truncated = false;

    const pushWarning = (message: string) => {
        if (warnings.length < 10) {
            warnings.push(message);
        }
    };

    const walk = (dirPath: string, prefix: string, depth: number) => {
        if (Date.now() > deadline) {
            timedOut = true;
            return;
        }
        if (lines.length >= settings.maxItems) {
            truncated = true;
            return;
        }
        if (depth > settings.maxDepth) {
            return;
        }

        const entries = readEntries(dirPath, settings, excluded, pushWarning);
        if (!entries) {
            return;
        }

        const sorted = sortEntries(entries, settings);
        sorted.forEach((entry, index) => {
            if (Date.now() > deadline) {
                timedOut = true;
                return;
            }
            if (lines.length >= settings.maxItems) {
                truncated = true;
                return;
            }

            const isLast = index === sorted.length - 1;
            const connector = isLast ? '\\-- ' : '+-- ';
            lines.push({
                depth,
                prefix: prefix + connector,
                name: entry.name,
                fullPath: entry.fullPath,
                isDirectory: entry.isDirectory
            });

            if (entry.isDirectory) {
                const nextPrefix = prefix + (isLast ? '    ' : '|   ');
                walk(entry.fullPath, nextPrefix, depth + 1);
            }
        });
    };

    walk(rootPath, '', 0);

    if (timedOut) {
        pushWarning(`Stopped early due to timeout (${settings.timeoutMs} ms).`);
    }
    if (truncated) {
        pushWarning(`Stopped after ${settings.maxItems} items to keep the extension responsive.`);
    }

    return {
        rootPath,
        lines,
        totalItems: lines.length,
        warnings,
        timedOut,
        truncated
    };
}

export function toTextTree(result: TreeBuildResult): string {
    const header = `Root: ${result.rootPath}\nItems: ${result.totalItems}\n`;
    const body = result.lines.map((line) => `${line.prefix}${line.name}`).join('\n');
    const warningBlock = result.warnings.length > 0 ? `\n\nWarnings:\n- ${result.warnings.join('\n- ')}` : '';
    return `${header}\n${body || '(No files found)'}${warningBlock}`;
}

function readEntries(
    dirPath: string,
    settings: TreeSettings,
    excluded: Set<string>,
    pushWarning: (message: string) => void
): Entry[] | undefined {
    let names: string[];
    try {
        names = fs.readdirSync(dirPath);
    } catch (error) {
        pushWarning(`Skipped unreadable folder: ${dirPath}`);
        return undefined;
    }

    const entries: Entry[] = [];
    names.forEach((name) => {
        if (!settings.showHiddenFiles && name.startsWith('.')) {
            return;
        }

        const fullPath = path.join(dirPath, name);
        let stat: fs.Stats;
        try {
            stat = fs.statSync(fullPath);
        } catch {
            pushWarning(`Skipped unreadable path: ${fullPath}`);
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

    return entries;
}

function sortEntries(entries: Entry[], settings: TreeSettings): Entry[] {
    return [...entries].sort((a, b) => {
        if (settings.foldersFirst && a.isDirectory !== b.isDirectory) {
            return a.isDirectory ? -1 : 1;
        }

        if (settings.sortMode === 'byType') {
            const extCmp = a.extension.localeCompare(b.extension);
            if (extCmp !== 0) {
                return extCmp;
            }
        }

        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
}
