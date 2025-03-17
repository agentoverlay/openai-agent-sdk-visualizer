/**
 * Parser module for extracting OpenAI Agents SDK components from Python files
 */

const fs = require('fs');
const path = require('path');

// Simplified parsing approach - in production you'd use a proper Python AST parser
class AgentParser {
  constructor() {
    this.agents = [];
    this.tools = [];
    this.handoffs = [];
    this.contexts = [];
    this.guardrails = [];
  }

  /**
   * Parse a Python file to extract agent definitions and relationships
   */
  parseFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Extract agent definitions
      this.extractAgents(content);
      
      // Extract tools
      this.extractTools(content);
      
      // Extract contexts
      this.extractContexts(content);
      
      // Extract handoffs
      this.extractHandoffs(content);
      
      // Extract guardrails (if any)
      this.extractGuardrails(content);
      
      return {
        agents: this.agents,
        tools: this.tools,
        handoffs: this.handoffs,
        contexts: this.contexts,
        guardrails: this.guardrails
      };
    } catch (error) {
      console.error(`Error parsing file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Parse a directory of Python files
   */
  parseDirectory(dirPath) {
    try {
      const files = fs.readdirSync(dirPath);
      
      for (const file of files) {
        if (file.endsWith('.py')) {
          this.parseFile(path.join(dirPath, file));
        }
      }
      
      return {
        agents: this.agents,
        tools: this.tools,
        handoffs: this.handoffs,
        contexts: this.contexts,
        guardrails: this.guardrails
      };
    } catch (error) {
      console.error(`Error parsing directory ${dirPath}:`, error);
      return null;
    }
  }

  /**
   * Extract agent definitions from code
   */
  extractAgents(content) {
    // Look for agent definitions like: agent = Agent(...)
    const agentRegex = /(\w+)\s*=\s*Agent\[\w*\]\s*\(\s*name\s*=\s*["']([^"']+)["']/g;
    
    let match;
    while ((match = agentRegex.exec(content)) !== null) {
      const variableName = match[1];
      const agentName = match[2];
      
      // Extract instructions
      const instructionsMatch = content.substring(match.index).match(/instructions\s*=\s*["']{3}([\s\S]*?)["']{3}/);
      const instructions = instructionsMatch ? instructionsMatch[1].trim() : '';
      
      // Extract tools
      const toolsMatch = content.substring(match.index).match(/tools\s*=\s*\[([\s\S]*?)\]/);
      const toolsContent = toolsMatch ? toolsMatch[1] : '';
      const tools = toolsContent.split(',').map(t => t.trim()).filter(t => t);
      
      // Extract handoffs
      const handoffsMatch = content.substring(match.index).match(/handoffs\s*=\s*\[([\s\S]*?)\]/);
      const handoffsContent = handoffsMatch ? handoffsMatch[1] : '';
      const handoffs = handoffsContent.split(',').map(h => h.trim()).filter(h => h);
      
      this.agents.push({
        id: variableName,
        name: agentName,
        instructions,
        tools,
        handoffs
      });
    }
  }

  /**
   * Extract tool definitions from code
   */
  extractTools(content) {
    // Look for tool definitions: @function_tool
    const toolRegex = /@function_tool[\s\S]*?def\s+(\w+)\s*\(([\s\S]*?)\)\s*->\s*(\w+):/g;
    
    let match;
    while ((match = toolRegex.exec(content)) !== null) {
      const name = match[1];
      const params = match[2];
      const returnType = match[3];
      
      // Extract docstring
      const docstringMatch = content.substring(match.index).match(/"""([\s\S]*?)"""/);
      const description = docstringMatch ? docstringMatch[1].trim() : '';
      
      this.tools.push({
        id: name,
        name,
        params,
        returnType,
        description
      });
    }
  }

  /**
   * Extract context definitions from code
   */
  extractContexts(content) {
    // Look for context class definitions
    const contextRegex = /class\s+(\w+)\s*\(\s*BaseModel\s*\):/g;
    
    let match;
    while ((match = contextRegex.exec(content)) !== null) {
      const name = match[1];
      
      // Find class properties
      const classBodyMatch = content.substring(match.index).match(/{([\s\S]*?)}/);
      const classBody = classBodyMatch ? classBodyMatch[1] : '';
      
      // Extract docstring
      const docstringMatch = content.substring(match.index).match(/"""([\s\S]*?)"""/);
      const description = docstringMatch ? docstringMatch[1].trim() : '';
      
      this.contexts.push({
        id: name,
        name,
        description
      });
    }
  }

  /**
   * Extract handoff definitions from code
   */
  extractHandoffs(content) {
    // Look for handoff assignments like: agent.handoffs = [...]
    const handoffRegex = /(\w+)\.handoffs\s*=\s*\[([\s\S]*?)\]/g;
    
    let match;
    while ((match = handoffRegex.exec(content)) !== null) {
      const sourceAgent = match[1];
      const handoffsContent = match[2];
      
      // Parse handoff targets
      const targets = handoffsContent.split(',')
        .map(t => t.trim())
        .filter(t => t);
      
      for (const target of targets) {
        this.handoffs.push({
          id: `${sourceAgent}_to_${target}`,
          source: sourceAgent,
          target
        });
      }
    }
  }

  /**
   * Extract guardrail definitions from code
   */
  extractGuardrails(content) {
    // Basic extraction of guardrails (example pattern)
    const guardrailRegex = /Guardrail\s*\(\s*name\s*=\s*["']([^"']+)["']/g;
    
    let match;
    while ((match = guardrailRegex.exec(content)) !== null) {
      const name = match[1];
      
      this.guardrails.push({
        id: name,
        name
      });
    }
  }
}

module.exports = AgentParser;
