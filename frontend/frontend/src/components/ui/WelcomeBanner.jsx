import React from 'react';
import { useCurrentUser } from '../../hooks/useCurrentUser';

export function WelcomeBanner({ children }) {
  const { welcomeName, userEmail } = useCurrentUser();

  return (
    <div className="rounded-2xl border border-green-200 bg-green-100 px-6 py-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-3xl font-extrabold tracking-tight text-gray-900">
            Welcome back, <span className="font-extrabold">{welcomeName}</span>
          </p>
          <p className="mt-2 text-sm md:text-base text-green-900/80 font-medium">
            Logged in as <span className="font-semibold">{userEmail}</span>
          </p>
          <p className="mt-1 text-sm text-gray-700">
            Manage your daily commute, tokens, and seat availability in one place.
          </p>
        </div>
        {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
      </div>
    </div>
  );
}
