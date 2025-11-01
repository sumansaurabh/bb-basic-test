// Server-side data fetching and initial page structure
import { ClientHeavyComponents } from './components/ClientHeavyComponents';
import { ServerSideContent } from './components/ServerSideContent';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Metadata } from 'next';

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
      {/* Server-rendered content */}
      <ErrorBoundary>
        <ServerSideContent serverData={serverData} />
      </ErrorBoundary>
      
      {/* Client-rendered heavy components */}
      <ErrorBoundary>
        <ClientHeavyComponents 
          initialCount={serverData.initialHeavyComponentCount}
          serverItems={serverData.serverProcessedItems}
        />
      </ErrorBoundary>
    </div>
  );
}
