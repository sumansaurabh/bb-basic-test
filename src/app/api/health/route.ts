import { NextRequest, NextResponse } from 'next/server';
import { healthEndpoints } from '@/lib/health';

// Health check endpoint - full health status
export const GET = healthEndpoints.full;
