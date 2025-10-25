import { NextRequest } from 'next/server';
import { healthEndpoints } from '@/lib/health';

// Liveness probe endpoint
export const GET = healthEndpoints.liveness;
