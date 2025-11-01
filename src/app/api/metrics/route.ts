import { NextResponse } from 'next/server';
import { logInfo } from '@/lib/logger';

/**
 * Metrics endpoint
 * Returns performance and operational metrics
 */
export async function GET() {
  try {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const metrics = {
      timestamp: new Date().toISOString(),
      service: {
        name: 'nextjs-repo',
        version: process.env.npm_package_version || '0.1.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: {
          seconds: process.uptime(),
          formatted: formatUptime(process.uptime()),
        },
      },
      system: {
        node: {
          version: process.version,
          platform: process.platform,
          arch: process.arch,
        },
        process: {
          pid: process.pid,
          ppid: process.ppid,
          title: process.title,
        },
      },
      memory: {
        rss: {
          bytes: memUsage.rss,
          mb: Math.round(memUsage.rss / 1024 / 1024),
          description: 'Resident Set Size - total memory allocated',
        },
        heapTotal: {
          bytes: memUsage.heapTotal,
          mb: Math.round(memUsage.heapTotal / 1024 / 1024),
          description: 'Total heap allocated',
        },
        heapUsed: {
          bytes: memUsage.heapUsed,
          mb: Math.round(memUsage.heapUsed / 1024 / 1024),
          description: 'Heap actually used',
        },
        external: {
          bytes: memUsage.external,
          mb: Math.round(memUsage.external / 1024 / 1024),
          description: 'Memory used by C++ objects bound to JavaScript',
        },
        arrayBuffers: {
          bytes: memUsage.arrayBuffers,
          mb: Math.round(memUsage.arrayBuffers / 1024 / 1024),
          description: 'Memory allocated for ArrayBuffers and SharedArrayBuffers',
        },
        heapUsagePercent: ((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(2),
      },
      cpu: {
        user: {
          microseconds: cpuUsage.user,
          seconds: (cpuUsage.user / 1000000).toFixed(2),
          description: 'CPU time spent in user code',
        },
        system: {
          microseconds: cpuUsage.system,
          seconds: (cpuUsage.system / 1000000).toFixed(2),
          description: 'CPU time spent in system code',
        },
      },
      resourceUsage: process.resourceUsage ? {
        userCPUTime: process.resourceUsage().userCPUTime,
        systemCPUTime: process.resourceUsage().systemCPUTime,
        maxRSS: process.resourceUsage().maxRSS,
        sharedMemorySize: process.resourceUsage().sharedMemorySize,
        unsharedDataSize: process.resourceUsage().unsharedDataSize,
        unsharedStackSize: process.resourceUsage().unsharedStackSize,
      } : null,
    };

    logInfo('Metrics retrieved', {
      heapUsedMB: metrics.memory.heapUsed.mb,
      uptimeSeconds: metrics.service.uptime.seconds,
    });

    return NextResponse.json(metrics);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to retrieve metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Format uptime in human-readable format
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}
