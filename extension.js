const vscode = require('vscode');

let pollingInterval;
let isEnabled = true;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Antigravity Auto-Accept is now active!');

    // Initialize state from configuration
    isEnabled = vscode.workspace.getConfiguration('antigravity-auto-accept').get('enabled');
    const intervalMs = vscode.workspace.getConfiguration('antigravity-auto-accept').get('pollingInterval') || 300;

    // Create status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'antigravity-auto-accept.toggle';
    statusBarItem.tooltip = 'Click to toggle Antigravity Auto-Accept';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Function to update status bar appearance
    const updateStatusBar = () => {
        if (isEnabled) {
            statusBarItem.text = `$(zap) Auto-Accept: ON`;
            statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
            statusBarItem.color = '#ffffff';
        } else {
            statusBarItem.text = `$(circle-slash) Auto-Accept: OFF`;
            statusBarItem.backgroundColor = undefined;
            statusBarItem.color = undefined;
        }
    };

    updateStatusBar();

    // Register toggle command
    let toggleCommand = vscode.commands.registerCommand('antigravity-auto-accept.toggle', async () => {
        isEnabled = !isEnabled;
        updateStatusBar();
        await vscode.workspace.getConfiguration('antigravity-auto-accept').update('enabled', isEnabled, true);
        vscode.window.setStatusBarMessage(`Antigravity Auto-Accept: ${isEnabled ? 'ENABLED' : 'DISABLED'}`, 3000);
    });

    context.subscriptions.push(toggleCommand);

    // Listen for configuration changes
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('antigravity-auto-accept.enabled')) {
            isEnabled = vscode.workspace.getConfiguration('antigravity-auto-accept').get('enabled');
            updateStatusBar();
        }
    }));

    // Start polling logic
    startPolling(intervalMs);
}

function startPolling(intervalMs) {
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }

    pollingInterval = setInterval(async () => {
        if (!isEnabled) return;

        // Note: VS Code extensions run in a separate process from the UI DOM.
        // To interact with the DOM (buttons), we typically need to use internal commands
        // or execute scripts in the webview context if applicable.
        // However, Antigravity/Cursor often expose internal commands for 'Accept All' or 'Apply'.

        try {
            // Priority 1: Use known internal IDE commands if they exist
            // These are based on the latest auto-accept-agent research for Antigravity
            const commands = [
                // Antigravity specific
                'antigravity.agent.acceptAgentStep',
                'antigravity.command.accept',
                'antigravity.prioritized.agentAcceptAllInFile',
                'antigravity.prioritized.agentAcceptFocusedHunk',
                'antigravity.prioritized.supercompleteAccept',
                'antigravity.terminalCommand.accept',
                'antigravity.acceptCompletion',
                'antigravity.prioritized.terminalSuggestion.accept',

                // Cursor fallback
                'cursorai.action.acceptAndRunGenerateInTerminal',
                'cursorai.action.acceptGenerateInTerminal',
                'composer.applyAll',
                'cursor.applyAll'
            ];

            for (const cmd of commands) {
                // We check if the command exists and then execute it
                // VS Code doesn't have a direct 'commandExists' but we can try-catch
                await vscode.commands.executeCommand(cmd).then(
                    () => console.log(`Executed: ${cmd}`),
                    (err) => { /* ignore errors for commands that don't exist or aren't applicable */ }
                );
            }

        } catch (error) {
            // Silently ignore errors in the polling loop
        }
    }, intervalMs);
}

function deactivate() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
}

module.exports = {
    activate,
    deactivate
};
