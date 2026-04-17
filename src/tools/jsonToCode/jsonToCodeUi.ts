import { ToolUi } from '../../toolUi';
import * as vscode from 'vscode';
import { getNonce, getBaseHtml } from '../webviewUtils';
import { WebviewContent } from '../webviewContent';
import { JsonToCode } from './jsonToCode';
import * as fs from 'fs';

export class JsonToCodeUi implements ToolUi {
    async show(context: vscode.ExtensionContext): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'codemate.jsonToCode',
            'JSON → Code',
            vscode.ViewColumn.One,
            { enableScripts: true, retainContextWhenHidden: true }
        );

        const iconUri = vscode.Uri.joinPath(context.extensionUri, 'resources', 'tool.svg');
        panel.iconPath = { light: iconUri, dark: iconUri } as any;

        const { body, script } = JsonToCodeUi.getWebviewContent();
        const nonce = getNonce();

        panel.webview.html = getBaseHtml(nonce, 'JSON → Code', body, script);

        // send current theme and listen for changes
        panel.webview.postMessage({ type: 'theme', kind: vscode.window.activeColorTheme.kind });
        const colorThemeListener = vscode.window.onDidChangeActiveColorTheme((theme) => {
            panel.webview.postMessage({ type: 'theme', kind: theme.kind });
        });
        panel.onDidDispose(() => colorThemeListener.dispose());

        const rulesPath = vscode.Uri.joinPath(context.extensionUri, 'resources', 'configurations', 'jsonToCode.rules.json').fsPath;
        let rules: any = {};
        try {
            rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));
        } catch (e) {
            console.error('Failed to load jsonToCode rules', e);
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
                            const out = JsonToCode.generate(msg.data.input || '', msg.data.language || 'typescript', rules, msg.data.rootName || 'Root');
                            panel.webview.postMessage({ type: 'result', data: out });
                        } catch (e) {
                            panel.webview.postMessage({ type: 'error', data: String(e) });
                        }
                        break;
                    case 'copy':
                        if (msg.data) {
                            await vscode.env.clipboard.writeText(msg.data);
                            // show a VS Code info snackbar to confirm copy
                            try {
                                await vscode.window.showInformationMessage('Generated code copied to clipboard');
                            } catch (e) {
                                // ignore if showInformationMessage is not available in environment
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

        panel.webview.postMessage({ type: 'rules', data: rules });
    }

    public static getBodyHtml(): string {
        return `<div class="header">
                <div class="header-left">
                    <svg class="header-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <rect x="3" y="3" width="18" height="18" rx="2" fill="var(--vscode-button-background, #00A0A0)" />
                        <text x="12" y="16" text-anchor="middle" font-size="10" fill="var(--vscode-button-foreground, #ffffff)" font-family="Segoe UI, Arial">J→C</text>
                    </svg>
                    <span class="header-title">JSON → Code</span>
                </div>
                <div class="header-right">
                    <div class="toolbar header-toolbar">
                        <select id="language-select" aria-label="Select target language"></select>
                        <input id="rootname" placeholder="RootName" title="Root class/name" />
                    </div>
                </div>
            </div>

            <div class="main">
                <div class="pane">
                    <div class="pane-title">
                        <span>JSON Input</span>
                        <button class="icon-btn" id="clear-btn">Clear</button>
                    </div>
                    <div id="input-editor" class="editor-container editor"></div>
                </div>
                <div class="pane">
                    <div class="pane-title">
                        <span>Generated Code</span>
                        <button class="icon-btn" id="copy-btn">Copy</button>
                    </div>
                    <div id="output-editor" class="editor-container editor"></div>
                </div>
            </div>`;
    }

    public static getScriptContent(): string {
        return `
            const vscode = acquireVsCodeApi();
            const monacoBaseUrl = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.47.0/min';

            const copyBtn = document.getElementById('copy-btn');
            const clearBtn = document.getElementById('clear-btn');
            const langSelect = document.getElementById('language-select');
            const rootName = document.getElementById('rootname');

            let inputEditor = null;
            let outputEditor = null;
            let pendingThemeKind = 1;

            const languageMap = {
                typescript: 'typescript',
                javascript: 'javascript',
                json: 'json',
                jsonc: 'json',
                csharp: 'csharp',
                java: 'java',
                php: 'php',
                python: 'python',
                go: 'go',
                ruby: 'ruby',
                kotlin: 'kotlin',
                swift: 'swift',
                cpp: 'cpp',
                c: 'c',
                html: 'html',
                css: 'css',
                scss: 'scss',
                shell: 'shell',
                bash: 'shell',
                yaml: 'yaml'
            };

            function getMonacoLanguage(language) {
                return languageMap[language] || 'plaintext';
            }

            function createEditors() {
                if (!window.require) {
                    console.error('Monaco loader not available');
                    return;
                }

                window.MonacoEnvironment = {
                    getWorkerUrl: function(moduleId, label) {
                        return URL.createObjectURL(new Blob([
                            'importScripts("' + monacoBaseUrl + '/vs/base/worker/workerMain.js");'
                        ], { type: 'text/javascript' }));
                    }
                };

                require.config({ paths: { vs: monacoBaseUrl + '/vs' } });
                require(['vs/editor/editor.main'], function () {
                    inputEditor = monaco.editor.create(document.getElementById('input-editor'), {
                        value: '',
                        language: 'json',
                        automaticLayout: true,
                        theme: 'vs-dark',
                        minimap: { enabled: true },
                        fontSize: 13,
                        scrollBeyondLastLine: false
                    });

                    outputEditor = monaco.editor.create(document.getElementById('output-editor'), {
                        value: '',
                        language: getMonacoLanguage(langSelect.value || 'typescript'),
                        automaticLayout: true,
                        theme: 'vs-dark',
                        minimap: { enabled: true },
                        fontSize: 13,
                        readOnly: true,
                        scrollBeyondLastLine: false
                    });

                    langSelect.addEventListener('change', () => {
                        const lang = getMonacoLanguage(langSelect.value);
                        monaco.editor.setModelLanguage(outputEditor.getModel(), lang);
                        doConvert();
                    });

                    rootName.addEventListener('input', () => doConvert());

                    clearBtn.addEventListener('click', () => {
                        inputEditor.setValue('');
                        outputEditor.setValue('');
                    });

                    copyBtn.addEventListener('click', () => {
                        vscode.postMessage({ type: 'copy', data: outputEditor.getValue() });
                    });

                    inputEditor.onDidChangeModelContent(() => doConvert());
                    setTheme(pendingThemeKind);
                });
            }

            function setTheme(kind) {
                pendingThemeKind = kind;
                if (!window.monaco) return;
                const theme = kind === 2 ? 'vs-dark' : kind === 3 ? 'hc-black' : 'vs';
                monaco.editor.setTheme(theme);
            }

            function fillLanguages(rules) {
                langSelect.innerHTML = '';
                Object.keys(rules || {}).forEach(k => {
                    const opt = document.createElement('option');
                    opt.value = k;
                    opt.textContent = (rules[k] && rules[k].label) ? rules[k].label + ' (' + k + ')' : k;
                    langSelect.appendChild(opt);
                });
            }

            function doConvert() {
                if (!inputEditor) return;
                const payload = {
                    input: inputEditor.getValue(),
                    language: langSelect.value,
                    rootName: rootName.value || 'Root'
                };
                vscode.postMessage({ type: 'convert', data: payload });
            }

            window.addEventListener('message', event => {
                const msg = event.data;
                if (msg.type === 'rules') {
                    fillLanguages(msg.data);
                    setTimeout(() => doConvert(), 10);
                } else if (msg.type === 'result') {
                    outputEditor && outputEditor.setValue(msg.data || '');
                } else if (msg.type === 'error') {
                    outputEditor && outputEditor.setValue('Error: ' + msg.data);
                } else if (msg.type === 'copied') {
                    const original = copyBtn.textContent;
                    copyBtn.textContent = 'Copied';
                    setTimeout(() => (copyBtn.textContent = original), 1000);
                } else if (msg.type === 'theme') {
                    setTheme(msg.kind);
                }
            });

            window.addEventListener('load', createEditors);
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                createEditors();
            }
        `;
    }

    public static getWebviewContent(): WebviewContent {
        return {
            body: this.getBodyHtml(),
            script: this.getScriptContent()
        };
    }
}
