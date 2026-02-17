const vscode = require('vscode');

let isEnabled = false;
let pollInterval = null;
let statusBarItem = null;
let outputChannel = null;
let globalContext = null;

function activate(context) {
    globalContext = context;

    // Create output channel (silenced)
    outputChannel = vscode.window.createOutputChannel('Auto Accept Keyboard');
    context.subscriptions.push(outputChannel);

    // Initialize state
    isEnabled = vscode.workspace.getConfiguration('auto-accept-keyboard').get('enabled', false);

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'auto-accept-keyboard.toggle';
    statusBarItem.tooltip = 'Click to toggle Auto Accept (Keyboard)';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    updateStatusBar();

    // Register toggle command
    let toggleCommand = vscode.commands.registerCommand('auto-accept-keyboard.toggle', async () => {
        isEnabled = !isEnabled;
        await vscode.workspace.getConfiguration('auto-accept-keyboard').update('enabled', isEnabled, true);
        updateStatusBar();

        if (isEnabled) {
            startPolling();
        } else {
            stopPolling();
        }
    });

    context.subscriptions.push(toggleCommand);

    // Start if enabled
    if (isEnabled) {
        startPolling();
    }

}

function log(message) {
    // Silenced for performance and cleanliness
    /*
    if (outputChannel) {
        const timestamp = new Date().toLocaleTimeString();
        outputChannel.appendLine(`[${timestamp}] ${message}`);
    }
    */
}

function updateStatusBar() {
    if (!statusBarItem) return;

    if (isEnabled) {
        statusBarItem.text = '$(zap) Auto Accept: ON';
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
    } else {
        statusBarItem.text = '$(circle-slash) Auto Accept: OFF';
        statusBarItem.backgroundColor = undefined;
    }
}

const { CDPHandler } = require('./cdp-handler');

// Global handlers
let cdpHandler;

async function simulateKeyboardShortcut() {
    try {
        // ... (existing focus logic) ...
        // We keep the focus logic as a backup for commands
        // We keep the focus logic as a backup for commands
        const editor = vscode.window.activeTextEditor;

        // FOCUS FALLBACK STRATEGY (v1.2.4)
        // If user actively opted into forceFocus, we do it.
        const config = vscode.workspace.getConfiguration('auto-accept-keyboard');
        const forceFocus = config.get('forceFocus', false);

        if (editor && forceFocus) {
            await vscode.window.showTextDocument(editor.document, {
                viewColumn: editor.viewColumn,
                preserveFocus: false
            });
        }

        // Official Antigravity accept commands
        const ACCEPT_COMMANDS_ANTIGRAVITY = [
            'antigravity.agent.acceptAgentStep',
            'antigravity.command.accept',
            'antigravity.prioritized.agentAcceptAllInFile',
            'antigravity.prioritized.agentAcceptFocusedHunk',
            'antigravity.prioritized.supercompleteAccept',
            'antigravity.terminalCommand.accept',
            'antigravity.acceptCompletion',
            'antigravity.prioritized.terminalSuggestion.accept'
        ];

        // START CDP IF NOT ACTIVE
        if (!cdpHandler) {
            cdpHandler = new CDPHandler(log);
        }

        if (!cdpHandler.isEnabled) {
            await cdpHandler.start();
        }

        // Check Status and Notify
        if (cdpHandler.connections.size === 0) {
            const args = process.argv.join(' ');
            const hasFlag = args.includes('--remote-debugging-port');

            if (!hasFlag) {
                // Rate limit this notification
                const now = Date.now();
                if (!globalContext.globalState.get('cdpNotificationLastShown') || (now - globalContext.globalState.get('cdpNotificationLastShown') > 60000)) {
                    vscode.window.showWarningMessage(
                        'Auto Accept: "Accept all" requires Remote Debugging enabled. Please close VS Code and launch with: code --remote-debugging-port=9222',
                        'Copy Command'
                    ).then(selection => {
                        if (selection === 'Copy Command') {
                            vscode.env.clipboard.writeText('code --remote-debugging-port=9222');
                        }
                    });
                    globalContext.globalState.update('cdpNotificationLastShown', now);
                }
                // log('CDP Failed: Missing launch flag --remote-debugging-port');
            } else {
                // log('CDP Failed: Flag present but no connection. Check port usage.');
            }

            // Fallback: If CDP fails, we MUST try command execution even if it steals focus (user can disable extension if annoying)
            // But we try to be gentle: only focus if we haven't successfully clicked globally in a while
            // For now, let's just log. v1.2.0 removed focus stealing, so we rely 100% on CDP.
        } else {
            // log(`CDP Active: ${cdpHandler.connections.size} pages connected`);
        }

        // Disable command execution logging to reduce noise if CDP is working
        // ... (rest of command execution) ...

        // Execute all accept commands in parallel and track results
        const results = await Promise.allSettled(
            ACCEPT_COMMANDS_ANTIGRAVITY.map(async cmd => {
                try {
                    const result = await vscode.commands.executeCommand(cmd);
                    log(`✓ ${cmd}: ${result !== undefined ? 'success' : 'executed'}`);
                    return { cmd, success: true, result };
                } catch (error) {
                    // log(`✗ ${cmd}: ${error.message}`);
                    return { cmd, success: false, error: error.message };
                }
            })
        );

        // Count successes
        const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;

    } catch (error) {
        // log(`Error executing accept commands: ${error.message}`);
    }
}

function startPolling() {
    if (pollInterval) {
        clearInterval(pollInterval);
    }

    const config = vscode.workspace.getConfiguration('auto-accept-keyboard');
    const interval = config.get('interval', 500);

    pollInterval = setInterval(async () => {
        if (!isEnabled) return;
        await simulateKeyboardShortcut();
    }, interval);
}

function stopPolling() {
    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
    }
}

function deactivate() {
    stopPolling();
}

module.exports = {
    activate,
    deactivate
};
