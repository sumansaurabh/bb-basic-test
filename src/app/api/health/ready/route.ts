import { handleReadinessCheck } from '@/lib/health';

export async function GET() {
  return handleReadinessCheck();
}
