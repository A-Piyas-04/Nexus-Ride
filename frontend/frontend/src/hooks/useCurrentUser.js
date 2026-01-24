import { useAuth } from '../context/auth-context';

export function useCurrentUser() {
  const { user } = useAuth();

  const fullName =
    (typeof window !== 'undefined' &&
      (localStorage.getItem('full_name') || localStorage.getItem('name'))) ||
    user?.full_name ||
    user?.name ||
    'User';

  const userEmail = user?.email || '';

  const welcomeName = userEmail ? userEmail.split('@')[0] : fullName;

  return {
    user,
    fullName,
    userEmail,
    welcomeName,
  };
}
