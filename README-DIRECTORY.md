# Visualizing a Directory of Agent Files

This guide explains how to use the Agent Visualizer to analyze a directory containing OpenAI Agents SDK Python files.

## Visualizing a Directory

### On macOS/Linux:

1. Make the script executable (first time only):
```bash
chmod +x visualize-dir.sh
```

2. Run the script with the path to your directory:
```bash
./visualize-dir.sh /path/to/your/agent/files
```

### On Windows:

1. Run the script with the path to your directory:
```
visualize-dir.bat C:\path\to\your\agent\files
```

## What the Script Does

1. Scans the directory for all Python (.py) files
2. Parses each file for OpenAI Agents SDK patterns (agents, tools, contexts, etc.)
3. Starts the visualization server if it's not already running
4. Opens your browser to the visualization

## Troubleshooting

### No Agents Found

If the visualization shows no agents, check that your Python files:
- Contain proper OpenAI Agents SDK code
- Use standard patterns (e.g., `agent = Agent(name="...")`)
- Have proper indentation and syntax

### Other Issues

- Make sure Node.js is installed and accessible
- Check that you have all dependencies installed (`npm install`)
- If the server doesn't start, try running it manually with `npm run dev`

## Example

Let's say you have a directory with multiple agent files:

```
/my-agents/
├── account_agent.py
├── triage_agent.py
└── support_agent.py
```

Simply run:
```bash
./visualize-dir.sh /my-agents
```

This will parse all three Python files and visualize their relationships.
