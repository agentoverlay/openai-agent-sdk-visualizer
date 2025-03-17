import { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Import ONLY ForceGraph2D component to avoid A-Frame dependencies
const ForceGraph2D = dynamic(() => import('react-force-graph').then(mod => {
  // Only import the ForceGraph2D component to avoid A-Frame dependency issues
  const { ForceGraph2D } = mod;
  return ForceGraph2D;
}), {
  ssr: false
});

const AgentGraph = ({ data }) => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredLink, setHoveredLink] = useState(null);
  const fgRef = useRef();

  useEffect(() => {
    if (!data) return;
    
    // Transform the parsed data into graph format
    const nodes = [];
    const links = [];
    
    // Add agent nodes
    data.agents.forEach(agent => {
      nodes.push({
        id: agent.id,
        name: agent.name,
        type: 'agent',
        data: agent,
        color: '#4f46e5', // Indigo for agents
      });
    });
    
    // Add tool nodes
    data.tools.forEach(tool => {
      nodes.push({
        id: tool.id,
        name: tool.name,
        type: 'tool',
        data: tool,
        color: '#10b981', // Emerald for tools
      });
    });
    
    // Add context nodes
    data.contexts.forEach(context => {
      nodes.push({
        id: context.id,
        name: context.name,
        type: 'context',
        data: context,
        color: '#f97316', // Orange for contexts
      });
    });
    
    // Add guardrail nodes
    data.guardrails.forEach(guardrail => {
      nodes.push({
        id: guardrail.id,
        name: guardrail.name, 
        type: 'guardrail',
        data: guardrail,
        color: '#ef4444', // Red for guardrails
      });
    });
    
    // Add handoff links
    data.handoffs.forEach(handoff => {
      links.push({
        source: handoff.source,
        target: handoff.target,
        type: 'handoff',
        data: handoff,
      });
    });
    
    // Add agent-to-tool links based on agent tool lists
    data.agents.forEach(agent => {
      if (agent.tools) {
        agent.tools.forEach(toolName => {
          // Find the matching tool
          const tool = data.tools.find(t => t.id === toolName || t.name === toolName);
          if (tool) {
            links.push({
              source: agent.id,
              target: tool.id,
              type: 'tool_usage',
              data: { description: `${agent.name} uses ${tool.name}` }
            });
          }
        });
      }
    });
    
    setGraphData({ nodes, links });
  }, [data]);

  useEffect(() => {
    // Wait a bit for the graph to initialize
    const timer = setTimeout(() => {
      if (fgRef.current && graphData.nodes.length > 0) {
        try {
          fgRef.current.zoomToFit(400);
        } catch (e) {
          console.log("Could not zoom to fit", e);
        }
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [graphData]);

  const handleNodeHover = node => {
    setHoveredNode(node);
    setHoveredLink(null); // Clear link hover when hovering over a node
  };

  const handleLinkHover = link => {
    setHoveredLink(link);
    setHoveredNode(null); // Clear node hover when hovering over a link
  };

  return (
    <div className="relative w-full h-[600px] border rounded-lg overflow-hidden">
      {graphData.nodes.length > 0 ? (
        <>
          {ForceGraph2D && (
            <ForceGraph2D
              ref={fgRef}
              graphData={graphData}
              nodeLabel={node => node.name}
              nodeColor={node => node.color}
              nodeRelSize={6}
              linkWidth={link => hoveredLink === link ? 3 : 1}
              linkColor={link => link.type === 'handoff' ? '#4338ca' : '#9ca3af'}
              linkDirectionalArrowLength={5}
              linkDirectionalArrowRelPos={1}
              linkDirectionalParticles={link => link.type === 'handoff' ? 4 : 0}
              linkDirectionalParticleWidth={2}
              onNodeHover={handleNodeHover}
              onLinkHover={handleLinkHover}
              cooldownTime={3000}
            />
          )}
          
          {/* Node info panel */}
          {hoveredNode && (
            <div className="absolute top-4 right-4 w-64 bg-white shadow-lg rounded-lg p-4 text-sm">
              <h3 className="font-medium text-gray-800">{hoveredNode.name}</h3>
              <p className="text-xs text-gray-500 capitalize mb-2">{hoveredNode.type}</p>
              
              {hoveredNode.type === 'agent' && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-600">Instructions:</p>
                  <p className="text-xs text-gray-600 max-h-24 overflow-y-auto">
                    {hoveredNode.data.instructions.substring(0, 150)}
                    {hoveredNode.data.instructions.length > 150 ? '...' : ''}
                  </p>
                  
                  {hoveredNode.data.tools?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-600">Tools:</p>
                      <ul className="list-disc list-inside text-xs text-gray-600">
                        {hoveredNode.data.tools.map((tool, i) => (
                          <li key={i}>{tool}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              {hoveredNode.type === 'tool' && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-600">Description:</p>
                  <p className="text-xs text-gray-600">{hoveredNode.data.description || 'No description available'}</p>
                  
                  <p className="text-xs font-medium text-gray-600 mt-2">Return Type:</p>
                  <p className="text-xs text-gray-600">{hoveredNode.data.returnType}</p>
                </div>
              )}
              
              {hoveredNode.type === 'context' && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-600">Description:</p>
                  <p className="text-xs text-gray-600">{hoveredNode.data.description || 'No description available'}</p>
                </div>
              )}
            </div>
          )}
          
          {/* Link info panel */}
          {hoveredLink && (
            <div className="absolute top-4 right-4 w-64 bg-white shadow-lg rounded-lg p-4 text-sm">
              <h3 className="font-medium text-gray-800">
                {hoveredLink.type === 'handoff' ? 'Agent Handoff' : 'Tool Usage'}
              </h3>
              
              <div className="mt-2">
                <p className="text-xs font-medium text-gray-600">From:</p>
                <p className="text-xs text-gray-600">{hoveredLink.source.name || hoveredLink.source}</p>
                
                <p className="text-xs font-medium text-gray-600 mt-2">To:</p>
                <p className="text-xs text-gray-600">{hoveredLink.target.name || hoveredLink.target}</p>
                
                {hoveredLink.data?.description && (
                  <>
                    <p className="text-xs font-medium text-gray-600 mt-2">Description:</p>
                    <p className="text-xs text-gray-600">{hoveredLink.data.description}</p>
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white shadow-sm rounded-lg p-3">
            <h4 className="text-xs font-medium text-gray-700 mb-2">Legend</h4>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[#4f46e5] mr-2"></div>
                <span className="text-xs text-gray-700">Agent</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[#10b981] mr-2"></div>
                <span className="text-xs text-gray-700">Tool</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[#f97316] mr-2"></div>
                <span className="text-xs text-gray-700">Context</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[#ef4444] mr-2"></div>
                <span className="text-xs text-gray-700">Guardrail</span>
              </div>
              <div className="flex items-center mt-1">
                <div className="w-4 h-0.5 bg-[#4338ca] mr-2"></div>
                <span className="text-xs text-gray-700">Handoff</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-0.5 bg-[#9ca3af] mr-2"></div>
                <span className="text-xs text-gray-700">Tool Usage</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-500">Loading data or no data available</p>
        </div>
      )}
    </div>
  );
};

export default AgentGraph;
