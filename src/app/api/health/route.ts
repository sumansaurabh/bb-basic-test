import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Health check endpoint
 * Returns service health status and basic metrics
 */
export async function GET() {
  try {
    const startTime = Date.now();
    
    // Check system health
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    // Calculate memory usage percentage
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;
    
    // Determine health status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    const issues: string[] = [];
    
    // Check memory usage
    if (memoryUsagePercent > 90) {
      status = 'unhealthy';
      issues.push('Memory usage critical (>90%)');
    } else if (memoryUsagePercent > 75) {
      status = 'degraded';
      issues.push('Memory usage high (>75%)');
    }
    
    // Check uptime (warn if recently restarted)
    if (uptime < 60) {
      issues.push('Service recently restarted');
    }
    
    const responseTime = Date.now() - startTime;
    
    const healthData = {
      status,
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: Math.floor(uptime),
        formatted: formatUptime(uptime),
      },
      memory: {
        heapUsed: formatBytes(memoryUsage.heapUsed),
        heapTotal: formatBytes(memoryUsage.heapTotal),
        rss: formatBytes(memoryUsage.rss),
        external: formatBytes(memoryUsage.external),
        usagePercent: memoryUsagePercent.toFixed(2),
      },
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      responseTime: `${responseTime}ms`,
      issues: issues.length > 0 ? issues : undefined,
    };
    
    // Log health check
    if (status === 'unhealthy') {
      logger.error('Health check failed', undefined, { status, issues });
    } else if (status === 'degraded') {
      logger.warn('Health check degraded', { status, issues });
    } else {
      logger.debug('Health check passed');
    }
    
    // Return appropriate status code
    const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;
    
    return NextResponse.json(healthData, { status: statusCode });
  } catch (error) {
    logger.error('Health check error', error as Error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 503 }
    );
  }
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Format uptime to human-readable string
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}
