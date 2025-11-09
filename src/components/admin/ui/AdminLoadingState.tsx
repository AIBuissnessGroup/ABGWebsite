'use client';
interface AdminLoadingStateProps {
  message?: string;
  fullHeight?: boolean;
}

export default function AdminLoadingState({ message = 'Loading…', fullHeight = false }: AdminLoadingStateProps) {
  return (
    <div
      className={`flex items-center justify-center ${fullHeight ? 'min-h-[200px]' : 'py-8'}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 text-gray-600">
        <div className="h-6 w-6 border-2 border-gray-200 border-t-[#00274c] rounded-full animate-spin" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}
