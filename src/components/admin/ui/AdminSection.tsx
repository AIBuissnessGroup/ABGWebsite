'use client';
import type { ReactNode } from 'react';

interface AdminSectionProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function AdminSection({
  title,
  description,
  actions,
  footer,
  children,
  className = '',
}: AdminSectionProps) {
  return (
    <section className={`bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden ${className}`}>
      <div className="flex flex-col gap-2 px-6 py-5 border-b border-gray-100 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="p-6">{children}</div>
      {footer && <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">{footer}</div>}
    </section>
  );
}
