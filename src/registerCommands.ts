import * as vscode from 'vscode';
import { Base64HelperUi } from './tools/base64Helper/base64HelperUi';
import { JsonToCodeUi } from './tools/jsonToCode/jsonToCodeUi';
import { CodeToJsonUi } from './tools/codeToJson/codeToJsonUi';
import { XmlJsonUi } from './tools/xmlJson/xmlJsonUi';
import { JwtDebuggerUi } from './tools/jwtDebugger/jwtDebuggerUi';

export function registerCommands(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('codemate.base64Helper', async () => {
			const ui = new Base64HelperUi();
			await ui.show(context);
		}),
		vscode.commands.registerCommand('codemate.jsonToCode', async () => {
			const ui = new JsonToCodeUi();
			await ui.show(context);
		}),
		vscode.commands.registerCommand('codemate.codeToJson', async () => {
			const ui = new CodeToJsonUi();
			await ui.show(context);
		}),
		vscode.commands.registerCommand('codemate.xmlJson', async () => {
			const ui = new XmlJsonUi();
			await ui.show(context);
		}),
		vscode.commands.registerCommand('codemate.jwtDebugger', async () => {
			const ui = new JwtDebuggerUi();
			await ui.show(context);
		})
	);
}