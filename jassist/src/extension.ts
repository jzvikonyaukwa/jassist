// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import ollama from 'ollama';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "jassist" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('jassist.jassist', () => {
		const panel = vscode.window.createWebviewPanel(
			'deepChat',
			'JASSIST Chat',
			vscode.ViewColumn.One,
			{enableScripts:true}
		)

		panel.webview.html = getWebviewContent()

		panel.webview.onDidReceiveMessage(async(message:any)=>{
			if(message.command ==='chat'){
				const userPrompt = message.text;
				let responseText ='';
try{
	const streamResponse = await ollama.chat({
		model:'deepseek-r1:1.5b',
		messages:[{role:'user',content: userPrompt}],
		stream:true
	})

	for await(const part of streamResponse){
		responseText += part.message.content;
		panel.webview.postMessage({command:'chatResponse',text:responseText});
	}

} catch(err){
	panel.webview.postMessage({command:'chatResponse', test:`Error: ${String(err)}`})
}

			}

		})
		
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

function getWebviewContent(): string {
	return /*html*/ `
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<style>
			body {
				font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
				margin: 1rem;
				background-color: #f9f9f9;
				color: #333;
			}
			h2 {
				color: #444;
			}
			#prompt {
				width: 100%;
				box-sizing: border-box;
				padding: 0.5rem;
				margin-top: 0.5rem;
				border: 1px solid #ccc;
				border-radius: 4px;
				font-size: 1rem;
			}
			#askBtn {
				background-color: #0078d4;
				color: white;
				border: none;
				padding: 0.5rem 1rem;
				margin-top: 0.5rem;
				border-radius: 4px;
				cursor: pointer;
				font-size: 1rem;
			}
			#askBtn:hover {
				background-color: #005bb5;
			}
			#response {
				border: 1px solid #ccc;
				margin-top: 1rem;
				padding: 1rem;
				min-height: 300px;
				background-color: white;
				border-radius: 4px;
				overflow-y: auto;
			}
			.loading {
				display: none;
				color: #0078d4;
				margin-top: 1rem;
			}
		</style>
	</head>
	<body>
		<h2>JASSIST VS Code Extension</h2>
		<textarea id="prompt" rows="3" placeholder="Ask something..."></textarea><br/>
		<button id="askBtn">Ask</button>
		<div class="loading" id="loading">Loading...</div>
		<div id="response"></div>
		<script>
			const vscode = acquireVsCodeApi();

			document.getElementById('askBtn').addEventListener('click', () => {
				const text = document.getElementById('prompt').value;
				document.getElementById('loading').style.display = 'block';
				vscode.postMessage({ command: 'chat', text });
			});

			window.addEventListener('message', event => {
				const { command, text } = event.data;
				if (command === 'chatResponse') {
					document.getElementById('loading').style.display = 'none';
					document.getElementById('response').innerText = text;
				}
			});
		</script>
	</body>
	</html>
	`;
}
