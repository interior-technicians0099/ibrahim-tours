import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

/**
 * Operator Dashboard Landing
 *
 * - PLATFORM_ADMIN → /platform (they manage everything from the platform dashboard)
 * - OPERATOR / COMPANY_ADMIN → stays here (or renders a future operator dashboard)
 * - Unauthenticated → /login (handled by middleware, but safety fallback here)
 */
export default async function OperatorDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Only PLATFORM_ADMIN should be redirected to /platform
  if (user.role === 'PLATFORM_ADMIN') {
    redirect('/platform');
  }

  // For OPERATOR / COMPANY_ADMIN — redirect to their first useful sub-page
  // (tours management is the primary operator view)
  redirect('/operator/tours');
}
