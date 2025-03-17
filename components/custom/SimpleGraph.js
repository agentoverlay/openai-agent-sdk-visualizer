import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

const SimpleGraph = ({ data }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredLink, setHoveredLink] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  // Calculate container dimensions
  useEffect(() => {
    // Debug data to see what's coming in
    console.log("Graph data received:", data);
    
    if (!data || !data.agents || !data.links) {
      // Transform the data into the format D3 expects
      if (data) {
        const nodes = [];
        const links = [];
        
        // Add agent nodes
        if (data.agents && Array.isArray(data.agents)) {
          data.agents.forEach(agent => {
            nodes.push({
              id: agent.id,
              name: agent.name,
              type: 'agent',
              data: agent,
              color: '#4f46e5', // Indigo for agents
            });
          });
        }
        
        // Add tool nodes
        if (data.tools && Array.isArray(data.tools)) {
          data.tools.forEach(tool => {
            nodes.push({
              id: tool.id,
              name: tool.name,
              type: 'tool',
              data: tool,
              color: '#10b981', // Emerald for tools
            });
          });
        }
        
        // Add context nodes
        if (data.contexts && Array.isArray(data.contexts)) {
          data.contexts.forEach(context => {
            nodes.push({
              id: context.id,
              name: context.name,
              type: 'context',
              data: context,
              color: '#f97316', // Orange for contexts
            });
          });
        }
        
        // Add guardrail nodes
        if (data.guardrails && Array.isArray(data.guardrails)) {
          data.guardrails.forEach(guardrail => {
            nodes.push({
              id: guardrail.id,
              name: guardrail.name, 
              type: 'guardrail',
              data: guardrail,
              color: '#ef4444', // Red for guardrails
            });
          });
        }
        
        // Add handoff links
        if (data.handoffs && Array.isArray(data.handoffs)) {
          data.handoffs.forEach(handoff => {
            links.push({
              source: handoff.source,
              target: handoff.target,
              type: 'handoff',
              data: handoff,
            });
          });
        }
        
        // Add agent-to-tool links based on agent tool lists
        if (data.agents && Array.isArray(data.agents)) {
          data.agents.forEach(agent => {
            if (agent.tools && Array.isArray(agent.tools)) {
              agent.tools.forEach(toolName => {
                if (data.tools && Array.isArray(data.tools)) {
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
                }
              });
            }
          });
        }
        
        data = { nodes, links };
        console.log("Transformed data:", data);
        
        setDebugInfo({
          originalData: { ...data },
          transformedData: { nodes, links },
          nodesCount: nodes.length,
          linksCount: links.length
        });
      }
    }

    if (!data || !data.nodes || data.nodes.length === 0) {
      console.error("No valid data for graph visualization");
      return;
    }
    
    if (!containerRef.current) return;
    
    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();
    
    const width = containerRef.current.clientWidth;
    const height = 600;
    
    // Setup SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);
    
    // Create a group for zoom/pan
    const g = svg.append("g");
    
    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    svg.call(zoom);
    
    // Create the simulation
    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(30));
    
    // Add links
    const link = g.append("g")
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("stroke", d => d.type === 'handoff' ? '#4338ca' : '#9ca3af')
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.6)
      .attr("marker-end", d => d.type === 'handoff' ? "url(#arrowhead)" : null)
      .on("mouseover", (event, d) => {
        setHoveredLink(d);
        setHoveredNode(null);
      })
      .on("mouseout", () => {
        setHoveredLink(null);
      });
    
    // Add arrow marker for handoffs
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#4338ca");
    
    // Add nodes
    const node = g.append("g")
      .selectAll("circle")
      .data(data.nodes)
      .join("circle")
      .attr("r", 8)
      .attr("fill", d => d.color)
      .on("mouseover", (event, d) => {
        setHoveredNode(d);
        setHoveredLink(null);
      })
      .on("mouseout", () => {
        setHoveredNode(null);
      })
      .call(drag(simulation));
    
    // Add node labels
    const label = g.append("g")
      .selectAll("text")
      .data(data.nodes)
      .join("text")
      .attr("dy", -12)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .text(d => d.name)
      .call(drag(simulation));
    
    // Update positions in simulation
    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);
      
      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
      
      label
        .attr("x", d => d.x)
        .attr("y", d => d.y);
    });
    
    // Drag behavior
    function drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      
      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      
      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      
      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }
    
    // Auto-zoom to fit content
    svg.call(zoom.transform, d3.zoomIdentity);
    
    // Give a chance for the layout to stabilize
    setTimeout(() => {
      const graphBounds = g.node().getBBox();
      
      // Check if we have valid bounds
      if (graphBounds && graphBounds.width > 0 && graphBounds.height > 0) {
        const scale = 0.9 / Math.max(graphBounds.width / width, graphBounds.height / height);
        const translateX = width / 2 - scale * (graphBounds.x + graphBounds.width / 2);
        const translateY = height / 2 - scale * (graphBounds.y + graphBounds.height / 2);
        
        svg.transition().duration(750).call(
          zoom.transform,
          d3.zoomIdentity.translate(translateX, translateY).scale(scale)
        );
      }
    }, 1000);
    
    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [data]);

  return (
    <div className="relative w-full h-[600px] border rounded-lg overflow-hidden" ref={containerRef}>
      <svg ref={svgRef} className="w-full h-full" />
      
      {/* Debug information panel */}
      {debugInfo && (
        <div className="absolute top-0 left-0 bg-white bg-opacity-75 p-2 text-xs">
          <p>Nodes: {debugInfo.nodesCount}</p>
          <p>Links: {debugInfo.linksCount}</p>
        </div>
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
                {hoveredNode.data.instructions?.substring(0, 150)}
                {hoveredNode.data.instructions?.length > 150 ? '...' : ''}
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
            <p className="text-xs text-gray-600">{hoveredLink.source.name || hoveredLink.source.id}</p>
            
            <p className="text-xs font-medium text-gray-600 mt-2">To:</p>
            <p className="text-xs text-gray-600">{hoveredLink.target.name || hoveredLink.target.id}</p>
            
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
    </div>
  );
};

export default SimpleGraph;
