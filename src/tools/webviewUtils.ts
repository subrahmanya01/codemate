import * as vscode from 'vscode';

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
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1e1e1e; color: #cccccc; height: 100vh; overflow: hidden; }
    .header { height: 44px; background: #252526; border-bottom: 1px solid #2b2b2b; display: flex; align-items: center; justify-content: space-between; padding: 0 12px; flex-shrink: 0; }
    .header-title { font-weight: 600; font-size: 13px; }
    .main { display: flex; height: calc(100vh - 44px); gap: 0; }
    .pane { flex: 1; display: flex; flex-direction: column; border-right: 1px solid #2b2b2b; min-width: 0; }
    .pane:last-child { border-right: 0; }
    .pane-title { height: 36px; background: #252526; border-bottom: 1px solid #2b2b2b; display: flex; align-items: center; justify-content: space-between; padding: 0 8px; font-size: 11px; text-transform: uppercase; color: #969696; flex-shrink: 0; }
    textarea { flex: 1; background: #1e1e1e; color: #d4d4d4; border: 0; padding: 12px; font-family: 'Consolas', 'Monaco', monospace; font-size: 13px; resize: none; outline: none; }
    textarea:focus { outline: 1px solid #007fd4; }
    textarea:disabled { opacity: 0.6; cursor: not-allowed; }
    .toolbar { padding: 8px; display: flex; gap: 8px; align-items: center; background: #252526; border-bottom: 1px solid #2b2b2b; flex-shrink: 0; flex-wrap: wrap; }
    .toolbar-group { display: flex; gap: 8px; align-items: center; }
    .toolbar-label { font-size: 11px; color: #969696; text-transform: uppercase; }
    .toggle-btn { background: #3c3c3c; color: #cccccc; border: 1px solid #3c3c3c; padding: 6px 12px; cursor: pointer; border-radius: 2px; font-size: 12px; }
    .toggle-btn.active { background: #007fd4; color: white; border-color: #007fd4; }
    .btn { background: #007fd4; color: white; border: none; padding: 6px 10px; cursor: pointer; border-radius: 2px; font-size: 12px; font-weight: 500; }
    .btn:hover { background: #026ec1; }
    .icon-btn { background: #3c3c3c; color: #cccccc; border: none; padding: 4px 8px; cursor: pointer; border-radius: 2px; font-size: 12px; }
    .icon-btn:hover { background: #4a4a4a; color: white; }
    select, input[type="text"], input[type="number"] { background: #3c3c3c; color: #cccccc; border: 1px solid #3c3c3c; padding: 4px 6px; border-radius: 2px; font-size: 12px; }
    select:focus, input:focus { outline: 1px solid #007fd4; border-color: #007fd4; }
  </style>
</head>
<body>
  ${bodyContent}
  <script nonce="${nonce}">
    ${scriptContent}
  </script>
</body>
</html>`;
}
