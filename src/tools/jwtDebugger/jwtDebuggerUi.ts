import { ToolUi } from '../../toolUi';
import * as vscode from 'vscode';
import { getNonce, getBaseHtml } from '../webviewUtils';
import { JwtDebugger } from './jwtDebugger';
import { WebviewContent } from '../webviewContent';

export class JwtDebuggerUi implements ToolUi {
    async show(context: vscode.ExtensionContext): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'codemate.jwtDebugger',
            'JWT Debugger',
            vscode.ViewColumn.One,
            { enableScripts: true, retainContextWhenHidden: true }
        );

        const nonce = getNonce();

        const iconUri = vscode.Uri.joinPath(context.extensionUri, 'resources', 'tool.svg');
        panel.iconPath = { light: iconUri, dark: iconUri } as any;

        const { body, script } = JwtDebuggerUi.getWebviewContent();

        panel.webview.html = getBaseHtml(nonce, 'JWT Debugger', body, script);

        const sendState = (token?: string) => {
            panel.webview.postMessage({ type: 'state', data: { token: token || '' } });

            if (typeof token === 'string' && token.length) {
                try {
                    const parts = JwtDebugger.decode(token);
                    panel.webview.postMessage({ type: 'header', data: parts.header });
                    panel.webview.postMessage({ type: 'payload', data: parts.payload });
                    const detected = JwtDebugger.detectAlg(token);
                    panel.webview.postMessage({ type: 'alg', data: detected });
                } catch (e) {
                    panel.webview.postMessage({ type: 'error', data: String(e) });
                }
            } else {
                panel.webview.postMessage({ type: 'header', data: '' });
                panel.webview.postMessage({ type: 'payload', data: '' });
                panel.webview.postMessage({ type: 'alg', data: '' });
            }
        };

        panel.webview.onDidReceiveMessage(async msg => {
            try {
                if (!msg || !msg.type) return;

                switch (msg.type) {
                    case 'close':
                        panel.dispose();
                        break;
                    case 'input':
                        sendState(msg.data);
                        break;
                    case 'verify':
                        const token: string = msg.token;
                        const key: string = msg.key;
                        const alg: string | undefined = JwtDebugger.detectAlg(token);
                        if (!alg) {
                            panel.webview.postMessage({ type: 'verify-result', data: { ok: false, msg: 'Unable to detect algorithm' } });
                            break;
                        }

                        try {
                            let ok = false;
                            if (alg.startsWith('HS')) {
                                ok = JwtDebugger.verifyHMAC(token, key, alg as any);
                            } else if (alg.startsWith('RS')) {
                                ok = JwtDebugger.verifyRSA(token, key, alg as any);
                            } else {
                                panel.webview.postMessage({ type: 'verify-result', data: { ok: false, msg: 'Algorithm not supported yet' } });
                                break;
                            }

                            panel.webview.postMessage({ type: 'verify-result', data: { ok, msg: ok ? 'Signature valid' : 'Signature INVALID' } });
                        } catch (e) {
                            panel.webview.postMessage({ type: 'verify-result', data: { ok: false, msg: String(e) } });
                        }

                        break;
                    case 'copy':
                        if (msg.data) {
                            await vscode.env.clipboard.writeText(msg.data);
                            panel.webview.postMessage({ type: 'copied' });
                        }
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
                    <rect x="3" y="3" width="18" height="18" rx="2" fill="#007FD4" />
                    <text x="12" y="16" text-anchor="middle" font-size="10" fill="#fff" font-family="Segoe UI, Arial">JWT</text>
                </svg>
                <span class="header-title">JWT Debugger</span>
            </div>
            <div class="header-right">
                <div class="toolbar header-toolbar">
                    <button class="icon-btn" id="copy-btn">Copy Payload</button>
                </div>
            </div>
        </div>

        <style>
          /* JWT specific adjustments to match extension theme */
          .main.jwt .token-pane { flex: 1.4; min-width: 340px; }
          .main.jwt .controls { display:flex; gap:8px; align-items:center; padding:8px; background:#252526; border-top:1px solid #2b2b2b; }
          .main.jwt .controls label { color:#969696; font-size:12px; min-width:120px; }
          #key-input { flex:1; padding:6px 8px; background:#3c3c3c; color:#cccccc; border:1px solid #3c3c3c; border-radius:2px; font-size:12px; }
          #verify-status { margin-left:8px; font-weight:600; }
        </style>

        <div class="main jwt">
            <div class="pane token-pane">
                <div class="pane-title">
                    <span>Token</span>
                    <button class="icon-btn" id="clear-btn">Clear</button>
                </div>
                <textarea id="token" placeholder="Paste JWT here..."></textarea>
                <div class="controls">
                    <label>Detected alg: <span id="detected-alg">-</span></label>
                    <input type="text" id="key-input" placeholder="Secret / PEM public key" />
                    <button class="btn" id="verify-btn">Verify</button>
                    <span id="verify-status"></span>
                </div>
            </div>

            <div class="pane">
                <div class="pane-title">
                    <span>Header</span>
                </div>
                <textarea id="header" readonly></textarea>
            </div>

            <div class="pane">
                <div class="pane-title">
                    <span>Payload</span>
                </div>
                <textarea id="payload" readonly></textarea>
            </div>
        </div>`;
    }

    public static getScriptContent(): string {
        return `
            const vscode = acquireVsCodeApi();

            const tokenEl = document.getElementById('token');
            const headerEl = document.getElementById('header');
            const payloadEl = document.getElementById('payload');
            const detectedAlgEl = document.getElementById('detected-alg');
            const keyInputEl = document.getElementById('key-input');
            const verifyBtn = document.getElementById('verify-btn');
            const verifyStatusEl = document.getElementById('verify-status');
            const copyBtn = document.getElementById('copy-btn');
            const clearBtn = document.getElementById('clear-btn');

            tokenEl.addEventListener('input', () => {
                vscode.postMessage({ type: 'input', data: tokenEl.value });
            });

            verifyBtn.addEventListener('click', () => {
                verifyStatusEl.textContent = 'Verifying...';
                vscode.postMessage({ type: 'verify', token: tokenEl.value, key: keyInputEl.value });
            });

            copyBtn.addEventListener('click', () => {
                vscode.postMessage({ type: 'copy', data: payloadEl.value });
            });

            clearBtn.addEventListener('click', () => {
                tokenEl.value = '';
                headerEl.value = '';
                payloadEl.value = '';
                detectedAlgEl.textContent = '-';
                verifyStatusEl.textContent = '';
                vscode.postMessage({ type: 'input', data: '' });
            });

            window.addEventListener('message', event => {
                const msg = event.data;
                if (msg.type === 'header') {
                    headerEl.value = msg.data ? JSON.stringify(msg.data, null, 2) : '';
                } else if (msg.type === 'payload') {
                    payloadEl.value = msg.data ? JSON.stringify(msg.data, null, 2) : '';
                } else if (msg.type === 'alg') {
                    detectedAlgEl.textContent = msg.data || '-';
                } else if (msg.type === 'verify-result') {
                    const r = msg.data || {};
                    verifyStatusEl.textContent = r.msg || (r.ok ? 'OK' : 'INVALID');
                    verifyStatusEl.style.color = r.ok ? 'var(--vscode-terminal-ansiGreen)' : 'var(--vscode-terminal-ansiRed)';
                } else if (msg.type === 'error') {
                    headerEl.value = 'Error: ' + msg.data;
                    payloadEl.value = '';
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
