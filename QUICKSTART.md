# OpenAI Agents SDK Visualizer Quick Start

This tool allows you to visualize OpenAI Agents SDK components and relationships by parsing Python files.

## Quick Start

1. **On macOS**: 
   - Double-click `run-mac.command`
   - If you get a security warning, right-click the file and select "Open"

2. **On Windows**:
   - Double-click `run.bat`

3. **Manual Start**:
   ```bash
   npm install  # First time only
   npm run dev
   ```

4. Open your browser to http://localhost:3000

## Using the Tool

1. Once the app is running, drag and drop Python files containing OpenAI Agents SDK code onto the upload area
2. The visualization will appear showing agents as nodes and handoffs as edges
3. Hover over nodes to see details about agents, tools, contexts, and guardrails
4. Hover over edges to see details about handoffs and tool relationships

## Example Files

An example file `example.py` is included that demonstrates various OpenAI Agents SDK patterns. 
Use this to test the visualization tool if you don't have your own agent code yet.

## Troubleshooting

- Make sure your Python files use standard OpenAI Agents SDK patterns
- Check the browser console for any parsing errors
- If the visualization is empty, try adjusting your agent code to use more standard patterns
