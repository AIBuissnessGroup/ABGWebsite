'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BanknotesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  ReceiptPercentIcon,
} from '@heroicons/react/24/outline';
import { withAdminPageProtection } from '@/components/admin/AdminPageProtection';

type ReimbursementStatus = 'Requested' | 'Paid';
type StatusFilter = 'All' | ReimbursementStatus;

type ReimbursementRequest = {
  id: string;
  requesterName: string;
  contact: string;
  approachedPerson: string;
  description: string;
  amount: number;
  submittedAt: string;
  status: ReimbursementStatus;
  receiptFileName: string;
  receiptFileId: string;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

function AdminReimbursementsPage() {
  const [requests, setRequests] = useState<ReimbursementRequest[]>([]);
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadRequests() {
      setIsLoading(true);
      setLoadError('');
      try {
        const response = await fetch('/api/admin/reimbursements');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load reimbursement requests.');
        if (!cancelled) setRequests(data.requests);
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Failed to load reimbursement requests.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadRequests();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredRequests = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesStatus = statusFilter === 'All' || request.status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        request.requesterName.toLowerCase().includes(normalizedSearch) ||
        request.description.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [requests, search, statusFilter]);

  const requestedCount = requests.filter((request) => request.status === 'Requested').length;
  const paidTotal = requests
    .filter((request) => request.status === 'Paid')
    .reduce((total, request) => total + request.amount, 0);

  async function updateStatus(requestId: string, status: ReimbursementStatus) {
    try {
      const response = await fetch(`/api/admin/reimbursements/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update reimbursement status.');
      setRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === requestId ? { ...request, status } : request
        )
      );
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Failed to update reimbursement status.');
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <BanknotesIcon className="h-8 w-8 text-emerald-600" />
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Reimbursements</h1>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Review requests and update their payment status.
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
          MongoDB-backed requests
        </span>
      </header>

      <section className="grid gap-4 sm:grid-cols-2" aria-label="Reimbursement summary">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Requested</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{requestedCount}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Paid total</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{formatCurrency(paidTotal)}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loadError && (
          <p role="alert" className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">
            {loadError}
          </p>
        )}
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="font-semibold text-gray-900">Request records</h2>
            <p className="mt-1 text-xs text-gray-500">
              Expand a row to view contact details, approver, and receipt.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative">
              <span className="sr-only">Search requests</span>
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name or purchase"
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-56"
              />
            </label>
            <label>
              <span className="sr-only">Filter by payment status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-36"
              >
                <option value="All">All statuses</option>
                <option value="Requested">Requested</option>
                <option value="Paid">Paid</option>
              </select>
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] divide-y divide-gray-200 text-left">
            <thead className="bg-gray-50">
              <tr className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th scope="col" className="px-5 py-3">Requester</th>
                <th scope="col" className="px-5 py-3">Purchase</th>
                <th scope="col" className="px-5 py-3">Amount</th>
                <th scope="col" className="px-5 py-3">Submitted</th>
                <th scope="col" className="px-5 py-3">Status</th>
                <th scope="col" className="px-5 py-3">
                  <span className="sr-only">Request details</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRequests.map((request) => {
                const isExpanded = expandedRequestId === request.id;

                return (
                  <FragmentRow
                    key={request.id}
                    request={request}
                    isExpanded={isExpanded}
                    onToggle={() =>
                      setExpandedRequestId(isExpanded ? null : request.id)
                    }
                    onStatusChange={(status) => updateStatus(request.id, status)}
                  />
                );
              })}
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-500">
                    Loading reimbursement requests...
                  </td>
                </tr>
              )}
              {!isLoading && filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-500">
                    No requests match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
          Requests and status changes are stored in MongoDB.
        </p>
      </section>
    </div>
  );
}

function FragmentRow({
  request,
  isExpanded,
  onToggle,
  onStatusChange,
}: {
  request: ReimbursementRequest;
  isExpanded: boolean;
  onToggle: () => void;
  onStatusChange: (status: ReimbursementStatus) => void;
}) {
  return (
    <>
      <tr className="align-top hover:bg-gray-50/70">
        <th scope="row" className="px-5 py-4 text-sm font-semibold text-gray-900">
          {request.requesterName}
        </th>
        <td className="max-w-sm px-5 py-4 text-sm text-gray-700">{request.description}</td>
        <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-gray-900">
          {formatCurrency(request.amount)}
        </td>
        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
          {formatDate(request.submittedAt)}
        </td>
        <td className="px-5 py-4">
          <label>
            <span className="sr-only">Payment status for {request.requesterName}</span>
            <select
              value={request.status}
              onChange={(event) => onStatusChange(event.target.value as ReimbursementStatus)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-200 ${
                request.status === 'Paid'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-amber-200 bg-amber-50 text-amber-800'
              }`}
            >
              <option value="Requested">Requested</option>
              <option value="Paid">Paid</option>
            </select>
          </label>
        </td>
        <td className="px-5 py-4 text-right">
          <button
            type="button"
            aria-expanded={isExpanded}
            onClick={onToggle}
            className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {isExpanded ? 'Hide details' : 'View details'}
            {isExpanded ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-slate-50">
          <td colSpan={6} className="px-5 py-5">
            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">
                  Contact information
                </h3>
                <p className="mt-2 break-words text-sm text-gray-900">{request.contact}</p>
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">
                  Originally contacted
                </h3>
                <p className="mt-2 text-sm text-gray-900">{request.approachedPerson}</p>
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">
                  Receipt image
                </h3>
                <a
                  href={`/api/admin/reimbursements/${request.id}/receipt`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block max-w-xs rounded-lg border border-dashed border-gray-300 bg-white p-4 hover:border-blue-400"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <ReceiptPercentIcon className="h-5 w-5 text-gray-500" />
                    View receipt
                  </div>
                  <div className="my-3 border-t border-dashed border-gray-300" />
                  <p className="truncate text-xs text-gray-500">{request.receiptFileName}</p>
                  <p className="mt-2 text-right text-sm font-bold text-gray-900">
                    Total {formatCurrency(request.amount)}
                  </p>
                </a>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default withAdminPageProtection(AdminReimbursementsPage, 'reimbursements');
