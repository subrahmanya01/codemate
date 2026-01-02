import { ToolUi } from '../../toolUi';
import * as vscode from 'vscode';
import { getNonce, getBaseHtml } from '../webviewUtils';
import { XmlJson } from './xmlJson';
import { WebviewContent } from '../webviewContent';

export class XmlJsonUi implements ToolUi {
    async show(context: vscode.ExtensionContext): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'codemate.xmlJson',
            'XML ↔ JSON',
            vscode.ViewColumn.One,
            { enableScripts: true, retainContextWhenHidden: true }
        );

        const nonce = getNonce();

        const iconUri = vscode.Uri.joinPath(context.extensionUri, 'resources', 'tool.svg');
        panel.iconPath = { light: iconUri, dark: iconUri } as any;

        const { body, script } = XmlJsonUi.getWebviewContent();

        panel.webview.html = getBaseHtml(nonce, 'XML ↔ JSON', body, script);

        // send current theme and listen for changes
        panel.webview.postMessage({ type: 'theme', kind: vscode.window.activeColorTheme.kind });
        const colorThemeListener = vscode.window.onDidChangeActiveColorTheme((theme) => {
            panel.webview.postMessage({ type: 'theme', kind: theme.kind });
        });
        panel.onDidDispose(() => colorThemeListener.dispose());

        let mode: 'xmlToJson' | 'jsonToXml' = 'xmlToJson';

        const sendState = (input?: string) => {
            panel.webview.postMessage({
                type: 'state',
                data: {
                    mode,
                    isXmlToJson: mode === 'xmlToJson',
                    inputTitle: mode === 'xmlToJson' ? 'XML Input' : 'JSON Input',
                    outputTitle: mode === 'xmlToJson' ? 'JSON Output' : 'XML Output',
                    placeholder: mode === 'xmlToJson' ? 'Paste XML here...' : 'Paste JSON here...'
                }
            });

            if (typeof input === 'string' && input.length) {
                try {
                    const out = mode === 'xmlToJson' ? XmlJson.xmlToJson(input) : XmlJson.jsonToXml(input);
                    panel.webview.postMessage({ type: 'result', data: out });
                } catch (e) {
                    panel.webview.postMessage({ type: 'error', data: String(e) });
                }
            } else {
                panel.webview.postMessage({ type: 'result', data: '' });
            }
        };

        panel.webview.onDidReceiveMessage(async msg => {
            try {
                if (!msg || !msg.type) return;

                switch (msg.type) {
                    case 'close':
                        panel.dispose();
                        break;
                    case 'toggle':
                        mode = msg.data === 'xmlToJson' ? 'xmlToJson' : 'jsonToXml';
                        sendState(msg.input);
                        break;
                    case 'input':
                        if (!msg.data) {
                            panel.webview.postMessage({ type: 'result', data: '' });
                            break;
                        }

                        try {
                            const out = mode === 'xmlToJson' ? XmlJson.xmlToJson(msg.data) : XmlJson.jsonToXml(msg.data);
                            panel.webview.postMessage({ type: 'result', data: out });
                        } catch (e) {
                            panel.webview.postMessage({ type: 'error', data: String(e) });
                        }

                        break;
                    case 'copy':
                        if (msg.data) {
                            await vscode.env.clipboard.writeText(msg.data);
                            panel.webview.postMessage({ type: 'copied' });
                        }
                        break;
                    case 'clear':
                        panel.webview.postMessage({ type: 'clear-done' });
                        break;
                }
            } catch (e) {
                panel.webview.postMessage({ type: 'error', data: String(e) });
            }
        });

        sendState();
    }

    public static getBodyHtml(): string {
        return `<div class="header">
            <div class="header-left">
                <svg class="header-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" fill="var(--vscode-button-background, #007FD4)" />
                    <text x="12" y="16" text-anchor="middle" font-size="10" fill="var(--vscode-button-foreground, #ffffff)" font-family="Segoe UI, Arial">XML</text>
                </svg>
                <span class="header-title">XML ↔ JSON</span>
            </div>
            <div class="header-right">
                <div class="toolbar header-toolbar">
                    <button class="toggle-btn active" id="xml-to-json">XML → JSON</button>
                    <button class="toggle-btn" id="json-to-xml">JSON → XML</button>
                </div>
            </div>
        </div>

        <div class="main">
            <div class="pane">
                <div class="pane-title">
                    <span id="input-title">XML Input</span>
                    <button class="icon-btn" id="clear-btn">Clear</button>
                </div>
                <textarea id="input" placeholder="Paste XML here..."></textarea>
            </div>
            <div class="pane">
                <div class="pane-title">
                    <span id="output-title">JSON Output</span>
                    <button class="icon-btn" id="copy-btn">Copy</button>
                </div>
                <textarea id="output" readonly></textarea>
            </div>
        </div>`;
    }

    public static getScriptContent(): string {
        return `
            const vscode = acquireVsCodeApi();

            const xmlBtn = document.getElementById('xml-to-json');
            const jsonBtn = document.getElementById('json-to-xml');
            const inputEl = document.getElementById('input');
            const outputEl = document.getElementById('output');
            const inputTitleEl = document.getElementById('input-title');
            const outputTitleEl = document.getElementById('output-title');
            const clearBtn = document.getElementById('clear-btn');
            const copyBtn = document.getElementById('copy-btn');

            xmlBtn.addEventListener('click', () => {
                vscode.postMessage({ type: 'toggle', data: 'xmlToJson' });
            });

            jsonBtn.addEventListener('click', () => {
                vscode.postMessage({ type: 'toggle', data: 'jsonToXml' });
            });

            inputEl.addEventListener('input', () => {
                vscode.postMessage({ type: 'input', data: inputEl.value });
            });

            clearBtn.addEventListener('click', () => {
                inputEl.value = '';
                outputEl.value = '';
                vscode.postMessage({ type: 'clear' });
            });

            copyBtn.addEventListener('click', () => {
                vscode.postMessage({ type: 'copy', data: outputEl.value });
            });

            window.addEventListener('message', event => {
                const msg = event.data;
                if (msg.type === 'state') {
                    const s = msg.data || {};
                    xmlBtn.classList.toggle('active', !!s.isXmlToJson);
                    jsonBtn.classList.toggle('active', !s.isXmlToJson);
                    if (s.inputTitle) inputTitleEl.textContent = s.inputTitle;
                    if (s.outputTitle) outputTitleEl.textContent = s.outputTitle;
                    if (s.placeholder) inputEl.placeholder = s.placeholder;
                } else if (msg.type === 'result') {
                    outputEl.value = msg.data || '';
                } else if (msg.type === 'error') {
                    outputEl.value = 'Error: ' + msg.data;
                } else if (msg.type === 'clear-done') {
                    inputEl.value = '';
                    outputEl.value = '';
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
