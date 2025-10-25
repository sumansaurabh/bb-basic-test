import { createReadinessHandler } from '@/lib/health';
import { withSecurityHeaders } from '@/lib/middleware';

export const GET = withSecurityHeaders(createReadinessHandler());
