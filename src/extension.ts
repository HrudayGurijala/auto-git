import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

let filesEffected: number = 0;
let fileWatcher: vscode.FileSystemWatcher | undefined;

// Function to get current file details
function getCurrentFileDetails() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const currentFile = editor.document.uri;
        const filePath = currentFile.fsPath;
        const fileName = path.basename(filePath);
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(currentFile);
        const currentDirectory = workspaceFolder ? workspaceFolder.uri.fsPath : undefined;

        return {
            fileName,
            filePath,
            currentDirectory,
            filesEffected
        };
    }
    return null;
}

function setupFileWatcher() {
    if (fileWatcher) {
        fileWatcher.dispose();
    }

    fileWatcher = vscode.workspace.createFileSystemWatcher('**/*');

    fileWatcher.onDidChange(() => {
        filesEffected++;
        console.log(`Files affected: ${filesEffected}`);
    });

    fileWatcher.onDidCreate(() => {
        filesEffected++;
        console.log(`Files affected: ${filesEffected}`);
    });

    fileWatcher.onDidDelete(() => {
        filesEffected++;
        console.log(`Files affected: ${filesEffected}`);
    });

    return fileWatcher;
}

function appendToReadme(fileName: string, directory: string, filesEffected: number) {
    const repoPath = 'C:/Users/gurij/OneDrive/Desktop/code_logs';
    const readmePath = path.join(repoPath, 'README.md');
    const timeStamp = new Date().toUTCString();
    const content = `| ${fileName} | ${directory} | ${filesEffected} | ${timeStamp} |\n`;
    const structure = `| File Name | Directory | Files affected | Time Stamp |\n|:---:|:---:|:---:|:---:|\n`;

    if (!fs.existsSync(repoPath)) {
        fs.mkdirSync(repoPath, { recursive: true });
    }

    if (!fs.existsSync(readmePath)) {
        fs.writeFileSync(readmePath, structure);
    }

    fs.appendFile(readmePath, content, (err) => {
        if (err) {
            vscode.window.showErrorMessage(`Failed to append to README.md: ${err.message}`);
        } else {
            vscode.window.showInformationMessage('Successfully appended to README.md');
            commitAndPushChanges(repoPath);
        }
    });
}

function commitAndPushChanges(repoPath: string) {
    const commands = [
        'git add README.md',
        'git commit -m "code logs"',
        'git push'
    ];

    exec(commands.join(' && '), { cwd: repoPath }, (err, stdout, stderr) => {
        if (err) {
            vscode.window.showErrorMessage(`Failed to push changes to GitHub: ${err.message}`);
            console.error('Git error:', stderr);
        } else {
            vscode.window.showInformationMessage('Successfully pushed changes to GitHub');
        }
    });
}

export function activate(context: vscode.ExtensionContext) {
    const watcher = setupFileWatcher();
    context.subscriptions.push(watcher);

    // Register getFileInfo command
    // let getFileInfoDisposable = vscode.commands.registerCommand('autogit.getFileInfo', () => {
    //     const fileDetails = getCurrentFileDetails();
    //     if (fileDetails) {
    //         vscode.window.showInformationMessage(`Files affected: ${fileDetails.filesEffected}`);
    //     } else {
    //         vscode.window.showInformationMessage('No active editor');
    //     }
    // });
    // context.subscriptions.push(getFileInfoDisposable);

    let appendToReadmeDisposable = vscode.commands.registerCommand('autogit.appendToReadme', () => {
        const intervalHandle = setInterval(() => {
            const fileDetails = getCurrentFileDetails();
            if (fileDetails && fileDetails.currentDirectory) {
                // vscode.window.showInformationMessage(`Files affected: ${fileDetails.filesEffected}`);
                appendToReadme(fileDetails.fileName, fileDetails.currentDirectory, filesEffected);
                filesEffected = 0;
            } else {
                vscode.window.showInformationMessage('No active editor or workspace folder');
            }
        }, 15000); 

        // Clear interval on dispose
        context.subscriptions.push({
            dispose: () => clearInterval(intervalHandle)
        });
    });
    context.subscriptions.push(appendToReadmeDisposable);
}

export function deactivate() {
    if (fileWatcher) {
        fileWatcher.dispose();
    }
}