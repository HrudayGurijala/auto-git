import * as vscode from 'vscode';
var exec = require('child_process').exec;
import * as fs from 'fs';
import * as path from 'path';
const editor = vscode.window.activeTextEditor;

// Function to get current file details
function getCurrentFileDetails() {
    if (editor) {

	// 	var message ='';

	// 	exec('find -type f -newermt "2025-01-20 00:00:00" \! -newermt "2025-01-20 17:55:00"',
    // function (error:any, stdout:any, stderr:any) {
	// 	message = stdout;
    //     console.log('stdout: ' + stdout);
    //     console.log('stderr: ' + stderr);
    //     if (error !== null) {
    //          console.log('exec error: ' + error);
    //     }
    // });
        const currentFile = editor.document.uri;
        const filePath = currentFile.fsPath;
        const fileName = currentFile.fsPath.split(/[\\/]/).pop();
        
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(currentFile);
        const currentDirectory = workspaceFolder ? workspaceFolder.uri.fsPath : undefined;
        
        return {
			// message,
            fileName,
            filePath,
            currentDirectory
        };
    }
    return null;
}


function appendToReadme(fileName: any, directory: string) {
    const repoPath = 'C:/Users/gurij/OneDrive/Desktop/code_logs'; 
    const readmePath = path.join(repoPath, 'README.md');
    const timeStamp = new Date().toUTCString();
    const content = `| ${fileName} | ${directory} | ${timeStamp} |`;
    const structure = `## Code Logs\n\n
    | Filename | Directory | Time-Stamp |
    \n|:---------|:---------:|-----------:|`;
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
        }
                
    });
}

function commitAndPushChanges(repoPath: string) {
    const commands = [
        'git add README.md',
        'git commit -m "code logs"',
        'git push'
    ];

    exec(commands.join(' && '), { cwd: repoPath }, (err: any, stdout: any, stderr: any) => {
        if (err) {
            vscode.window.showErrorMessage(`Failed to push changes to GitHub: ${err.message}`);
        } else {
            vscode.window.showInformationMessage('Successfully pushed changes to GitHub');
        }
    });
}

vscode.commands.registerCommand('autogit.appendToReadme', () => {
    const fileDetails = getCurrentFileDetails();

    setInterval(function(){  
        if (fileDetails && fileDetails.currentDirectory) {
            appendToReadme(fileDetails.fileName, fileDetails.currentDirectory);
        } else {
            vscode.window.showInformationMessage('No active editor or workspace folder');
        }
    }, 10000);  


});

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('autogit.getFileInfo', () => {
        const fileDetails = getCurrentFileDetails();
        
        if (fileDetails) {
            vscode.window.showInformationMessage(
                `Current File: ${fileDetails.fileName}\n` +
                `Directory: ${fileDetails.currentDirectory}`
				// +`Message: ${fileDetails.message}`
            );
        } else {
            vscode.window.showInformationMessage('No active editor');
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
