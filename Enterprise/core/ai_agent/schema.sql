-- AI Agent Operational Memory Schema
-- Storage: SQLite (Unencrypted for Dev)
-- Purpose: State persistence, audit trails, and subagent governance

-- 1. Agent State: Current focus, global variables, and operational mode
CREATE TABLE IF NOT EXISTS agent_state (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Task Queue: Tracking active and pending tasks
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    tier INTEGER NOT NULL, -- 1: Auto, 2: Confirm, 3: Human
    status TEXT CHECK(status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED')) DEFAULT 'PENDING',
    priority INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    completed_at DATETIME,
    result TEXT,
    error TEXT
);

-- 3. Decision Log: Audit trail for every action taken (The "Black Box")
CREATE TABLE IF NOT EXISTS decision_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    action TEXT NOT NULL,
    input_context TEXT,
    reasoning TEXT,
    output_result TEXT,
    tier_override INTEGER,
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- 4. Subagent Registry: Managing the lifecycle of specialized agents
CREATE TABLE IF NOT EXISTS subagents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    purpose TEXT,
    permissions TEXT, -- JSON string of allowed commands/paths
    status TEXT CHECK(status IN ('ACTIVE', 'INACTIVE', 'TERMINATED')) DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_heartbeat DATETIME
);

-- 5. Subagent Execution Logs: Tracking what subagents are doing
CREATE TABLE IF NOT EXISTS subagent_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subagent_id TEXT,
    task_id TEXT,
    command TEXT,
    output TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subagent_id) REFERENCES subagents(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_decision_log_task ON decision_log(task_id);
CREATE INDEX IF NOT EXISTS idx_subagent_logs_agent ON subagent_logs(subagent_id);
