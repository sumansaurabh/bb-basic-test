import { handleLivenessCheck } from '@/lib/health';

export async function GET() {
  return handleLivenessCheck();
}
