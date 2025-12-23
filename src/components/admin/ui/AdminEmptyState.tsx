'use client';
import type { ReactNode } from 'react';

interface AdminEmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export default function AdminEmptyState({ title, description, icon, action }: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
      {icon && <div className="mb-4 text-gray-400">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-2 text-sm text-gray-500 max-w-md">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
