import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface SessionEntry {
    timestamp: string;
    query: string;
    agents: string[];
    command: string;
}

/**
 * Persists recent query history to VS Code's global storage so context
 * survives across sessions. Stores the last 10 entries.
 */
export class SessionMemory {
    private readonly filePath: string;
    private readonly maxEntries = 10;

    constructor(context: vscode.ExtensionContext) {
        const storageDir = context.globalStorageUri.fsPath;
        if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
        }
        this.filePath = path.join(storageDir, 'session-history.json');
    }

    save(query: string, agents: string[], command: string): void {
        const entries = this.load();
        entries.unshift({ timestamp: new Date().toISOString(), query, agents, command });
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(entries.slice(0, this.maxEntries), null, 2), 'utf-8');
        } catch (err) {
            console.warn('SessionMemory: failed to write history:', err);
        }
    }

    load(): SessionEntry[] {
        try {
            if (!fs.existsSync(this.filePath)) return [];
            return JSON.parse(fs.readFileSync(this.filePath, 'utf-8')) as SessionEntry[];
        } catch {
            return [];
        }
    }

    /**
     * Returns a formatted string of the last `limit` sessions for injection
     * into the LLM context, or an empty string if there is no history.
     */
    getRecentContext(limit = 3): string {
        const entries = this.load().slice(0, limit);
        if (entries.length === 0) return '';

        const lines = entries.map(e => {
            const date = new Date(e.timestamp).toLocaleDateString();
            return `- [${date}] "${e.query}" → ${e.agents.join(', ')}`;
        });

        return `[PREVIOUS SESSIONS]\n${lines.join('\n')}\n[END PREVIOUS SESSIONS]`;
    }
}
