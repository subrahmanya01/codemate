import * as vscode from 'vscode';
import { ConverterMenuProvider } from './menuItemsProvider';
import { registerCommands } from './registerCommands';

export function activate(context: vscode.ExtensionContext) {

	// Register the converter menu provider
	const menuProvider = new ConverterMenuProvider();
	vscode.window.registerTreeDataProvider('codemate-menu', menuProvider);

    registerCommands(context);
}