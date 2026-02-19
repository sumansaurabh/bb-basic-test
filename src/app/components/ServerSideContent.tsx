// Server-side rendered content component
interface ServerInfo {
  timestamp: string;
  serverLoad: number;
  requestId: string;
  environment: string;
  userAgent: string;
}

interface ServerProcessedItem {
  id: number;
  serverGeneratedData: string;
  processedAt: string;
  hash: string;
}

interface ServerData {
  serverInfo: ServerInfo;
  initialHeavyComponentCount: number;
  serverProcessedItems: ServerProcessedItem[];
}

interface ServerSideContentProps {
  serverData: ServerData;
}

/**
 * Renders server-side content including server information and processed items.
 */
export function ServerSideContent({ serverData }: ServerSideContentProps) {
  const { serverInfo, serverProcessedItems } = serverData;

  return (
    <div className="p-4">
      <div className="max-w-7xl mx-auto">
        {/* Server-rendered header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 bg-clip-text text-transparent">
            🔥 SSR + CSR EXTREME LOAD TESTING 🔥
          </h1>
          <p className="text-xl text-red-400 font-bold">
            ⚠️ WARNING: This page combines Server-Side and Client-Side Rendering ⚠️
          </p>
          
          {/* Server info panel */}
          <div className="mt-6 p-6 bg-blue-900 rounded-lg border border-blue-600">
            <h2 className="text-2xl font-bold text-blue-300 mb-4">📊 Server-Side Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
              <div className="bg-blue-800 p-4 rounded">
                <h3 className="font-bold text-blue-200">Request ID</h3>
                <p className="text-blue-100">{serverInfo.requestId}</p>
              </div>
              <div className="bg-blue-800 p-4 rounded">
                <h3 className="font-bold text-blue-200">Server Timestamp</h3>
                <p className="text-blue-100">{new Date(serverInfo.timestamp).toLocaleString()}</p>
              </div>
              <div className="bg-blue-800 p-4 rounded">
                <h3 className="font-bold text-blue-200">Environment</h3>
                <p className="text-blue-100">{serverInfo.environment}</p>
              </div>
              <div className="bg-blue-800 p-4 rounded">
                <h3 className="font-bold text-blue-200">Server Load</h3>
                <p className="text-blue-100">{serverInfo.serverLoad.toFixed(2)}%</p>
              </div>
              <div className="bg-blue-800 p-4 rounded">
                <h3 className="font-bold text-blue-200">Rendering Method</h3>
                <p className="text-blue-100">Server-Side Rendered</p>
              </div>
              <div className="bg-blue-800 p-4 rounded">
                <h3 className="font-bold text-blue-200">Total Server Items</h3>
                <p className="text-blue-100">{serverProcessedItems.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Server-processed content */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-4 text-cyan-400">🖥️ Server-Processed Heavy Content</h2>
          <div className="bg-gray-800 p-6 rounded-lg">
            <p className="text-gray-300 mb-4">
              This content was processed and rendered on the server at {new Date(serverInfo.timestamp).toLocaleString()}
            </p>
            
            {/* Server-rendered heavy list */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 max-h-96 overflow-y-auto">
              {serverProcessedItems.slice(0, 200).map(item => (
                <div
                  key={item.id}
                  className="p-3 bg-gradient-to-r from-cyan-800 to-blue-800 rounded text-sm"
                >
                  <div className="font-bold text-cyan-200">{item.serverGeneratedData}</div>
                  <div className="text-xs text-cyan-400">Hash: {item.hash}</div>
                  <div className="text-xs text-gray-400">
                    Processed: {new Date(item.processedAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Static server-rendered tables */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-4 text-green-400">📈 Server Performance Metrics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-green-300 mb-4">Server Processing Stats</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-2 text-green-200">Metric</th>
                    <th className="text-left py-2 text-green-200">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 20 }, (_, i) => (
                    <tr key={i} className="border-b border-gray-700">
                      <td className="py-2 text-gray-300">Server Metric {i + 1}</td>
                      <td className="py-2 text-gray-100">{(Math.random() * 1000).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-purple-300 mb-4">SSR Benchmark Results</h3>
              <div className="space-y-3">
                {Array.from({ length: 15 }, (_, i) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                    <span className="text-gray-300">Benchmark {i + 1}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-600 rounded">
                        <div 
                          className="h-2 bg-purple-500 rounded"
                          style={{ width: `${Math.random() * 100}%` }}
                        />
                      </div>
                      <span className="text-gray-100 text-sm w-12">
                        {(Math.random() * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
