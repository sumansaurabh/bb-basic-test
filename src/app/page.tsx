// Server-side data fetching and initial page structure
import { ClientHeavyComponents } from './components/ClientHeavyComponents';
import { ServerSideContent } from './components/ServerSideContent';
import { Metadata } from 'next';
import Link from 'next/link';

// This runs on the server
async function getServerData() {
  // Simulate API call or database query
  const serverTimestamp = new Date().toISOString();
  const serverInfo = {
    timestamp: serverTimestamp,
    serverLoad: Math.random() * 100,
    requestId: Math.random().toString(36).substring(7),
    environment: process.env.NODE_ENV || 'development',
    userAgent: 'Server-Side',
  };

  // Simulate some server processing time
  await new Promise(resolve => setTimeout(resolve, 100));

  return {
    serverInfo,
    initialHeavyComponentCount: 20,
    serverProcessedItems: Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      serverGeneratedData: `Server item ${i}`,
      processedAt: serverTimestamp,
      hash: Math.random().toString(36).substring(7),
    })),
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await getServerData();
  
  return {
    title: `🔥 Extreme Load Testing Suman. hello - ${data.serverInfo.requestId}`,
    description: `Server-side rendered load testing page generated at ${data.serverInfo.timestamp}`,
    keywords: ['load testing', 'performance', 'SSR', 'Next.js'],
    openGraph: {
      title: '🔥 Extreme Load Testing Page',
      description: 'Heavy load testing page with SSR and CSR capabilities',
      type: 'website',
    },
  };
}

export default async function Home() {
  // This runs on the server
  const serverData = await getServerData();
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Payment Navigation Bar */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">💳 Payment Gateway</h2>
            <div className="flex gap-4">
              <Link
                href="/payment"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
              >
                Custom Payment
              </Link>
              <Link
                href="/subscription"
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
              >
                Subscriptions
              </Link>
              <Link
                href="/subscription/manage"
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
              >
                Manage
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Server-rendered content */}
      <ServerSideContent serverData={serverData} />
      
      {/* Client-rendered heavy components */}
      <ClientHeavyComponents 
        initialCount={serverData.initialHeavyComponentCount}
        serverItems={serverData.serverProcessedItems}
      />
    </div>
  );
}
