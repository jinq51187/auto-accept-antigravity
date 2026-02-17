const WebSocket = require('ws');
const http = require('http');

const BASE_PORT = 9222; // Standard remote debugging port
const PORT_RANGE = 5;   // Scan 9222 +/- 5

// The script to inject into VS Code's browser window
const INJECTED_SCRIPT = `
(function() {
    // Prevent multiple injections
    if (window.__autoAcceptRunning) return;
    window.__autoAcceptRunning = true;

    // console.log('[AutoAccept] Injected script started in ' + document.title);

    function getDocuments(root = document) {
        let docs = [root];
        try {
            const iframes = root.querySelectorAll('iframe, frame');
            for (const iframe of iframes) {
                try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                    if (iframeDoc) docs.push(...getDocuments(iframeDoc));
                } catch (e) { }
            }
        } catch (e) { }
        return docs;
    }

    function queryAll(selector) {
        const results = [];
        getDocuments().forEach(doc => {
            try {
                results.push(...Array.from(doc.querySelectorAll(selector)));
            } catch (e) { }
        });
        return results;
    }

    function isAcceptButton(el) {
        // Check text content
        const text = (el.textContent || "").trim().toLowerCase();
        
        // Check aria-label (crucial for icon-only buttons)
        const ariaLabel = (el.getAttribute('aria-label') || "").trim().toLowerCase();
        const title = (el.getAttribute('title') || "").trim().toLowerCase();
        
        const combinedText = text + " " + ariaLabel + " " + title;
        
        if (combinedText.length === 0) return false;

        const patterns = ['accept', 'run', 'retry', 'apply', 'execute', 'confirm', 'allow once', 'allow', 'yes'];
        const rejects = ['skip', 'reject', 'cancel', 'close', 'refine', 'no'];

        if (rejects.some(r => combinedText.includes(r))) return false;
        if (!patterns.some(p => combinedText.includes(p))) return false;

        // Visibility check
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0 && style.pointerEvents !== 'none' && !el.disabled;
    }

    async function clickAcceptButtons() {
        const selectors = [
            '.bg-ide-button-background', 
            'button',
            '[role="button"]',
            '[class*="button"]',
            '[class*="anysphere"]',
            '.codicon-check' // Specific icon class often used for Accept
        ];

        const found = [];
        selectors.forEach(s => queryAll(s).forEach(el => found.push(el)));

        const uniqueFound = [...new Set(found)];
        let clicked = 0;

        for (const el of uniqueFound) {
            if (isAcceptButton(el)) {
                // console.log('[AutoAccept] Found button:', el.textContent || el.getAttribute('aria-label') || 'Icon', 'in', document.title);
                
                // Try multiple click methods
                try {
                    el.click(); // Native click
                } catch(e) {}
                
                try {
                    el.dispatchEvent(new MouseEvent('click', {
                        view: window,
                        bubbles: true,
                        cancelable: true
                    }));
                } catch(e) {}
                
                clicked++;
            }
        }
        return clicked;
    }

    setInterval(async () => {
        try {
            await clickAcceptButtons();
        } catch(e) {
            // console.error('[AutoAccept] Error in loop:', e);
        }
    }, 500);
})();
`;

class CDPHandler {
    constructor(logger = console.log) {
        this.logger = logger;
        this.connections = new Map();
        this.isEnabled = false;
        this.msgId = 1;
    }

    log(msg) {
        // Silenced
        // this.logger(`[CDP] ${msg}`);
    }

    async start() {
        this.isEnabled = true;
        this.log('Scanning for VS Code debug ports...');

        const ports = [];
        for (let p = 9000; p <= 9005; p++) ports.push(p);
        for (let p = 9222; p <= 9227; p++) ports.push(p);

        let foundAny = false;

        for (const port of ports) {
            try {
                const pages = await this._getPages(port);
                if (pages.length > 0) foundAny = true;

                for (const page of pages) {
                    const id = `${port}:${page.id}`;
                    if (!this.connections.has(id)) {
                        const success = await this._connect(id, page.webSocketDebuggerUrl);
                        if (success) {
                            await this._enableConsole(id); // Enable console logs
                            await this._inject(id);
                        }
                    }
                }
            } catch (e) { }
        }

        if (!foundAny) {
            this.log('No debuggable pages found. VS Code might not be started with remote debugging enabled.');
        } else {
            this.log(`CDP Active connections: ${this.connections.size}`);
        }
    }

    async stop() {
        this.isEnabled = false;
        for (const [id, conn] of this.connections) {
            try {
                conn.ws.close();
            } catch (e) { }
        }
        this.connections.clear();
    }

    async _getPages(port) {
        return new Promise((resolve) => {
            const req = http.get({ hostname: '127.0.0.1', port, path: '/json/list', timeout: 200 }, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        const pages = JSON.parse(body);
                        const filtered = pages.filter(p =>
                            p.webSocketDebuggerUrl &&
                            // Ensure we attach to both main pages and webviews (chat is often a webview)
                            (p.type === 'page' || p.type === 'webview' || p.type === 'iframe') &&
                            !p.url.startsWith('devtools://')
                        );
                        resolve(filtered);
                    } catch (e) { resolve([]); }
                });
            });
            req.on('error', () => resolve([]));
            req.on('timeout', () => { req.destroy(); resolve([]); });
        });
    }

    async _connect(id, url) {
        return new Promise((resolve) => {
            const ws = new WebSocket(url);
            ws.on('open', () => {
                this.connections.set(id, { ws, injected: false });
                ws.on('message', (data) => this._handleMessage(id, data));
                resolve(true);
            });
            ws.on('error', () => resolve(false));
            ws.on('close', () => this.connections.delete(id));
        });
    }

    _handleMessage(id, data) {
        try {
            const msg = JSON.parse(data.toString());
            // Capture console logs from browser
            if (msg.method === 'Runtime.consoleAPICalled') {
                const type = msg.params.type;
                const args = msg.params.args.map(a => a.value || a.description || '').join(' ');
                if (args.includes('[AutoAccept]')) {
                    this.log(`[Browser ${id}] ${args}`);
                }
            }
        } catch (e) { }
    }

    async _enableConsole(id) {
        const conn = this.connections.get(id);
        if (!conn) return;
        // Enable Runtime domain to receive console events
        conn.ws.send(JSON.stringify({
            id: this.msgId++,
            method: 'Runtime.enable'
        }));
    }

    async _inject(id) {
        const conn = this.connections.get(id);
        if (!conn || conn.injected) return;

        try {
            await this._evaluate(id, INJECTED_SCRIPT);
            conn.injected = true;
            this.log(`Injected script into ${id}`);
        } catch (e) {
            this.log(`Injection failed for ${id}: ${e.message}`);
        }
    }

    async _evaluate(id, expression) {
        const conn = this.connections.get(id);
        if (!conn || conn.ws.readyState !== WebSocket.OPEN) return;

        return new Promise((resolve, reject) => {
            const currentId = this.msgId++;
            // Note: We don't await response here for simplicity in this flow, usually fire & forget for inject
            // But for evaluate we might want result. 
            // Simplified for now since we rely on loop injection
            conn.ws.send(JSON.stringify({
                id: currentId,
                method: 'Runtime.evaluate',
                params: { expression, userGesture: true, awaitPromise: true }
            }));
            resolve();
        });
    }
}

module.exports = { CDPHandler };
