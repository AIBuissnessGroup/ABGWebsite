'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  CalendarIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  ArrowLeftIcon,
  StarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useAdminApi } from '@/hooks/useAdminApi';
import type { RecruitmentCycle } from '@/types/recruitment';

// Create context to share cycle data
interface CycleContextType {
  cycle: RecruitmentCycle | null;
  loading: boolean;
  refreshCycle: () => Promise<void>;
}

const CycleContext = createContext<CycleContextType>({
  cycle: null,
  loading: true,
  refreshCycle: async () => {},
});

export const useCycle = () => useContext(CycleContext);

const navItems = [
  { name: 'Settings', href: '', icon: Cog6ToothIcon },
  { name: 'Events', href: '/events', icon: CalendarIcon },
  { name: 'Questions', href: '/questions', icon: ClipboardDocumentListIcon },
  { name: 'Slots', href: '/slots', icon: ChatBubbleLeftRightIcon },
  { name: 'Applicants', href: '/applicants', icon: UserGroupIcon },
  { name: 'Reviews', href: '/reviews', icon: StarIcon },
  { name: 'Rankings', href: '/rankings', icon: ChartBarIcon },
  { name: 'Communications', href: '/communications', icon: EnvelopeIcon },
];

export default function CycleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const { get } = useAdminApi();
  
  const cycleId = params.cycleId as string;
  const [cycle, setCycle] = useState<RecruitmentCycle | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCycle = async () => {
    try {
      setLoading(true);
      const data = await get<RecruitmentCycle>(`/api/admin/recruitment/cycles/${cycleId}`);
      setCycle(data);
    } catch (error) {
      console.error('Error loading cycle:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cycleId) {
      loadCycle();
    }
  }, [cycleId]);

  const basePath = `/admin/recruitment-portal/${cycleId}`;
  
  const isActive = (href: string) => {
    if (href === '') {
      return pathname === basePath;
    }
    return pathname.startsWith(`${basePath}${href}`);
  };

  return (
    <CycleContext.Provider value={{ cycle, loading, refreshCycle: loadCycle }}>
      <div className="space-y-6">
        {/* Back link and header */}
        <div className="flex items-center gap-4">
          <Link
            href="/admin/recruitment-portal"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back to Cycles</span>
          </Link>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
        ) : cycle ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{cycle.name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-gray-500">/{cycle.slug}</span>
                  {cycle.isActive && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      Active
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation tabs */}
            <nav className="flex gap-1 border-b border-gray-200 overflow-x-auto pb-px">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={`${basePath}${item.href}`}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      active
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Content */}
            <div>{children}</div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Cycle not found</p>
          </div>
        )}
      </div>
    </CycleContext.Provider>
  );
}
