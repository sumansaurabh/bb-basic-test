import { createLivenessHandler } from '@/lib/health';
import { withSecurityHeaders } from '@/lib/middleware';

export const GET = withSecurityHeaders(createLivenessHandler());
