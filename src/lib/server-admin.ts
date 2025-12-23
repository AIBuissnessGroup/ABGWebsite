import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth';
import { isAdmin } from './admin';

export async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user)) {
    return null;
  }
  return session;
}
