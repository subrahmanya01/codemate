import { ToolUi } from '../../toolUi';
import * as vscode from 'vscode';
import { getNonce, getBaseHtml } from '../webviewUtils';
import { WebviewContent } from '../webviewContent';
import { CodeToJson } from './codeToJson';

export class CodeToJsonUi implements ToolUi {
    async show(context: vscode.ExtensionContext): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'codemate.codeToJson',
            'Code → JSON',
            vscode.ViewColumn.One,
            { enableScripts: true, retainContextWhenHidden: true }
        );

        const iconUri = vscode.Uri.joinPath(context.extensionUri, 'resources', 'tool.svg');
        panel.iconPath = { light: iconUri, dark: iconUri } as any;

        const { body, script } = CodeToJsonUi.getWebviewContent();
        const nonce = getNonce();

        panel.webview.html = getBaseHtml(nonce, 'Code → JSON', body, script);

        // send current theme and listen for changes
        panel.webview.postMessage({ type: 'theme', kind: vscode.window.activeColorTheme.kind });
        const colorThemeListener = vscode.window.onDidChangeActiveColorTheme((theme) => {
            panel.webview.postMessage({ type: 'theme', kind: theme.kind });
        });
        panel.onDidDispose(() => colorThemeListener.dispose());

        // load the Code→JSON parsing rules to get supported languages
        const rulesPath = vscode.Uri.joinPath(context.extensionUri, 'resources', 'configurations', 'codeToJson.rules.json').fsPath;
        let rules: any = {};
        try {
            const fs = require('fs');
            rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));
        } catch (e) {
            console.error('Failed to load codeToJson rules for CodeToJson', e);
        }

        panel.webview.onDidReceiveMessage(async msg => {
            try {
                if (!msg || !msg.type) return;

                switch (msg.type) {
                    case 'close':
                        panel.dispose();
                        break;
                    case 'convert':
                        try {
                            const out = CodeToJson.generate(msg.data.input || '', msg.data.language || undefined, rules);
                            panel.webview.postMessage({ type: 'result', data: out });
                        } catch (e) {
                            panel.webview.postMessage({ type: 'error', data: String(e) });
                        }
                        break;
                    case 'copy':
                        if (msg.data) {
                            await vscode.env.clipboard.writeText(msg.data);
                            try {
                                await vscode.window.showInformationMessage('Generated JSON copied to clipboard');
                            } catch (e) {
                                // ignore
                            }
                            panel.webview.postMessage({ type: 'copied' });
                        }
                        break;
                    case 'loadRules':
                        panel.webview.postMessage({ type: 'rules', data: rules });
                        break;
                }
            } catch (e) {
                panel.webview.postMessage({ type: 'error', data: String(e) });
            }
        });

        // send rules to webview for language selection
        panel.webview.postMessage({ type: 'rules', data: rules });
    }

    public static getBodyHtml(): string {
        return `<div class="header">
                <div class="header-left">
                    <svg class="header-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <rect x="3" y="3" width="18" height="18" rx="2" fill="var(--vscode-button-background, #00A0A0)" />
                        <text x="12" y="16" text-anchor="middle" font-size="10" fill="var(--vscode-button-foreground, #ffffff)" font-family="Segoe UI, Arial">C→J</text>
                    </svg>
                    <span class="header-title">Code → JSON</span>
                </div>
                <div class="header-right">
                    <div class="toolbar header-toolbar">
                        <select id="language-select" aria-label="Select source language"></select>
                    </div>
                </div>
            </div>

            <div class="main">
                <div class="pane">
                    <div class="pane-title">
                        <span>Code Input</span>
                        <button class="icon-btn" id="clear-btn">Clear</button>
                    </div>
                    <textarea id="input" placeholder="Paste code or type definitions here..."></textarea>
                </div>
                <div class="pane">
                    <div class="pane-title">
                        <span>Generated JSON</span>
                        <button class="icon-btn" id="copy-btn">Copy</button>
                    </div>
                    <textarea id="output"></textarea>
                </div>
            </div>`;
    }

    public static getScriptContent(): string {
        return `
            const vscode = acquireVsCodeApi();

            const inputEl = document.getElementById('input');
            const outputEl = document.getElementById('output');
            const copyBtn = document.getElementById('copy-btn');
            const clearBtn = document.getElementById('clear-btn');
            const langSelect = document.getElementById('language-select');

            function fillLanguages(rules) {
                langSelect.innerHTML = '';
                Object.keys(rules || {}).forEach(k => {
                    const opt = document.createElement('option');
                    opt.value = k;
                    opt.textContent = (rules[k] && rules[k].label) ? rules[k].label + ' (' + k + ')' : k;
                    langSelect.appendChild(opt);
                });
                if (langSelect.options.length > 0) langSelect.selectedIndex = 0;
            }

            langSelect.addEventListener('change', () => doConvert());
            inputEl.addEventListener('input', () => doConvert());

            clearBtn.addEventListener('click', () => {
                inputEl.value = '';
                outputEl.value = '';
            });

            copyBtn.addEventListener('click', () => {
                vscode.postMessage({ type: 'copy', data: outputEl.value });
            });

            function doConvert() {
                const payload = {
                    input: inputEl.value,
                    language: langSelect.value
                };
                vscode.postMessage({ type: 'convert', data: payload });
            }

            window.addEventListener('message', event => {
                const msg = event.data;
                if (msg.type === 'rules') {
                    fillLanguages(msg.data);
                    // auto convert on first load
                    setTimeout(() => doConvert(), 10);
                } else if (msg.type === 'result') {
                    outputEl.value = msg.data || '';
                } else if (msg.type === 'error') {
                    outputEl.value = 'Error: ' + msg.data;
                } else if (msg.type === 'copied') {
                    const original = copyBtn.textContent;
                    copyBtn.textContent = 'Copied';
                    setTimeout(() => (copyBtn.textContent = original), 1000);
                }
            });`;
    }

    public static getWebviewContent(): WebviewContent {
        return {
            body: this.getBodyHtml(),
            script: this.getScriptContent()
        };
    }
}
