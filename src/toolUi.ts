import * as vscode from 'vscode';

export interface ToolUi {
	/**
	 * Show the tool UI. The extension context is passed so implementations
	 * can use extension APIs like creating webviews or opening editors.
	 */
	show(context: vscode.ExtensionContext): Promise<void> | void;
}