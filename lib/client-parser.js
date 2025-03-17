/**
 * Client-side parser for extracting OpenAI Agents SDK components from Python code
 */

class ClientAgentParser {
  constructor() {
    this.agents = [];
    this.tools = [];
    this.handoffs = [];
    this.contexts = [];
    this.guardrails = [];
  }

  /**
   * Parse Python code to extract agent definitions and relationships
   */
  parseCode(content) {
    // Reset all collections
    this.agents = [];
    this.tools = [];
    this.handoffs = [];
    this.contexts = [];
    this.guardrails = [];
    
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
  }

  /**
   * Extract agent definitions from code
   */
  extractAgents(content) {
    // Look for agent definitions like: agent = Agent(...)
    const agentRegex = /(\w+)\s*=\s*Agent\[?\w*\]?\s*\(\s*name\s*=\s*["']([^"']+)["']/g;
    
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
      const tools = toolsContent.split(',')
        .map(t => t.trim())
        .map(t => t.replace(/[\[\]'"\s]/g, '')) // Remove quotes, brackets, spaces
        .filter(t => t);
      
      // Extract handoffs
      const handoffsMatch = content.substring(match.index).match(/handoffs\s*=\s*\[([\s\S]*?)\]/);
      const handoffsContent = handoffsMatch ? handoffsMatch[1] : '';
      const handoffs = handoffsContent.split(',')
        .map(h => h.trim())
        .map(h => h.replace(/[\[\]'"\s]/g, '')) // Remove quotes, brackets, spaces
        .filter(h => h);
      
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
      
      // Find class body
      let endIndex = content.indexOf("class", match.index + 6);
      if (endIndex === -1) endIndex = content.length;
      const classBody = content.substring(match.index, endIndex);
      
      // Extract docstring
      const docstringMatch = classBody.match(/"""([\s\S]*?)"""/);
      const description = docstringMatch ? docstringMatch[1].trim() : '';
      
      // Extract properties
      const properties = [];
      const propertyRegex = /(\w+):\s*(?:Optional\[)?(\w+)(?:\])?\s*=\s*(?:None|.*)/g;
      let propMatch;
      
      while ((propMatch = propertyRegex.exec(classBody)) !== null) {
        properties.push({
          name: propMatch[1],
          type: propMatch[2]
        });
      }
      
      this.contexts.push({
        id: name,
        name,
        description,
        properties
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
        .map(t => t.replace(/[\[\]'"\s]/g, '')) // Remove quotes, brackets, spaces
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

export default ClientAgentParser;
