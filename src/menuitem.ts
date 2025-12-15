import * as vscode from 'vscode';

/**
 * Represents a menu item in the VS Code extension's tree view.
 */
export class MenuItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        private readonly desc: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command,
        public readonly iconPath?: vscode.ThemeIcon
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label}-${this.desc}`;
        this.description = this.desc;
    }
}