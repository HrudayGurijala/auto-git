import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

let filesEffected: number = 0;
let fileWatcher: vscode.FileSystemWatcher | undefined;

const quotes = [
    "Code is like humor. When you have to explain it, it’s bad.",
    "First, solve the problem. Then, write the code.",
    "Experience is the name everyone gives to their mistakes.",
    "In order to be irreplaceable, one must always be different.",
    "Java is to JavaScript what car is to Carpet.",
    "Knowledge is power.",
    "Sometimes it pays to stay in bed on Monday, rather than spending the rest of the week debugging Monday’s code.",
    "Perfection is achieved not when there is nothing more to add, but rather when there is nothing more to take away.",
    "Ruby is rubbish! PHP is phpantastic!",
    "Code never lies, comments sometimes do."
];

function getRandomQuote() {
    return quotes[Math.floor(Math.random() * quotes.length)];
}

function getCurrentFileDetails() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const currentFile = editor.document.uri;
        const filePath = currentFile.fsPath;
        const fileName = path.basename(filePath);
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(currentFile);
        const currentDirectory = workspaceFolder ? workspaceFolder.uri.fsPath : undefined;

        return { fileName, filePath, currentDirectory };
    }
    return null;
}

function setupFileWatcher() {
    if (fileWatcher){
        fileWatcher.dispose();
    }
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
        const currentDirectory = workspaceFolder ? workspaceFolder.uri.fsPath : undefined;
        // const currentDirectory = path.dirname(editor.document.uri.fsPath);
        fileWatcher = vscode.workspace.createFileSystemWatcher(`${currentDirectory}/**/*`);

        fileWatcher.onDidChange(() => filesEffected++);
        fileWatcher.onDidCreate(() => filesEffected++);
        fileWatcher.onDidDelete(() => filesEffected++);
    }
    return fileWatcher;
}

function getRepoPath(): string | null {
    return vscode.workspace.getConfiguration('autogit').get<string>('repoPath') || null;
}

function appendToReadme(fileName: string, directory: string, filesEffected: number) {
    const repoPath = getRepoPath();
    if (!repoPath) {
        vscode.window.showErrorMessage('Repository path is not set. Use the "Set Repository Path" command.');
        return;
    }

    const readmePath = path.join(repoPath, 'README.md');
    const timeStamp = new Date().toUTCString();
    const content = `| ${fileName} | ${directory} | ${filesEffected} | ${timeStamp} |\n`;
    const structure = `| File Name | Directory | Files affected | Time Stamp |\n|:---:|:---:|:---:|:---:|\n| ${fileName} | ${directory} | ${filesEffected} | ${timeStamp} |\n`;

    if (!fs.existsSync(repoPath)) {
        fs.mkdirSync(repoPath, { recursive: true });
    }
    fs.readFile(readmePath, 'utf8', (err, data) => {
        if(data.length === 0){
            fs.appendFile(readmePath, structure, (err) => {
                if (err) {
                    vscode.window.showErrorMessage(`Failed to append to README.md: ${err.message}`);
                }
            });
        }else{
            fs.appendFile(readmePath, content, (err) => {
                if (err) {
                    vscode.window.showErrorMessage(`Failed to append to README.md: ${err.message}`);
                } else {
                    vscode.window.showInformationMessage('Successfully appended to README.md in the specific repo');
                    commitAndPushChanges(repoPath);
                }
            });
        }});

    commitAndPushChanges(repoPath);
}

function commitAndPushChanges(repoPath: string) {
    const commands = [
        'git add README.md',
        'git commit -m "code logs"',
        'git push'
    ];

    exec(commands.join(' && '), { cwd: repoPath }, (err, stdout, stderr) => {
        if (err) {
            // vscode.window.showErrorMessage(`Failed to push changes to GitHub: ${err.message}`);
            console.error('Git error:', err);
        } else {
            vscode.window.showInformationMessage('Successfully pushed changes to GitHub');
        }
    });
}

function setRepoPath() {
    vscode.window.showInputBox({
        prompt: 'Enter the path to your local Git repository',
        value: getRepoPath() || '',
        ignoreFocusOut: true
    }).then((path) => {
        if (path) {
            vscode.workspace.getConfiguration('autogit').update('repoPath', path, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage(`Repository path set to: ${path}`);
        }
    });
}

export function activate(context: vscode.ExtensionContext) {
    const watcher = setupFileWatcher();
    if (watcher) {
        context.subscriptions.push(watcher);
    }

    context.subscriptions.push(
        vscode.commands.registerCommand('autogit.setRepoPath', setRepoPath)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('autogit.appendToReadme', () => {

            const intervalHandle = setInterval(() => {
                const fileDetails = getCurrentFileDetails();
                if (fileDetails && fileDetails.currentDirectory) {
                    if (filesEffected === 0) {
                        vscode.window.showInformationMessage(`No files affected.\n\n${getRandomQuote()}`);
                    } else {
                        appendToReadme(fileDetails.fileName, fileDetails.currentDirectory, filesEffected);
                        filesEffected = 0;
                    }
                }else
                {
                    vscode.window.showInformationMessage('No active editor or files affected');
                }
            }, 30*60*1000);
            // }, 30 * 1000);

            context.subscriptions.push({
                dispose: () => clearInterval(intervalHandle)
            });
        })
    );





    vscode.commands.executeCommand('autogit.appendToReadme').then(
        () => {
            console.log('Command autogit.appendToReadme executed on startup.');
        },
        (err) => {
            vscode.window.showErrorMessage(`Failed to execute command on startup: ${err.message}`);
        }
    );
}

export function deactivate() {
    if (fileWatcher){ fileWatcher.dispose();}
}

//just a test
//lets see if this extension works
//i'll meet you at 8:38am

