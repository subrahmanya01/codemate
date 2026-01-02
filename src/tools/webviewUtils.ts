export function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 16; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

export function getBaseHtml(nonce: string, title: string, bodyContent: string, scriptContent: string): string {
    return `<!doctype html>
              <html lang="en">
                <head>
                  <meta charset="utf-8" />
                  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <title>${title}</title>
                  <style>
                    :root { color-scheme: light dark; }
                    * { box-sizing: border-box; }
                    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); height: 100vh; overflow: hidden; }
                    .header { height: 44px; background: var(--vscode-editorGroupHeader-tabsBackground, var(--vscode-sideBar-background)); border-bottom: 1px solid var(--vscode-editorGroup-border); display: flex; align-items: center; justify-content: space-between; padding: 0 12px; flex-shrink: 0; }
                    .header-left { display: flex; align-items: center; gap: 8px; }
                    .header-right { display: flex; align-items: center; }
                    .header-icon { width: 18px; height: 18px; display: block; color: var(--vscode-button-background); }
                    .header-title { font-weight: 600; font-size: 13px; }
                    /* align header and main content edges by removing horizontal padding */
                    .main { display: flex; height: calc(100vh - 44px); gap: 12px; padding: 0; }
                    .pane { flex: 1; display: flex; flex-direction: column; border-right: 1px solid var(--vscode-editorGroup-border); min-width: 0; }
                    .pane:last-child { border-right: 0; }
                    .pane-title { height: 36px; background: var(--vscode-editorGroup-tabsBackground, var(--vscode-sideBar-background)); border-bottom: 1px solid var(--vscode-editorGroup-border); display: flex; align-items: center; justify-content: space-between; padding: 0 8px; font-size: 11px; text-transform: uppercase; color: var(--vscode-descriptionForeground); flex-shrink: 0; }
                    textarea { flex: 1; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); border: 0; padding: 12px; font-family: 'Consolas', 'Monaco', monospace; font-size: 13px; resize: none; outline: none; }
                    textarea:focus { outline: 1px solid var(--vscode-focusBorder); }
                    textarea:disabled { opacity: 0.6; cursor: not-allowed; }
                    .toolbar { padding: 8px; display: flex; gap: 8px; align-items: center; background: var(--vscode-editorGroup-tabsBackground, var(--vscode-sideBar-background)); border-bottom: 1px solid var(--vscode-editorGroup-border); flex-shrink: 0; flex-wrap: wrap; }
                    .header .toolbar { padding: 0; background: transparent; border-bottom: none; }
                    .toolbar-group { display: flex; gap: 8px; align-items: center; }
                    .toolbar-label { font-size: 11px; color: var(--vscode-descriptionForeground); text-transform: uppercase; }
                    .toggle-btn { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-button-border); padding: 6px 12px; cursor: pointer; border-radius: 2px; font-size: 12px; }
                    .toggle-btn.active { background: var(--vscode-button-secondaryBackground, var(--vscode-button-background)); color: var(--vscode-button-foreground); border-color: var(--vscode-button-border); }
                    .btn { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 6px 10px; cursor: pointer; border-radius: 2px; font-size: 12px; font-weight: 500; }
                    .btn:hover { filter: brightness(0.95); }
                    .icon-btn { background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: none; padding: 4px 8px; cursor: pointer; border-radius: 2px; font-size: 12px; }
                    .icon-btn:hover { filter: brightness(0.95); color: var(--vscode-button-foreground); }
                    select, input[type="text"], input[type="number"] { background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); padding: 4px 6px; border-radius: 2px; font-size: 12px; }
                    /* Smaller, fixed-width input for root name to keep toolbar tidy */
                    input#rootname { width: 120px; padding: 4px 6px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 2px; font-size: 12px; }
                    select:focus, input:focus { outline: 1px solid var(--vscode-focusBorder); border-color: var(--vscode-focusBorder); }
                    /* allow svg fills to use CSS variables */
                    .header-icon rect { fill: var(--vscode-button-background); }
                    .header-icon text { fill: var(--vscode-button-foreground); font-family: Segoe UI, Arial; }
                  </style>
                </head>
                <body>
                  ${bodyContent}
                  <script nonce="${nonce}">
                    (function () {
                      const applyTheme = (kind) => {
                        const name = kind === 2 ? 'dark' : kind === 3 ? 'highContrast' : 'light';
                        document.documentElement.setAttribute('data-theme', name);
                      };
                      window.addEventListener('message', event => {
                        const msg = event.data;
                        if (msg && msg.type === 'theme') {
                          applyTheme(msg.kind);
                        }
                      });
                    })();
                    ${scriptContent}
                  </script>
                </body>
              </html>`;
}
