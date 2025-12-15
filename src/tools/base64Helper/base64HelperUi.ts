import { ToolUi } from '../../toolUi';
import * as vscode from 'vscode';
import { getNonce, getBaseHtml } from '../webviewUtils';

// Business logic class - all logic in TypeScript
class Base64Helper {
    static encode(input: string): string {
        return Buffer.from(input, 'utf-8').toString('base64');
    }

    static decode(base64: string): string {
        return Buffer.from(base64, 'base64').toString('utf-8');
    }
}

export class Base64HelperUi implements ToolUi {
    async show(context: vscode.ExtensionContext): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'codemate.base64',
            'Base64 Helper',
            vscode.ViewColumn.One,
            { enableScripts: true, retainContextWhenHidden: true }
        );

        const nonce = getNonce();
        const bodyContent = this.getBodyHtml();
        const scriptContent = this.getScriptContent();
        
        panel.webview.html = getBaseHtml(nonce, 'Base64 Helper', bodyContent, scriptContent);

        // Handle messages from webview
        panel.webview.onDidReceiveMessage(msg => {
            if (msg?.type === 'close') {
                panel.dispose();
            } else if (msg?.type === 'encode') {
                try {
                    const result = Base64Helper.encode(msg.data);
                    panel.webview.postMessage({ type: 'encode-result', data: result });
                } catch (e) {
                    panel.webview.postMessage({ type: 'error', data: String(e) });
                }
            } else if (msg?.type === 'decode') {
                try {
                    const result = Base64Helper.decode(msg.data);
                    panel.webview.postMessage({ type: 'decode-result', data: result });
                } catch (e) {
                    panel.webview.postMessage({ type: 'error', data: String(e) });
                }
            }
        });
    }

    private getBodyHtml(): string {
        return `<div class="header">
    <span class="header-title">Base64 Helper</span>
    <button id="close" class="icon-btn">Close</button>
</div>

<div class="main">
    <div class="pane">
        <div class="toolbar">
            <button class="toggle-btn active" id="encode-btn">Encode</button>
            <button class="toggle-btn" id="decode-btn">Decode</button>
        </div>
        <div class="pane-title">
            <span id="input-title">Plain Text</span>
            <button class="icon-btn" id="clear-btn">Clear</button>
        </div>
        <textarea id="input" placeholder="Type text to encode..."></textarea>
    </div>
    <div class="pane">
        <div class="pane-title">
            <span id="output-title">Base64 Output</span>
            <button class="icon-btn" id="copy-btn">Copy</button>
        </div>
        <textarea id="output" readonly></textarea>
    </div>
</div>`;
    }

    private getScriptContent(): string {
        return `
const vscode = acquireVsCodeApi();
let isEncode = true;

const encodeBtn = document.getElementById('encode-btn');
const decodeBtn = document.getElementById('decode-btn');
const inputEl = document.getElementById('input');
const outputEl = document.getElementById('output');
const inputTitleEl = document.getElementById('input-title');
const outputTitleEl = document.getElementById('output-title');
const clearBtn = document.getElementById('clear-btn');
const copyBtn = document.getElementById('copy-btn');
const closeBtn = document.getElementById('close');

// Toggle encode/decode mode
encodeBtn.addEventListener('click', () => switchMode(true));
decodeBtn.addEventListener('click', () => switchMode(false));

// Input change event
inputEl.addEventListener('input', updateOutput);

// Clear button
clearBtn.addEventListener('click', () => {
    inputEl.value = '';
    outputEl.value = '';
});

// Copy button
copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(outputEl.value);
});

// Close button
closeBtn.addEventListener('click', () => {
    vscode.postMessage({ type: 'close' });
});

// Handle responses from extension
window.addEventListener('message', event => {
    const msg = event.data;
    if (msg.type === 'encode-result' || msg.type === 'decode-result') {
        outputEl.value = msg.data;
    } else if (msg.type === 'error') {
        outputEl.value = 'Error: ' + msg.data;
    }
});

function switchMode(encode) {
    isEncode = encode;
    encodeBtn.classList.toggle('active');
    decodeBtn.classList.toggle('active');
    
    if (encode) {
        inputTitleEl.textContent = 'Plain Text';
        outputTitleEl.textContent = 'Base64 Output';
    } else {
        inputTitleEl.textContent = 'Base64 String';
        outputTitleEl.textContent = 'Decoded Text';
    }
    
    updateOutput();
}

function updateOutput() {
    const input = inputEl.value;
    if (!input) {
        outputEl.value = '';
        return;
    }
    
    if (isEncode) {
        vscode.postMessage({ type: 'encode', data: input });
    } else {
        vscode.postMessage({ type: 'decode', data: input });
    }
}
`;
    }
}