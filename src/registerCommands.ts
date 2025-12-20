import * as vscode from 'vscode';
import { Base64HelperUi } from './tools/base64Helper/base64HelperUi';

export function registerCommands(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('codemate.base64Helper', async () => {
			const ui = new Base64HelperUi();
			await ui.show(context);
		})
	);
}