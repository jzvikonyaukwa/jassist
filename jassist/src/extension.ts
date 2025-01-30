// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import ollama from 'ollama';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Log activation message
    console.log('Congratulations, your extension "jassist" is now active!');

    // Register the command
    const disposable = vscode.commands.registerCommand('jassist.jassist', async () => {
        try {
            // Create a webview panel
            const panel = vscode.window.createWebviewPanel(
                'deepChat', // Identifies the type of webview
                'JASSIST Chat', // Title of the panel
                vscode.ViewColumn.One, // Editor column to show the panel in
                { enableScripts: true } // Enable JavaScript in the webview
            );

            // Set the HTML content for the webview
            panel.webview.html = getWebviewContent();

            // Handle messages from the webview
            panel.webview.onDidReceiveMessage(async (message: any) => {
                if (message.command === 'chat') {
                    const userPrompt = message.text;

                    try {
                        // Stream the response from the Ollama chat model
                        const streamResponse = await ollama.chat({
                            model: 'deepseek-r1:1.5b',
                            messages: [{ role: 'user', content: userPrompt }],
                            stream: true
                        });

                        let responseText = '';

                        // Process each part of the streamed response
                        for await (const part of streamResponse) {
                            responseText += part.message.content;
                            // Send the updated response back to the webview
                            panel.webview.postMessage({ command: 'chatResponse', text: responseText });
                        }
                    } catch (err) {
                        // Handle errors during the chat process
                        console.error('Error during chat streaming:', err);
                        panel.webview.postMessage({ command: 'chatResponse', text: `Error: ${String(err)}` });
                    }
                }
            });

        } catch (err) {
            // Handle errors during webview panel creation or setup
            console.error('Error creating webview panel:', err);
            vscode.window.showErrorMessage('Failed to create JASSIST Chat panel. Please try again.');
        }
    });

    // Add the command to the extension's subscriptions
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
