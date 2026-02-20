import React from 'react';

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen w-full bg-gray-100">
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
