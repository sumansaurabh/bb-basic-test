'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ClientErrorBoundary } from '@/components/ClientErrorBoundary';
import { logger } from '@/lib/logger';
import { safeFunction } from '@/lib/errors';

// Safe heavy computation component with error boundary
const HeavyComputation = ({ index }: { index: number }) => {
  const [result, setResult] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const computeHeavyResult = safeFunction(
      () => {
        let sum = 0;
        // Add bounds checking
        const iterations = Math.min(1000000, Math.max(1, 1000000));
        
        for (let i = 0; i < iterations; i++) {
          const value = Math.random() * Math.sin(i) * Math.cos(i) * Math.sqrt(Math.max(1, i + 1));
          if (Number.isFinite(value)) {
            sum += value;
          }
        }
        return sum;
      },
      0,
      (error) => {
        logger.error('Heavy computation failed', { index, error: error.message }, error);
        setError(error.message);
      }
    );

    const result = computeHeavyResult();
    setResult(result);
  }, [index]);

  if (error) {
    return (
      <div className="p-4 border rounded shadow-lg bg-red-100 border-red-300">
        <h3 className="font-bold text-red-800">Heavy Component #{index} - Error</h3>
        <p className="text-red-600 text-sm">Computation failed: {error}</p>
      </div>
    );
  }

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

// Memory intensive component with cleanup
const MemoryHeavyComponent = () => {
  const [isActive, setIsActive] = useState(true);
  
  const largeArray = useMemo(() => {
    if (!isActive) return [];
    
    try {
      const maxItems = 50000;
      return Array.from({ length: maxItems }, (_, i) => ({
        id: i,
        data: `Heavy data item ${i}`,
        randomValue: Math.random(),
        timestamp: Date.now(),
        nested: {
          level1: Array.from({ length: Math.min(10, i % 10 + 1) }, (_, j) => ({
            id: j,
            value: Math.random() * 1000,
          }))
        }
      }));
    } catch (error) {
      logger.warn('Memory heavy component failed to create array', {}, error instanceof Error ? error : new Error('Unknown error'));
      return [];
    }
  }, [isActive]);

  // Cleanup function
  const handleCleanup = useCallback(() => {
    setIsActive(false);
    logger.debug('Memory heavy component cleaned up');
  }, []);

  useEffect(() => {
    return handleCleanup; // Cleanup on unmount
  }, [handleCleanup]);

  if (!isActive) {
    return (
      <div className="p-4 bg-gray-200 rounded">
        <h3 className="font-bold text-gray-600">Memory Heavy Component - Cleaned Up</h3>
        <button 
          onClick={() => setIsActive(true)}
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
        >
          Reactivate
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-red-100 rounded">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-red-800">Memory Heavy Component</h3>
        <button 
          onClick={handleCleanup}
          className="px-2 py-1 bg-red-500 text-white rounded text-sm"
        >
          Cleanup
        </button>
      </div>
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

// Animation component with controlled animations
const AnimationHeavyComponent = () => {
  const [counter, setCounter] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (!isAnimating) return;

    const interval = setInterval(() => {
      setCounter(prev => {
        const newValue = prev + 1;
        // Prevent counter overflow
        return newValue > 10000 ? 0 : newValue;
      });
    }, 10);

    return () => clearInterval(interval);
  }, [isAnimating]);

  return (
    <div className="p-4 bg-green-100 rounded relative overflow-hidden">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-green-800">Animation Heavy Component</h3>
        <button 
          onClick={() => setIsAnimating(!isAnimating)}
          className={`px-2 py-1 rounded text-sm text-white ${
            isAnimating ? 'bg-red-500' : 'bg-green-500'
          }`}
        >
          {isAnimating ? 'Pause' : 'Resume'}
        </button>
      </div>
      <p>Counter: {counter}</p>
      {isAnimating && (
        <div className="grid grid-cols-20 gap-1">
          {Array.from({ length: 400 }, (_, i) => (
            <div
              key={i}
              className="w-2 h-2 bg-gradient-to-r from-red-500 to-blue-500 rounded-full animate-spin"
              style={{
                animationDuration: `${Math.random() * 2 + 0.5}s`,
                transform: `rotate(${(counter + i) * 3.6}deg) scale(${Math.abs(Math.sin(counter * 0.1 + i)) + 0.5})`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Safe DOM Heavy Component
const DOMHeavyComponent = () => {
  const [itemCount, setItemCount] = useState(1000);
  const [isInteractive, setIsInteractive] = useState(true);

  const handleClick = useCallback((index: number) => {
    if (isInteractive) {
      logger.debug(`DOM item clicked: ${index}`);
    }
  }, [isInteractive]);

  const safeItemCount = Math.min(Math.max(itemCount, 100), 2000); // Limit between 100-2000

  return (
    <div className="p-4 bg-purple-100 rounded">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-purple-800">DOM Heavy Component</h3>
        <div className="flex gap-2">
          <input
            type="range"
            min="100"
            max="2000"
            step="100"
            value={safeItemCount}
            onChange={(e) => setItemCount(parseInt(e.target.value))}
            className="w-24"
          />
          <span className="text-sm">{safeItemCount}</span>
          <button
            onClick={() => setIsInteractive(!isInteractive)}
            className={`px-2 py-1 rounded text-sm text-white ${
              isInteractive ? 'bg-purple-500' : 'bg-gray-500'
            }`}
          >
            {isInteractive ? 'Interactive' : 'Static'}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-1 max-h-96 overflow-y-auto">
        {Array.from({ length: safeItemCount }, (_, i) => (
          <div
            key={i}
            className={`p-2 bg-gradient-to-br from-pink-300 to-yellow-300 rounded text-xs text-center font-bold shadow transition-transform ${
              isInteractive ? 'hover:scale-110 cursor-pointer' : ''
            }`}
            onClick={() => handleClick(i)}
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

// Enhanced client-side hydration component
const HydrationStatus = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [hydrationTime, setHydrationTime] = useState<number>(0);
  const [hydrationError, setHydrationError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const start = performance.now();
      setIsHydrated(true);
      const time = performance.now() - start;
      setHydrationTime(time);
      
      logger.info('Client components hydrated successfully', { hydrationTime: time });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown hydration error';
      setHydrationError(errorMessage);
      logger.error('Client hydration failed', { error: errorMessage }, error instanceof Error ? error : new Error(errorMessage));
    }
  }, []);

  if (hydrationError) {
    return (
      <div className="p-4 bg-red-900 border border-red-600 rounded-lg">
        <h3 className="font-bold text-red-300">❌ Hydration Error</h3>
        <p className="text-red-200">Hydration failed: {hydrationError}</p>
      </div>
    );
  }

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

export function ClientHeavyComponents({ initialCount, serverItems }: ClientHeavyComponentsProps) {
  const [heavyComponents, setHeavyComponents] = useState(Math.min(initialCount, 50)); // Cap initial count
  const [isGenerating, setIsGenerating] = useState(false);
  const [clientStartTime] = useState(() => Date.now());
  const [performanceMode, setPerformanceMode] = useState<'normal' | 'safe' | 'minimal'>('normal');

  const generateMoreLoad = useCallback(() => {
    setIsGenerating(true);
    try {
      setTimeout(() => {
        setHeavyComponents(prev => {
          const increment = performanceMode === 'minimal' ? 2 : performanceMode === 'safe' ? 5 : 10;
          const maxComponents = performanceMode === 'minimal' ? 10 : performanceMode === 'safe' ? 25 : 100;
          return Math.min(prev + increment, maxComponents);
        });
        setIsGenerating(false);
      }, 100);
    } catch (error) {
      logger.error('Failed to generate more load', {}, error instanceof Error ? error : new Error('Unknown error'));
      setIsGenerating(false);
    }
  }, [performanceMode]);

  // Safe background computation with cleanup
  useEffect(() => {
    if (performanceMode === 'minimal') return;

    let isActive = true;
    const performBackgroundWork = () => {
      if (!isActive) return;
      
      try {
        const array = new Array(performanceMode === 'safe' ? 10000 : 100000).fill(0);
        let sum = 0;
        
        // Process in smaller chunks
        const chunkSize = 1000;
        let processed = 0;
        
        const processChunk = () => {
          if (!isActive) return;
          
          const end = Math.min(processed + chunkSize, array.length);
          for (let i = processed; i < end; i++) {
            sum += Math.random() * Math.sin(i) * Math.cos(i);
          }
          processed = end;
          
          if (processed < array.length) {
            setTimeout(processChunk, 1);
          } else {
            // Schedule next iteration
            if (sum !== null) { // Prevent optimization
              setTimeout(performBackgroundWork, 10);
            }
          }
        };
        
        processChunk();
      } catch (error) {
        logger.debug('Background computation error', {}, error instanceof Error ? error : new Error('Unknown error'));
        if (isActive) {
          setTimeout(performBackgroundWork, 100);
        }
      }
    };

    performBackgroundWork();

    return () => {
      isActive = false;
    };
  }, [performanceMode]);

  const componentCounts = {
    heavy: Math.min(heavyComponents, performanceMode === 'minimal' ? 5 : performanceMode === 'safe' ? 15 : 50),
    memory: performanceMode === 'minimal' ? 1 : performanceMode === 'safe' ? 3 : 5,
    animation: performanceMode === 'minimal' ? 1 : performanceMode === 'safe' ? 2 : 4,
  };

  return (
    <ClientErrorBoundary>
      <div className="p-4">
        <div className="max-w-7xl mx-auto">
          {/* Hydration status */}
          <div className="mb-8">
            <HydrationStatus />
          </div>

          {/* Performance controls */}
          <div className="mb-8">
            <div className="p-4 bg-gray-800 rounded-lg">
              <h3 className="font-bold text-white mb-3">Performance Mode</h3>
              <div className="flex gap-2 mb-4">
                {(['minimal', 'safe', 'normal'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setPerformanceMode(mode)}
                    className={`px-3 py-2 rounded capitalize ${
                      performanceMode === mode 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <p className="text-gray-300 text-sm">
                Current mode: <strong>{performanceMode}</strong> - 
                {performanceMode === 'minimal' && ' Minimal components for maximum stability'}
                {performanceMode === 'safe' && ' Reduced component count for better performance'}
                {performanceMode === 'normal' && ' Full component load for testing'}
              </p>
            </div>
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
              <p className="mt-2 text-orange-400">Current Heavy Components: {componentCounts.heavy}</p>
            </div>
          </div>

          {/* Memory Heavy Section */}
          <ClientErrorBoundary fallback={<div className="p-4 bg-red-200 rounded">Memory components failed to load</div>}>
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-4 text-red-400">🧠 Client Memory Destroyers</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: componentCounts.memory }, (_, i) => (
                  <ClientErrorBoundary key={`memory-${i}`}>
                    <MemoryHeavyComponent />
                  </ClientErrorBoundary>
                ))}
              </div>
            </div>
          </ClientErrorBoundary>

          {/* Animation Heavy Section */}
          <ClientErrorBoundary fallback={<div className="p-4 bg-green-200 rounded">Animation components failed to load</div>}>
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-4 text-green-400">🎬 Client Animation Overload</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: componentCounts.animation }, (_, i) => (
                  <ClientErrorBoundary key={`animation-${i}`}>
                    <AnimationHeavyComponent />
                  </ClientErrorBoundary>
                ))}
              </div>
            </div>
          </ClientErrorBoundary>

          {/* Computation Heavy Section */}
          <ClientErrorBoundary fallback={<div className="p-4 bg-blue-200 rounded">Computation components failed to load</div>}>
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-4 text-blue-400">⚡ Client CPU Burners</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: componentCounts.heavy }, (_, i) => (
                  <ClientErrorBoundary key={`computation-${i}`}>
                    <HeavyComputation index={i} />
                  </ClientErrorBoundary>
                ))}
              </div>
            </div>
          </ClientErrorBoundary>

          {/* DOM Heavy Section */}
          <ClientErrorBoundary fallback={<div className="p-4 bg-purple-200 rounded">DOM components failed to load</div>}>
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-4 text-purple-400">💀 Client DOM Apocalypse</h2>
              <DOMHeavyComponent />
            </div>
          </ClientErrorBoundary>

          {/* Server + Client Data Comparison */}
          <ClientErrorBoundary>
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-4 text-yellow-400">🔄 Server vs Client Data</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-blue-900 p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-blue-300 mb-4">📊 Server-Provided Data</h3>
                  <p className="text-blue-200 mb-2">Items from server: {serverItems?.length || 0}</p>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {(serverItems || []).slice(0, 50).map(item => (
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
          </ClientErrorBoundary>

          <div className="text-center py-8">
            <p className="text-red-500 font-bold text-2xl">
              🚨 SSR + CSR SYSTEM WITH ENHANCED RELIABILITY 🚨
            </p>
            <p className="text-gray-400 mt-2">
              Error boundaries and defensive programming now protect against crashes
            </p>
          </div>
        </div>
      </div>
    </ClientErrorBoundary>
  );
}
