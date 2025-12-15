import * as vscode from 'vscode';
import { MenuItem } from './menuitem';
import { MenuItemConfig, menuItemConfiguration } from './menuItemConfiguration';

/**
 * Provides the menu items for the converter menu in the VS Code extension.
 */
export class ConverterMenuProvider implements vscode.TreeDataProvider<MenuItem> {

    getTreeItem(element: MenuItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: MenuItem): Thenable<MenuItem[]> {
        if (element) {
            return Promise.resolve([]);
        } else {
            return Promise.resolve([
                ...menuItemConfiguration.map((config: MenuItemConfig) => 
                new MenuItem(
                    config.label,
                    config.description,
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: config.command!,
                        title: config.label,
                    },
                    new vscode.ThemeIcon(config.icon!) 
                ))
            ]);
        }
    }
}