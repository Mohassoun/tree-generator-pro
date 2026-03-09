import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { resolveTreeRootFromSelection } from '../../extension';

suite('Extension Test Suite', () => {
    test('Commands are registered', async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('extension.generateFromSelection'));
        assert.ok(commands.includes('extension.generateFromRoot'));
        assert.ok(commands.includes('extension.generateToClipboard'));
    });

    test('resolveTreeRootFromSelection returns selected folder path', () => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'file-branch-folder-'));
        const uri = vscode.Uri.file(tempDir);

        const root = resolveTreeRootFromSelection(uri);
        assert.strictEqual(root, tempDir);
    });

    test('resolveTreeRootFromSelection returns selected file parent path', () => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'file-branch-file-'));
        const filePath = path.join(tempDir, 'sample.txt');
        fs.writeFileSync(filePath, 'data');

        const uri = vscode.Uri.file(filePath);
        const root = resolveTreeRootFromSelection(uri);
        assert.strictEqual(root, tempDir);
    });
});
