import { ToolUi } from '../../toolUi';
import * as vscode from 'vscode';
import { getNonce, getBaseHtml } from '../webviewUtils';
import { QuickHash } from './quickHash';
import { WebviewContent } from '../webviewContent';

export class QuickHashUi implements ToolUi {
    async show(context: vscode.ExtensionContext): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'codemate.quickHash',
            'Quick Hash Generator',
            vscode.ViewColumn.One,
            { enableScripts: true, retainContextWhenHidden: true }
        );

        const nonce = getNonce();

        const iconUri = vscode.Uri.joinPath(context.extensionUri, 'resources', 'tool.svg');
        panel.iconPath = { light: iconUri, dark: iconUri } as any;

        const { body, script } = QuickHashUi.getWebviewContent();
        panel.webview.html = getBaseHtml(nonce, 'Quick Hash Generator', body, script);

        // theme sync
        panel.webview.postMessage({ type: 'theme', kind: vscode.window.activeColorTheme.kind });
        const colorThemeListener = vscode.window.onDidChangeActiveColorTheme((theme) => {
            panel.webview.postMessage({ type: 'theme', kind: theme.kind });
        });
        panel.onDidDispose(() => colorThemeListener.dispose());

        panel.webview.onDidReceiveMessage(async msg => {
            try {
                if (!msg || !msg.type) return;
                switch (msg.type) {
                    case 'close':
                        panel.dispose();
                        break;
                    case 'compute': {
                        const data = msg.data || {};
                        const input: string = data.input || '';
                        const alg: string = data.alg || 'sha256';
                        const mode: string = data.mode || 'hash';
                        const format: string = data.format || 'hex';
                        const secret: string = data.secret || '';

                        try {
                            const normalized = QuickHash.normalizeAlg(alg);
                            let out: string;
                            if (mode === 'hmac') {
                                out = QuickHash.hmac(input, secret, normalized, format as any);
                            } else {
                                out = QuickHash.hash(input, normalized, format as any);
                            }
                            panel.webview.postMessage({ type: 'result', data: out });
                        } catch (e) {
                            panel.webview.postMessage({ type: 'error', data: String(e) });
                        }
                        break;
                    }
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
    }

    public static getBodyHtml(): string {
        return `<div class="header">
            <div class="header-left">
                <svg class="header-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" fill="var(--vscode-button-background, #007FD4)" />
                    <text x="12" y="16" text-anchor="middle" font-size="10" fill="var(--vscode-button-foreground, #ffffff)" font-family="Segoe UI, Arial">Hash</text>
                </svg>
                <span class="header-title">Quick Hash Generator</span>
            </div>
            <div class="header-right">
                <div class="toolbar header-toolbar">
                    <select id="alg-select" title="Algorithm">
                        <option value="md5">MD5</option>
                        <option value="sha1">SHA-1</option>
                        <option value="sha256" selected>SHA-256</option>
                        <option value="sha384">SHA-384</option>
                        <option value="sha512">SHA-512</option>
                    </select>
                    <select id="format-select" title="Output format">
                        <option value="hex" selected>hex</option>
                        <option value="base64">base64</option>
                    </select>
                    <div class="toggle-group">
                        <button class="toggle-btn active" id="mode-hash">Hash</button>
                        <button class="toggle-btn" id="mode-hmac">HMAC</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="main">
            <div class="pane">
                <div class="pane-title">
                    <span>Input</span>
                    <button class="icon-btn" id="clear-btn">Clear</button>
                </div>
                <textarea id="input" placeholder="Type text to hash..."></textarea>
                <div id="secret-row" style="display:none; margin-top:8px;">
                    <input class="vscode-input" id="secret-input" type="text" placeholder="Secret for HMAC" style="width: 100%; box-sizing: border-box;" />
                </div>
            </div>
            <div class="pane">
                <div class="pane-title">
                    <span>Output</span>
                    <button class="icon-btn" id="copy-btn">Copy</button>
                </div>
                <textarea id="output" readonly></textarea>
            </div>
        </div>`;
    }

    public static getScriptContent(): string {
        return `
            const vscode = acquireVsCodeApi();
            const inputEl = document.getElementById('input');
            const outputEl = document.getElementById('output');
            const algSelect = document.getElementById('alg-select');
            const formatSelect = document.getElementById('format-select');
            const clearBtn = document.getElementById('clear-btn');
            const copyBtn = document.getElementById('copy-btn');
            const modeHash = document.getElementById('mode-hash');
            const modeHmac = document.getElementById('mode-hmac');
            const secretRow = document.getElementById('secret-row');
            const secretInput = document.getElementById('secret-input');

            function compute() {
                vscode.postMessage({ type: 'compute', data: {
                    input: inputEl.value,
                    alg: algSelect.value,
                    format: formatSelect.value,
                    mode: modeHmac.classList.contains('active') ? 'hmac' : 'hash',
                    secret: secretInput.value
                }});
            }

            inputEl.addEventListener('input', () => compute());
            algSelect.addEventListener('change', () => compute());
            formatSelect.addEventListener('change', () => compute());
            secretInput.addEventListener('input', () => compute());

            modeHash.addEventListener('click', () => {
                modeHash.classList.add('active');
                modeHmac.classList.remove('active');
                secretRow.style.display = 'none';
                compute();
            });
            modeHmac.addEventListener('click', () => {
                modeHmac.classList.add('active');
                modeHash.classList.remove('active');
                secretRow.style.display = 'block';
                compute();
            });

            clearBtn.addEventListener('click', () => {
                inputEl.value = '';
                secretInput.value = '';
                outputEl.value = '';
                vscode.postMessage({ type: 'clear' });
            });

            copyBtn.addEventListener('click', () => {
                vscode.postMessage({ type: 'copy', data: outputEl.value });
            });

            window.addEventListener('message', event => {
                const msg = event.data;
                if (msg.type === 'result') {
                    outputEl.value = msg.data || '';
                } else if (msg.type === 'error') {
                    outputEl.value = 'Error: ' + msg.data;
                } else if (msg.type === 'clear-done') {
                    inputEl.value = '';
                    secretInput.value = '';
                    outputEl.value = '';
                } else if (msg.type === 'copied') {
                    const original = copyBtn.textContent;
                    copyBtn.textContent = 'Copied';
                    setTimeout(() => (copyBtn.textContent = original), 1000);
                }
            });
        `;
    }

    public static getWebviewContent(): WebviewContent {
        return { body: this.getBodyHtml(), script: this.getScriptContent() };
    }
}
