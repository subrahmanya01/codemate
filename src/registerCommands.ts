import * as vscode from 'vscode';
import { Json2CodeUi } from './tools/json2Code/json2CodeUi';
import { Code2JsonUi } from './tools/code2Json/code2JsonUi';
import { Base64HelperUi } from './tools/base64Helper/base64HelperUi';
import { MockDataGeneratorUi } from './tools/mockDataGenerator/mockDataGeneratorUi';

export function registerCommands(context: vscode.ExtensionContext) {

	context.subscriptions.push(
		vscode.commands.registerCommand('codemate.jsonToCode', async () => {
			const ui = new Json2CodeUi();
			await ui.show(context);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('codemate.codeToJson', async () => {
			const ui = new Code2JsonUi();
			await ui.show(context);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('codemate.base64Helper', async () => {
			const ui = new Base64HelperUi();
			await ui.show(context);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('codemate.mockDataProvider', async () => {
			const ui = new MockDataGeneratorUi();
			await ui.show(context);
		})
	);
}