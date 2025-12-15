import { ToolUi } from '../../toolUi';
import * as vscode from 'vscode';
import { getNonce, getBaseHtml } from '../webviewUtils';

// Business logic in TypeScript
class JsonConverter {
    static inferType(value: any): string {
        if (value === null) return 'any';
        const t = typeof value;
        if (t === 'string') return 'string';
        if (t === 'number') return 'number';
        if (t === 'boolean') return 'boolean';
        if (Array.isArray(value)) {
            return value.length === 0 ? 'any[]' : this.inferType(value[0]) + '[]';
        }
        if (t === 'object') return 'any';
        return 'any';
    }

    static toInterface(name: string, obj: any, interfaces: Map<string, string>): void {
        if (typeof obj !== 'object' || obj === null) return;
        const lines: string[] = [];
        for (const [k, v] of Object.entries(obj)) {
            if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
                const childName = name + this.capitalize(k);
                this.toInterface(childName, v, interfaces);
                lines.push(`  ${k}: ${childName};`);
            } else {
                lines.push(`  ${k}: ${this.inferType(v)};`);
            }
        }
        interfaces.set(name, `export interface ${name} {\n${lines.join('\n')}\n}`);
    }

    private static capitalize(s: string): string {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    static convert(jsonStr: string): string {
        const parsed = JSON.parse(jsonStr);
        const interfaces = new Map<string, string>();
        this.toInterface('RootObject', parsed, interfaces);
        return Array.from(interfaces.values()).reverse().join('\n\n');
    }
}

export class Json2CodeUi implements ToolUi {
    async show(context: vscode.ExtensionContext): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'codemate.jsonToCode',
            'JSON to Code',
            vscode.ViewColumn.One,
            { enableScripts: true, retainContextWhenHidden: true }
        );

        const nonce = getNonce();
        const bodyContent = this.getBodyHtml();
        const scriptContent = this.getScriptContent();
        
        panel.webview.html = getBaseHtml(nonce, 'JSON to Code', bodyContent, scriptContent);

        panel.webview.onDidReceiveMessage(msg => {
            if (msg?.type === 'close') {
                panel.dispose();
            } else if (msg?.type === 'convert') {
                try {
                    const result = JsonConverter.convert(msg.data);
                    panel.webview.postMessage({ type: 'convert-result', data: result });
                } catch (e) {
                    panel.webview.postMessage({ type: 'error', data: String(e) });
                }
            }
        });
    }

    private getBodyHtml(): string {
        return `<div class="header">
    <span class="header-title">JSON to Code</span>
    <button id="close" class="icon-btn">Close</button>
</div>

<div class="main">
    <div class="pane">
        <div class="pane-title">
            <span>JSON Input</span>
            <button class="icon-btn" id="clear-btn">Clear</button>
        </div>
        <textarea id="json-input" placeholder="Paste JSON here...">{"id": 1, "name": "Product Name", "isActive": true}</textarea>
    </div>
    <div class="pane">
        <div class="pane-title">
            <span>TypeScript Output</span>
            <button class="icon-btn" id="copy-btn">Copy</button>
        </div>
        <textarea id="ts-output" readonly placeholder="Output..."></textarea>
    </div>
</div>`;
    }

    private getScriptContent(): string {
        return `
const vscode = acquireVsCodeApi();
const inputEl = document.getElementById('json-input');
const outputEl = document.getElementById('ts-output');
const clearBtn = document.getElementById('clear-btn');
const copyBtn = document.getElementById('copy-btn');
const closeBtn = document.getElementById('close');

inputEl.addEventListener('input', updateOutput);

clearBtn.addEventListener('click', () => {
    inputEl.value = '';
    outputEl.value = '';
});

copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(outputEl.value);
});

closeBtn.addEventListener('click', () => {
    vscode.postMessage({ type: 'close' });
});

window.addEventListener('message', event => {
    const msg = event.data;
    if (msg.type === 'convert-result') {
        outputEl.value = msg.data;
    } else if (msg.type === 'error') {
        outputEl.value = 'Error: ' + msg.data;
    }
});

function updateOutput() {
    const input = inputEl.value;
    if (!input.trim()) {
        outputEl.value = '';
        return;
    }
    vscode.postMessage({ type: 'convert', data: input });
}

updateOutput();
`;
    }
}
