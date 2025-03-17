import { useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import FileUploader from '../components/FileUploader';

// Dynamically import the SimpleGraph component to avoid SSR issues
const SimpleGraph = dynamic(() => import('../components/custom/SimpleGraph'), {
  ssr: false
});

// Import the client-side parser
import ClientAgentParser from '../lib/client-parser';

export default function Home() {
  const [graphData, setGraphData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const processFiles = async (files) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const parser = new ClientAgentParser();
      
      // Process each file
      files.forEach(file => {
        const result = parser.parseCode(file.content);
        
        // For debugging
        console.log(`Parsed ${file.name}:`, result);
      });
      
      // Get the combined results
      const results = {
        agents: parser.agents,
        tools: parser.tools,
        handoffs: parser.handoffs,
        contexts: parser.contexts,
        guardrails: parser.guardrails
      };
      
      setGraphData(results);
    } catch (err) {
      console.error('Error processing files:', err);
      setError('Error processing files. Make sure they contain valid OpenAI Agents SDK code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>OpenAI Agents SDK Visualizer</title>
        <meta name="description" content="Visualize OpenAI Agents SDK components and relationships" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">OpenAI Agents SDK Visualizer</h1>
            <p className="mt-2 text-lg text-gray-600">
              Upload Python files to visualize agent relationships, tools, handoffs, and more
            </p>
          </div>

          <FileUploader onFileProcessed={processFiles} />
          
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
            <h2 className="text-xl font-medium text-gray-800 mb-3">Agent Relationship Graph</h2>
            {graphData && <SimpleGraph data={graphData} />}
          </div>
          
          {graphData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div>
                <h2 className="text-xl font-medium text-gray-800 mb-3">Agents ({graphData.agents.length})</h2>
                <div className="bg-white shadow overflow-hidden rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tools
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                <h2 className="text-xl font-medium text-gray-800 mb-3">Tools ({graphData.tools.length})</h2>
                <div className="bg-white shadow overflow-hidden rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
            OpenAI Agents SDK Visualizer • Built for visualizing agent relationship graphs
          </p>
        </div>
      </footer>
    </div>
  );
}
