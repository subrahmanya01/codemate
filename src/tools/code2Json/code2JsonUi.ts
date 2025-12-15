import { ToolUi } from '../../toolUi';
import * as vscode from 'vscode';
import { getNonce, getBaseHtml } from '../webviewUtils';

// Business logic in TypeScript
class CodeConverter {
    static getDefaultValue(type: string): any {
        const t = (type || '').toLowerCase();
        if (['int', 'long', 'double', 'float', 'decimal', 'number', 'integer'].some(x => t.includes(x))) return 0;
        if (['bool', 'boolean'].some(x => t.includes(x))) return true;
        if (['date', 'datetime', 'localdate'].some(x => t.includes(x))) return new Date().toISOString();
        if (t.includes('[]') || t.includes('list') || t.includes('array')) return [];
        if (t.includes('map') || t.includes('dictionary')) return {};
        return 'string';
    }

    static convert(code: string): string {
        const result: Record<string, any> = {};
        const lines = code.split('\n');

        lines.forEach(line => {
            const cleanLine = line.trim();
            // C# Property: public int Age { get; set; }
            const csharpMatch = cleanLine.match(/public\s+(\w+[\?\[\]]*)\s+(\w+)\s*\{/);
            // TS Interface: name: string;
            const tsMatch = cleanLine.match(/(\w+)\??:\s*(\w+[\[\]]*);?/);
            // Java Field: private String name;
            const javaMatch = cleanLine.match(/private\s+(\w+[\[\]]*)\s+(\w+);/);
            // Python: name: int
            const pyMatch = cleanLine.match(/(\w+):\s*(\w+[\[\]]*)/);

            if (csharpMatch) {
                const [, type, name] = csharpMatch;
                result[name] = this.getDefaultValue(type);
            } else if (tsMatch) {
                const [, name, type] = tsMatch;
                result[name] = this.getDefaultValue(type);
            } else if (javaMatch) {
                const [, type, name] = javaMatch;
                result[name] = this.getDefaultValue(type);
            } else if (pyMatch) {
                const [, name, type] = pyMatch;
                result[name] = this.getDefaultValue(type);
            }
        });

        if (Object.keys(result).length === 0 && code.trim().length > 0) {
            throw new Error('Could not parse class properties. Supports: C# (public T N {get;set;}), TS (n: T;), Java (private T n;), Python (n: T)');
        }

        return JSON.stringify(result, null, 2);
    }
}

export class Code2JsonUi implements ToolUi {
    async show(context: vscode.ExtensionContext): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'codemate.codeToJson',
            'Code to JSON',
            vscode.ViewColumn.One,
            { enableScripts: true, retainContextWhenHidden: true }
        );

        const nonce = getNonce();
        const bodyContent = this.getBodyHtml();
        const scriptContent = this.getScriptContent();
        
        panel.webview.html = getBaseHtml(nonce, 'Code to JSON', bodyContent, scriptContent);

        panel.webview.onDidReceiveMessage(msg => {
            if (msg?.type === 'close') {
                panel.dispose();
            } else if (msg?.type === 'convert') {
                try {
                    const result = CodeConverter.convert(msg.data);
                    panel.webview.postMessage({ type: 'convert-result', data: result });
                } catch (e) {
                    panel.webview.postMessage({ type: 'error', data: String(e) });
                }
            }
        });
    }

    private getBodyHtml(): string {
        return `<div class="header">
    <span class="header-title">Code to JSON</span>
    <button id="close" class="icon-btn">Close</button>
</div>

<div class="main">
    <div class="pane">
        <div class="pane-title">
            <span>Class / Interface Code</span>
            <button class="icon-btn" id="clear-btn">Clear</button>
        </div>
        <textarea id="code-input" placeholder="Paste C#, TypeScript, Java or Python class here...">public class User {
  public int Id { get; set; }
  public string Name { get; set; }
}</textarea>
    </div>
    <div class="pane">
        <div class="pane-title">
            <span>Generated JSON</span>
            <button class="icon-btn" id="copy-btn">Copy</button>
        </div>
        <textarea id="json-output" readonly></textarea>
    </div>
</div>`;
    }

    private getScriptContent(): string {
        return `
const vscode = acquireVsCodeApi();
const inputEl = document.getElementById('code-input');
const outputEl = document.getElementById('json-output');
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
