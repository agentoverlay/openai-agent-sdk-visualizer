import { useState, useEffect } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import Link from "next/link";
import ClientAgentParser from "../lib/client-parser";

// Dynamically import the SimpleGraph component instead of ForceGraph
const SimpleGraph = dynamic(() => import("../components/custom/SimpleGraph"), {
  ssr: false,
});

// Helper function to transform data for the graph
function prepareGraphData(data) {
  if (!data) return null;
  
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
  
  return { nodes, links };
}

export default function LocalFile() {
  const [graphData, setGraphData] = useState(null);
  const [formattedGraphData, setFormattedGraphData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileNames, setFileNames] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Load data from temporary storage
        const response = await fetch("/temp-data.json");

        if (!response.ok) {
          throw new Error(
            "No file data found. Please run the visualization script first."
          );
        }

        const files = await response.json();
        setFileNames(files.map((file) => file.name));

        const parser = new ClientAgentParser();

        // Process each file
        files.forEach((file) => {
          try {
            parser.parseCode(file.content);
            console.log(`Parsed ${file.name}`);
          } catch (err) {
            console.error(`Error parsing ${file.name}:`, err);
          }
        });

        // Get the combined results
        const results = {
          agents: parser.agents,
          tools: parser.tools,
          handoffs: parser.handoffs,
          contexts: parser.contexts,
          guardrails: parser.guardrails,
        };
        
        console.log("Parser results:", results);
        setGraphData(results);
        
        // Format data for graph visualization
        const formattedData = prepareGraphData(results);
        console.log("Formatted data for graph:", formattedData);
        setFormattedGraphData(formattedData);
      } catch (err) {
        console.error("Error processing files:", err);
        setError(err.message || "Error processing files");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Local File Visualization - OpenAI Agents SDK</title>
        <meta
          name="description"
          content="Visualize local OpenAI Agents SDK Python files"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Local File Visualization
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                Visualizing OpenAI Agents SDK from local files
              </p>
            </div>
            <Link href="/">
              <span className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer">
                Return to Uploader
              </span>
            </Link>
          </div>

          {fileNames.length > 0 && (
            <div className="bg-white p-4 mb-6 rounded-lg shadow-sm">
              <h2 className="text-md font-medium text-gray-700 mb-2">
                Files Loaded:
              </h2>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {fileNames.map((name, index) => (
                  <li key={index}>{name}</li>
                ))}
              </ul>
            </div>
          )}

          {isLoading && (
            <div className="flex justify-center my-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-xl font-medium text-gray-800 mb-3">
              Agent Relationship Graph
            </h2>
            {formattedGraphData ? (
              <SimpleGraph data={formattedGraphData} />
            ) : !isLoading && (
              <div className="border rounded-lg p-8 text-center text-gray-500">
                No graph data available. Make sure your Python files contain valid OpenAI Agents SDK code.
              </div>
            )}
          </div>

          {graphData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div>
                <h2 className="text-xl font-medium text-gray-800 mb-3">
                  Agents ({graphData.agents.length})
                </h2>
                <div className="bg-white shadow overflow-hidden rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Name
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Tools
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Handoffs
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {graphData.agents.map((agent) => (
                        <tr key={agent.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {agent.name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {agent.tools.length}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {agent.handoffs.length}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-medium text-gray-800 mb-3">
                  Tools ({graphData.tools.length})
                </h2>
                <div className="bg-white shadow overflow-hidden rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Name
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Return Type
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {graphData.tools.map((tool) => (
                        <tr key={tool.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {tool.name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {tool.returnType}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t mt-12 py-6">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-gray-500">
            OpenAI Agents SDK Visualizer • Built for visualizing agent
            relationship graphs
          </p>
        </div>
      </footer>
    </div>
  );
}
