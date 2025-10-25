import { NextRequest } from 'next/server';
import { healthEndpoints } from '@/lib/health';

// Readiness probe endpoint
export const GET = healthEndpoints.readiness;
