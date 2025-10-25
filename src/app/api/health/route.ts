import { createHealthCheckHandler } from '@/lib/health';
import { withSecurityHeaders } from '@/lib/middleware';

export const GET = withSecurityHeaders(createHealthCheckHandler());
