/**
 * AI Agent Governance Framework
 * Implements Autonomy Tiers and Subagent Lifecycle Management
 * 
 * Tiers:
 * Tier 1 (Auto): No human intervention required.
 * Tier 2 (Confirm): Requires human 'OK' via API/CLI.
 * Tier 3 (Human): Requires explicit human execution.
 */

import { Database } from 'bun:sqlite';
import { execSync } from 'child_process';

// --- Types ---
type Tier = 1 | 2 | 3;
type TaskStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

interface Task {
    id: string;
    title: string;
    tier: Tier;
    status: TaskStatus;
    command: string;
}

interface SubAgent {
    id: string;
    name: string;
    permissions: string[];
}

// --- Governance Engine ---
class GovernanceEngine {
    private db: Database;

    constructor() {
        this.db = new Database('ai_memory.db');
        this.initDb();
    }

    private initDb() {
        // In a real impl, this would run the schema.sql
        console.log("Initializing AI Memory Database...");
    }

    /**
     * The core gatekeeper function. 
     * Determines if a command can be executed based on its tier.
     */
    async executeTask(task: Task) {
        console.log(`[Governance] Evaluating task: ${task.title} (Tier ${task.tier})`);

        switch (task.tier) {
            case 1:
                return this.runAutoTask(task);
            case 2:
                return this.awaitConfirmation(task);
            case 3:
                return this.escalateToHuman(task);
            default:
                throw new Error("Invalid autonomy tier");
        }
    }

    private async runAutoTask(task: Task) {
        console.log(`[Tier 1] Executing autonomously: ${task.command}`);
        try {
            const result = execSync(task.command, { encoding: 'utf8' });
            this.logDecision(task.id, 'EXECUTE', 'Auto-executed Tier 1 task', result);
            return { status: 'COMPLETED', result };
        } catch (e: any) {
            this.logDecision(task.id, 'ERROR', 'Tier 1 task failed', e.message);
            return { status: 'FAILED', error: e.message };
        }
    }

    private async awaitConfirmation(task: Task) {
        console.log(`[Tier 2] Requesting confirmation for: ${task.title}`);
        // In reality, this would push a notification to the admin (e.g., via Signal/Discord/API)
        // and poll the 'tasks' table for a status change to 'APPROVED'.
        return { status: 'PENDING_CONFIRMATION', message: 'Waiting for human approval' };
    }

    private async escalateToHuman(task: Task) {
        console.log(`[Tier 3] Critical Task: Manual execution required.`);
        console.log(`Instruction: Please run '${task.command}' manually and update state.`);
        return { status: 'HUMAN_REQUIRED', message: 'Task escalated to human' };
    }

    private logDecision(taskId: string, action: string, reasoning: string, result: string) {
        this.db.run(
            "INSERT INTO decision_log (task_id, action, reasoning, output_result) VALUES (?, ?, ?, ?)",
            [taskId, action, reasoning, result]
        );
    }
}

// --- Subagent Manager ---
class SubAgentManager {
    private db: Database;

    constructor(db: Database) {
        this.db = db;
    }

    async spawnSubAgent(name: string, purpose: string, permissions: string[]) {
        const id = crypto.randomUUID();
        console.log(`[SubAgent] Spawning ${name} (${id}) for purpose: ${purpose}`);
        
        this.db.run(
            "INSERT INTO subagents (id, name, purpose, permissions) VALUES (?, ?, ?, ?)",
            [id, name, purpose, JSON.stringify(permissions)]
        );

        return { id, name };
    }

    async terminateSubAgent(id: string) {
        console.log(`[SubAgent] Terminating agent ${id}...`);
        this.db.run("UPDATE subagents SET status = 'TERMINATED' WHERE id = ?", [id]);
    }

    async validatePermission(agentId: string, command: string): Promise<boolean> {
        const agent = this.db.query("SELECT permissions FROM subagents WHERE id = ?").get(agentId) as any;
        if (!agent) return false;
        
        const permissions = JSON.parse(agent.permissions);
        // Simple prefix/regex check for allowed commands
        return permissions.some((p: string) => command.startsWith(p));
    }
}

// --- Example Usage ---
async function main() {
    const gov = new GovernanceEngine();
    const sam = new SubAgentManager(new Database('ai_memory.db'));

    // Example Tier 1 Task
    await gov.executeTask({
        id: 't1',
        title: 'Rotate Log Files',
        tier: 1,
        status: 'PENDING',
        command: 'ls -lh /var/log'
    });

    // Example Tier 2 Task
    await gov.executeTask({
        id: 't2',
        title: 'Restart Forgejo',
        tier: 2,
        status: 'PENDING',
        command: 'kubectl rollout restart deployment forgejo'
    });

    // Example Tier 3 Task
    await gov.executeTask({
        id: 't3',
        title: 'Rotate Vault Master Key',
        tier: 3,
        status: 'PENDING',
        command: 'vault operator rotate'
    });

    // Example Subagent
    const backupAgent = await sam.spawnSubAgent('BackupAgent', 'Daily DB backups', ['tar -czf', 'aws s3 cp']);
    console.log(`Spawned ${backupAgent.name} with ID ${backupAgent.id}`);
}

if (require.main === undefined) {
    // This is for Bun's execution model
} else {
    main().catch(console.error);
}
