import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getAllToolNames } from './agent-tools';

/**
 * Activates the Maintenance Agents extension.
 *
 * Installs the agent mode file and MCP server config into each workspace
 * folder so Copilot's agent mode can call the maintenance tools.
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
    console.log('Maintenance Agents extension activating...');
    try {
        const toolNames = getAllToolNames();
        await installAgentModeFile(context, toolNames);
        installMcpConfig(context);
        console.log('Maintenance Agents extension activated successfully');
    } catch (error) {
        console.error('Failed to activate Maintenance Agents extension:', error);
        vscode.window.showErrorMessage(
            'Failed to activate Maintenance Agents extension. Check the output console for details.'
        );
        throw error;
    }
}

/**
 * Writes maintenance.agent.md to .github/agents/ in each workspace folder
 * so the agent appears in the VS Code "Set Agent" dropdown.
 */
async function installAgentModeFile(
    context: vscode.ExtensionContext,
    toolNames: string[]
): Promise<void> {
    const templatePath = path.join(context.extensionPath, 'chatmodes', 'maintenance.agent.md');
    if (!fs.existsSync(templatePath)) {
        return;
    }

    const builtinTools = ['changes', 'codebase', 'editFiles', 'problems', 'runCommands', 'search', 'terminal'];
    const allTools = [...builtinTools, ...toolNames];
    const toolsLine = `tools: [${allTools.map(t => `'${t}'`).join(', ')}]`;

    const template = fs.readFileSync(templatePath, 'utf8');
    const content = template.replace(/^tools:.*$/m, toolsLine);

    for (const folder of vscode.workspace.workspaceFolders ?? []) {
        const agentsDir = path.join(folder.uri.fsPath, '.github', 'agents');
        const destFile = path.join(agentsDir, 'maintenance.agent.md');
        fs.mkdirSync(agentsDir, { recursive: true });
        fs.writeFileSync(destFile, content, 'utf8');
        ensureGitignored(folder.uri.fsPath, '.github/agents/maintenance.agent.md');
        console.log(`Maintenance Agents: installed agent mode file at ${destFile}`);
    }
}

/**
 * Appends the given pattern to the workspace .gitignore if not already present.
 */
function ensureGitignored(workspaceRoot: string, pattern: string): void {
    const gitignorePath = path.join(workspaceRoot, '.gitignore');
    try {
        const existing = fs.existsSync(gitignorePath)
            ? fs.readFileSync(gitignorePath, 'utf8')
            : '';
        if (!existing.split('\n').some(line => line.trim() === pattern)) {
            const separator = existing.length > 0 && !existing.endsWith('\n') ? '\n' : '';
            fs.appendFileSync(gitignorePath, `${separator}${pattern}\n`, 'utf8');
        }
    } catch (err) {
        console.warn(`Maintenance Agents: could not update .gitignore: ${err}`);
    }
}

/**
 * Returns the first python executable found in PATH ('python3' or 'python').
 * Falls back to 'python3' if neither can be verified.
 */
function findPythonExecutable(): string {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { execSync } = require('child_process') as typeof import('child_process');
    for (const cmd of ['python3', 'python']) {
        try {
            execSync(`${cmd} --version`, { stdio: 'pipe' });
            return cmd;
        } catch {
            // not available — try next candidate
        }
    }
    return 'python3';
}

/**
 * Writes .vscode/mcp.json to each workspace folder so VS Code starts the
 * Python MCP server and exposes maintenance tools to Copilot's agent mode.
 *
 * Prerequisites on the user's machine:
 *   pip install mcp pyyaml
 */
function installMcpConfig(context: vscode.ExtensionContext): void {
    const serverScript = path.join(context.extensionPath, 'mcp-server', 'server.py');
    if (!fs.existsSync(serverScript)) {
        console.warn('Maintenance Agents: Python MCP server script not found, skipping mcp.json install');
        return;
    }

    const pythonCmd = findPythonExecutable();

    const mcpConfig = {
        servers: {
            'maintenance-agents': {
                type: 'stdio',
                command: pythonCmd,
                args: [serverScript, context.extensionPath],
            },
        },
    };

    for (const folder of vscode.workspace.workspaceFolders ?? []) {
        const vscodeDir = path.join(folder.uri.fsPath, '.vscode');
        const mcpFile  = path.join(vscodeDir, 'mcp.json');
        fs.mkdirSync(vscodeDir, { recursive: true });
        fs.writeFileSync(mcpFile, JSON.stringify(mcpConfig, null, 2), 'utf8');
        ensureGitignored(folder.uri.fsPath, '.vscode/mcp.json');
        console.log(`Maintenance Agents: installed MCP config at ${mcpFile}`);
    }
}

/**
 * Deactivates the Maintenance Agents extension.
 */
export function deactivate(): void {
    console.log('Maintenance Agents extension deactivating...');
}
