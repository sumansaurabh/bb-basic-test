'use client';

import { useState, useEffect, useMemo } from 'react';

// Heavy computation component
/**
 * A component that performs a heavy computation and displays the result.
 */
const HeavyComputation = ({ index }: { index: number }) => {
  const [result, setResult] = useState(0);
  
  useEffect(() => {
    // Simulate heavy computation
    let sum = 0;
    for (let i = 0; i < 1000000; i++) {
      sum += Math.random() * Math.sin(i) * Math.cos(i) * Math.sqrt(i + 1);
    }
    setResult(sum);
  }, [index]);

  return (
    <div className="p-4 border rounded shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white">
      <h3 className="font-bold">Heavy Component #{index}</h3>
      <p>Computation Result: {result.toFixed(2)}</p>
      <div className="grid grid-cols-10 gap-1 mt-2">
        {Array.from({ length: 100 }, (_, i) => (
          <div
            key={i}
            className="w-4 h-4 bg-yellow-400 rounded animate-pulse"
            style={{ animationDelay: `${i * 10}ms` }}
          />
        ))}
      </div>
    </div>
  );
};

// Memory intensive component
/**
 * Renders a memory-intensive component displaying a large array of data items.
 */
const MemoryHeavyComponent = () => {
  const largeArray = useMemo(() => {
    return Array.from({ length: 50000 }, (_, i) => ({
      id: i,
      data: `Heavy data item ${i}`,
      randomValue: Math.random(),
      timestamp: Date.now(),
      nested: {
        level1: Array.from({ length: 10 }, (_, j) => ({
          id: j,
          value: Math.random() * 1000,
        }))
      }
    }));
  }, []);

  return (
    <div className="p-4 bg-red-100 rounded">
      <h3 className="font-bold text-red-800">Memory Heavy Component</h3>
      <p>Array Length: {largeArray.length}</p>
      <div className="max-h-40 overflow-y-auto">
        {largeArray.slice(0, 100).map(item => (
          <div key={item.id} className="text-xs p-1 border-b">
            {item.data} - {item.randomValue.toFixed(4)}
          </div>
        ))}
      </div>
    </div>
  );
};

// Infinite loop of animations
/**
 * A React component that displays a counter and animated elements.
 */
const AnimationHeavyComponent = () => {
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter(prev => prev + 1);
    }, 10);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 bg-green-100 rounded relative overflow-hidden">
      <h3 className="font-bold text-green-800">Animation Heavy Component</h3>
      <p>Counter: {counter}</p>
      <div className="grid grid-cols-20 gap-1">
        {Array.from({ length: 400 }, (_, i) => (
          <div
            key={i}
            className="w-2 h-2 bg-gradient-to-r from-red-500 to-blue-500 rounded-full animate-spin"
            style={{
              animationDuration: `${Math.random() * 2 + 0.5}s`,
              transform: `rotate(${(counter + i) * 3.6}deg) scale(${Math.sin(counter * 0.1 + i) + 1})`
            }}
          />
        ))}
      </div>
    </div>
  );
};

// DOM Heavy Component
/**
 * Renders a DOM-heavy component displaying a grid of items.
 */
const DOMHeavyComponent = () => {
  return (
    <div className="p-4 bg-purple-100 rounded">
      <h3 className="font-bold text-purple-800">DOM Heavy Component</h3>
      <div className="grid grid-cols-12 gap-1">
        {Array.from({ length: 1000 }, (_, i) => (
          <div
            key={i}
            className="p-2 bg-gradient-to-br from-pink-300 to-yellow-300 rounded text-xs text-center font-bold shadow hover:scale-110 transition-transform cursor-pointer"
            onClick={() => console.log(`Clicked ${i}`)}
          >
            <div className="mb-1">Item {i}</div>
            <div className="text-xs opacity-75">{Math.random().toFixed(3)}</div>
            <div className="w-full h-1 bg-gray-300 rounded mt-1">
              <div 
                className="h-1 bg-blue-500 rounded"
                style={{ width: `${Math.random() * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Client-side hydration component
/**
 * A component that displays hydration status of client components.
 */
const HydrationStatus = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [hydrationTime, setHydrationTime] = useState<number>(0);

  useEffect(() => {
    const start = performance.now();
    setIsHydrated(true);
    setHydrationTime(performance.now() - start);
  }, []);

  if (!isHydrated) {
    return (
      <div className="p-4 bg-yellow-900 border border-yellow-600 rounded-lg">
        <h3 className="font-bold text-yellow-300">⚡ Hydrating Client Components...</h3>
        <p className="text-yellow-200">Please wait while client-side components initialize</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-900 border border-green-600 rounded-lg">
      <h3 className="font-bold text-green-300">✅ Client Components Hydrated</h3>
      <p className="text-green-200">Hydration completed in {hydrationTime.toFixed(2)}ms</p>
      <p className="text-green-200">Client-side rendering is now active</p>
    </div>
  );
};

interface ServerProcessedItem {
  id: number;
  serverGeneratedData: string;
  processedAt: string;
  hash: string;
}

interface ClientHeavyComponentsProps {
  initialCount: number;
  serverItems: ServerProcessedItem[];
}

/**
 * Renders client-heavy components with load generation and performance monitoring.
 */
export function ClientHeavyComponents({ initialCount, serverItems }: ClientHeavyComponentsProps) {
  const [heavyComponents, setHeavyComponents] = useState(initialCount);
  const [isGenerating, setIsGenerating] = useState(false);
  const [clientStartTime] = useState(() => Date.now());

  /**
   * Initiates the generation of more load by updating state after a timeout.
   */
  const generateMoreLoad = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setHeavyComponents(prev => prev + 10);
      setIsGenerating(false);
    }, 100);
  };

  // Continuous background computation
  useEffect(() => {
    /**
     * Continuously computes a sum based on random values and trigonometric functions.
     */
    const worker = () => {
      const array = new Array(100000).fill(0);
      let sum = 0;
      array.forEach((_, i) => {
        sum += Math.random() * Math.sin(i) * Math.cos(i);
      });
      // Store result to prevent optimization
      if (sum > 0) {
        requestAnimationFrame(worker);
      } else {
        requestAnimationFrame(worker);
      }
    };
    worker();
  }, []);

  return (
    <div className="p-4">
      <div className="max-w-7xl mx-auto">
        {/* Hydration status */}
        <div className="mb-8">
          <HydrationStatus />
        </div>

        {/* Client controls */}
        <div className="text-center mb-8">
          <div className="p-6 bg-orange-900 border border-orange-600 rounded-lg">
            <h2 className="text-3xl font-bold text-orange-300 mb-4">🔥 Client-Side Load Controls</h2>
            <p className="text-orange-200 mb-4">
              Client started at: {new Date(clientStartTime).toLocaleTimeString()}
            </p>
            <button
              onClick={generateMoreLoad}
              disabled={isGenerating}
              className="px-8 py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg font-bold text-white transition-colors"
            >
              {isGenerating ? 'GENERATING MORE LOAD...' : 'ADD MORE CLIENT LOAD 💥'}
            </button>
            <p className="mt-2 text-orange-400">Current Heavy Components: {heavyComponents}</p>
          </div>
        </div>

        {/* Memory Heavy Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-4 text-red-400">🧠 Client Memory Destroyers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 5 }, (_, i) => (
              <MemoryHeavyComponent key={`memory-${i}`} />
            ))}
          </div>
        </div>

        {/* Animation Heavy Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-4 text-green-400">🎬 Client Animation Overload</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }, (_, i) => (
              <AnimationHeavyComponent key={`animation-${i}`} />
            ))}
          </div>
        </div>

        {/* Computation Heavy Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-4 text-blue-400">⚡ Client CPU Burners</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: heavyComponents }, (_, i) => (
              <HeavyComputation key={`computation-${i}`} index={i} />
            ))}
          </div>
        </div>

        {/* DOM Heavy Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-4 text-purple-400">💀 Client DOM Apocalypse</h2>
          <DOMHeavyComponent />
        </div>

        {/* Server + Client Data Comparison */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-4 text-yellow-400">🔄 Server vs Client Data</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-blue-900 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-blue-300 mb-4">📊 Server-Provided Data</h3>
              <p className="text-blue-200 mb-2">Items from server: {serverItems.length}</p>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {serverItems.slice(0, 50).map(item => (
                  <div key={item.id} className="p-2 bg-blue-800 rounded text-sm">
                    <div className="text-blue-100">{item.serverGeneratedData}</div>
                    <div className="text-blue-400 text-xs">Hash: {item.hash}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-orange-900 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-orange-300 mb-4">🖥️ Client-Generated Data</h3>
              <p className="text-orange-200 mb-2">Real-time client updates</p>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {Array.from({ length: 50 }, (_, i) => (
                  <div key={i} className="p-2 bg-orange-800 rounded text-sm">
                    <div className="text-orange-100">Client Item #{i + 1}</div>
                    <div className="text-orange-400 text-xs">
                      Generated: {new Date().toLocaleTimeString()}
                    </div>
                    <div className="text-orange-400 text-xs">
                      Random: {Math.random().toFixed(6)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Infinite Scroll Simulation */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-4 text-yellow-400">♾️ Client Infinite Content</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {Array.from({ length: 2000 }, (_, i) => (
              <div
                key={i}
                className="p-3 bg-gradient-to-r from-gray-800 to-gray-700 rounded flex justify-between items-center hover:from-gray-700 hover:to-gray-600 transition-colors"
              >
                <span>Client Infinite Item #{i + 1}</span>
                <div className="flex space-x-2">
                  {Array.from({ length: 10 }, (_, j) => (
                    <div
                      key={j}
                      className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-blue-500 animate-ping"
                      style={{ animationDelay: `${j * 100}ms` }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center py-8">
          <p className="text-red-500 font-bold text-2xl animate-bounce">
            🚨 SSR + CSR SYSTEM UNDER EXTREME LOAD 🚨
          </p>
          <p className="text-gray-400 mt-2">
            Check your browser&apos;s performance monitor and server logs to see the carnage
          </p>
        </div>
      </div>
    </div>
  );
}
