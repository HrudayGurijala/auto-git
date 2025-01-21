import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

let filesEffected: number = 0;
let fileWatcher: vscode.FileSystemWatcher | undefined;


// get the local git repo path 
//get interval time from user

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
"Code never lies, comments sometimes do."];

const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];


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


    fs.readFile(readmePath, 'utf8', (err, data) => {
        if(data.length === 0){
            fs.appendFile(readmePath, structure+content, (err) => {
                if (err) {
                    vscode.window.showErrorMessage(`Failed to append to README.md: ${err.message}`);
                }
            });
        }else{
            fs.appendFile(readmePath, content, (err) => {
                if (err) {
                    vscode.window.showErrorMessage(`Failed to append to README.md: ${err.message}`);
                } else {
                    vscode.window.showInformationMessage('Successfully appended to README.md');
                    commitAndPushChanges(repoPath);
                }
            });
        }
    });

    if (!fs.existsSync(repoPath)) {
        fs.mkdirSync(repoPath, { recursive: true });
    }

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
    let appendToReadmeCommand = vscode.commands.registerCommand('autogit.appendToReadme', () => {
        const fileDetails = getCurrentFileDetails();
        if (fileDetails && fileDetails.currentDirectory) {
            if(filesEffected === 0){
                vscode.window.showInformationMessage(`No files affected.\n\n ${randomQuote}`);
            }else{
                appendToReadme(fileDetails.fileName, fileDetails.currentDirectory, filesEffected);
                filesEffected = 0;
            }
        } else {
            vscode.window.showInformationMessage('No active editor or files affected');
        }
    });
    context.subscriptions.push(appendToReadmeCommand);

    vscode.commands.executeCommand('autogit.appendToReadme').then(
        () => {
            console.log('Command autogit.appendToReadme executed on startup.');
        },
        (err) => {
            vscode.window.showErrorMessage(`Failed to execute command on startup: ${err.message}`);
        }
    );

    const watcher = setupFileWatcher();
    context.subscriptions.push(watcher);

    const intervalHandle = setInterval(() => {
        const fileDetails = getCurrentFileDetails();
        if (fileDetails && fileDetails.currentDirectory) {
            if(filesEffected === 0){
                vscode.window.showInformationMessage(`No files affected.\n\n ${randomQuote}`);
            }else{
                appendToReadme(fileDetails.fileName, fileDetails.currentDirectory, filesEffected);
                filesEffected = 0;
            }
        }
    }, 15000);

    context.subscriptions.push({
        dispose: () => clearInterval(intervalHandle),
    });
}


export function deactivate() {
    if (fileWatcher) {
        fileWatcher.dispose();
    }
}