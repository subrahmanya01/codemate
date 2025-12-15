import { ToolUi } from '../../toolUi';
import * as vscode from 'vscode';
import { getNonce, getBaseHtml } from '../webviewUtils';

// Business logic in TypeScript
class MockDataGenerator {
    static getRandomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static getRandomName(): string {
        const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eva', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'];
        return names[this.getRandomInt(0, names.length - 1)];
    }

    static getRandomEmail(): string {
        const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'example.com'];
        const name = this.getRandomName().toLowerCase();
        const domain = domains[this.getRandomInt(0, domains.length - 1)];
        return `${name}${this.getRandomInt(100, 999)}@${domain}`;
    }

    static getRandomProduct(): string {
        const products = ['Laptop', 'Phone', 'Tablet', 'Monitor', 'Keyboard', 'Mouse', 'Headphones', 'Camera'];
        return products[this.getRandomInt(0, products.length - 1)];
    }

    static generateUser(): Record<string, any> {
        return {
            id: this.getRandomInt(1, 10000),
            name: this.getRandomName(),
            email: this.getRandomEmail(),
            age: this.getRandomInt(18, 80),
            active: Math.random() > 0.5,
        };
    }

    static generateProduct(): Record<string, any> {
        return {
            id: this.getRandomInt(1, 10000),
            name: this.getRandomProduct(),
            price: parseFloat((Math.random() * 1000 + 10).toFixed(2)),
            inStock: Math.random() > 0.3,
            rating: parseFloat((Math.random() * 5).toFixed(1)),
        };
    }

    static generate(type: string, count: number): string {
        const data: Record<string, any>[] = [];
        for (let i = 0; i < count; i++) {
            if (type === 'users') {
                data.push(this.generateUser());
            } else if (type === 'products') {
                data.push(this.generateProduct());
            }
        }
        return JSON.stringify(data, null, 2);
    }
}

export class MockDataGeneratorUi implements ToolUi {
    async show(context: vscode.ExtensionContext): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'codemate.mockDataGenerator',
            'Mock Data Generator',
            vscode.ViewColumn.One,
            { enableScripts: true, retainContextWhenHidden: true }
        );

        const nonce = getNonce();
        const bodyContent = this.getBodyHtml();
        const scriptContent = this.getScriptContent();

        panel.webview.html = getBaseHtml(nonce, 'Mock Data Generator', bodyContent, scriptContent);

        panel.webview.onDidReceiveMessage(msg => {
            if (msg?.type === 'close') {
                panel.dispose();
            } else if (msg?.type === 'generate') {
                try {
                    const result = MockDataGenerator.generate(msg.type_value, msg.count);
                    panel.webview.postMessage({ type: 'generate-result', data: result });
                } catch (e) {
                    panel.webview.postMessage({ type: 'error', data: String(e) });
                }
            }
        });
    }

    private getBodyHtml(): string {
        return `<div class="header">
    <span class="header-title">Mock Data Generator</span>
    <button id="close" class="icon-btn">Close</button>
</div>

<div class="main">
    <div class="pane">
        <div class="pane-title">
            <span>Configuration</span>
        </div>
        <div style="padding: 12px;">
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-size: 12px;">Type:</label>
                <select id="type-select" style="width: 100%; padding: 6px; background: #3c3c3c; color: #d4d4d4; border: 1px solid #3c3c3c; border-radius: 2px;">
                    <option value="users">Users</option>
                    <option value="products">Products</option>
                </select>
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-size: 12px;">Count:</label>
                <input id="count-input" type="number" min="1" max="1000" value="5" style="width: 100%; padding: 6px; background: #3c3c3c; color: #d4d4d4; border: 1px solid #3c3c3c; border-radius: 2px;">
            </div>
            <button id="generate-btn" class="icon-btn" style="width: 100%; padding: 8px;">Generate</button>
        </div>
    </div>
    <div class="pane">
        <div class="pane-title">
            <span>Generated Data</span>
            <button class="icon-btn" id="copy-btn">Copy</button>
        </div>
        <textarea id="output" readonly></textarea>
    </div>
</div>`;
    }

    private getScriptContent(): string {
        return `
const vscode = acquireVsCodeApi();
const typeSelect = document.getElementById('type-select');
const countInput = document.getElementById('count-input');
const generateBtn = document.getElementById('generate-btn');
const outputEl = document.getElementById('output');
const copyBtn = document.getElementById('copy-btn');
const closeBtn = document.getElementById('close');

generateBtn.addEventListener('click', () => {
    const type = typeSelect.value;
    const count = parseInt(countInput.value) || 5;
    vscode.postMessage({ type: 'generate', type_value: type, count });
});

copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(outputEl.value);
});

closeBtn.addEventListener('click', () => {
    vscode.postMessage({ type: 'close' });
});

window.addEventListener('message', event => {
    const msg = event.data;
    if (msg.type === 'generate-result') {
        outputEl.value = msg.data;
    } else if (msg.type === 'error') {
        outputEl.value = 'Error: ' + msg.data;
    }
});

generateBtn.click();
`;
    }
}
