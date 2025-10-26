import { handleHealthCheck } from '@/lib/health';

export async function GET() {
  return handleHealthCheck();
}
