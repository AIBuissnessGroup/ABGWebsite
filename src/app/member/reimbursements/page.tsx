'use client';

import { useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckIcon,
  ChevronDownIcon,
  CurrencyDollarIcon,
  DocumentArrowUpIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type TeamMember = {
  name: string;
  imageUrl?: string | null;
};

type ApproverRole = 'president' | 'operations' | 'finance';

type Approver = {
  member: TeamMember;
  role: ApproverRole;
  roleLabel: string;
};

const APPROVERS: Approver[] = [
  {
    member: { name: 'Q1 President Name', imageUrl: null },
    role: 'president',
    roleLabel: 'Current President',
  },
  {
    member: { name: 'Q1 VP Operations Name', imageUrl: null },
    role: 'operations',
    roleLabel: 'VP Operations',
  },
  {
    member: { name: 'Q1 VP Finance Name', imageUrl: null },
    role: 'finance',
    roleLabel: 'VP Finance',
  },
];

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function ProfileAvatar({ member }: { member: TeamMember }) {
  return (
    <span
      className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-gradient-to-br from-blue-500/30 to-[#FFCB05]/20 text-xs font-bold text-white"
    >
      {member.imageUrl ? (
        <Image
          src={member.imageUrl}
          alt=""
          fill
          unoptimized
          sizes="36px"
          className="object-cover"
        />
      ) : (
        getInitials(member.name)
      )}
    </span>
  );
}

export default function ReimbursementsPage() {
  const router = useRouter();
  const [selectedApprover, setSelectedApprover] = useState<Approver | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [approverError, setApproverError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedApprover) {
      setApproverError('Please select who you originally reached out to.');
      return;
    }

    const formData = new FormData(event.currentTarget);
    formData.set('approverRole', selectedApprover.role);
    if (receipt) formData.set('receipt', receipt);

    setIsSubmitting(true);
    setSubmitError('');
    try {
      const response = await fetch('/api/reimbursements', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          setNeedsSignIn(true);
        }
        throw new Error(result.error || 'Unable to submit reimbursement request.');
      }
      router.push('/member/reimbursements/complete');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to submit reimbursement request.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-9rem)] overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-[#FFCB05]/[0.07] blur-3xl" />

      <main className="relative mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#FFCB05]/25 bg-[#FFCB05]/10 text-[#FFCB05] shadow-lg shadow-black/20">
            <CurrencyDollarIcon className="h-7 w-7" />
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#FFCB05]/80">
            Member Hub
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            AI Business Group Reimbursement Form
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/60">
            Provide the details of your purchase and attach a picture of your receipt.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-7 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-md sm:p-8"
        >
          <section className="space-y-3">
            <label htmlFor="requester-name" className="block text-sm font-semibold text-white">
              Name
              <span className="ml-1 text-[#FFCB05]" aria-hidden="true">*</span>
            </label>
            <input
              id="requester-name"
              name="requesterName"
              type="text"
              autoComplete="name"
              required
              placeholder="Your name"
              className="w-full rounded-xl border border-white/10 bg-[#071326]/80 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[#FFCB05]/50 focus:outline-none focus:ring-2 focus:ring-[#FFCB05]/20"
            />
          </section>

          <section className="space-y-3">
            <label htmlFor="requester-contact" className="block text-sm font-semibold text-white">
              Phone Number/email
              <span className="ml-1 text-[#FFCB05]" aria-hidden="true">*</span>
            </label>
            <input
              id="requester-contact"
              name="requesterContact"
              type="text"
              autoComplete="tel email"
              required
              placeholder="Your phone number or email address"
              className="w-full rounded-xl border border-white/10 bg-[#071326]/80 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[#FFCB05]/50 focus:outline-none focus:ring-2 focus:ring-[#FFCB05]/20"
            />
          </section>

          <section className="space-y-3">
            <label className="block text-sm font-semibold text-white" id="approver-label">
              Who did you originally reach out to before your purchase?
              <span className="ml-1 text-[#FFCB05]" aria-hidden="true">*</span>
            </label>

            <div className="relative">
              <button
                type="button"
                aria-labelledby="approver-label"
                aria-haspopup="listbox"
                aria-expanded={isDropdownOpen}
                onClick={() => setIsDropdownOpen((open) => !open)}
                className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#071326]/80 px-4 py-3 text-left text-sm text-white transition-colors hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-[#FFCB05]/60"
              >
                {selectedApprover ? (
                  <span className="flex min-w-0 items-center gap-3">
                    <ProfileAvatar member={selectedApprover.member} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{selectedApprover.member.name}</span>
                      <span className="block text-xs text-white/50">{selectedApprover.roleLabel}</span>
                    </span>
                  </span>
                ) : (
                  <span className="text-white/45">Select an approver</span>
                )}
                <ChevronDownIcon
                  className={`h-5 w-5 shrink-0 text-white/50 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.ul
                    role="listbox"
                    aria-labelledby="approver-label"
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.99 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-white/15 bg-[#0b1c33] p-1 shadow-xl"
                  >
                    {APPROVERS.map((approver) => (
                      <li key={approver.role}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={selectedApprover?.role === approver.role}
                          onClick={() => {
                            setSelectedApprover(approver);
                            setApproverError('');
                            setIsDropdownOpen(false);
                          }}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white/10 focus:bg-white/10 focus:outline-none"
                        >
                          <ProfileAvatar member={approver.member} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-white">
                              {approver.member.name}
                            </span>
                            <span className="block text-xs text-white/50">{approver.roleLabel}</span>
                          </span>
                          {selectedApprover?.role === approver.role && (
                            <CheckIcon className="h-4 w-4 text-[#FFCB05]" />
                          )}
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
            {approverError && (
              <p role="alert" className="text-xs text-red-300">
                {approverError}
              </p>
            )}
          </section>

          <section className="space-y-3">
            <label htmlFor="purchase-description" className="block text-sm font-semibold text-white">
              Please provide a short description of your purchase
              <span className="ml-1 text-[#FFCB05]" aria-hidden="true">*</span>
            </label>
            <textarea
              id="purchase-description"
              name="description"
              required
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What did you purchase, and what was it for?"
              className="w-full resize-y rounded-xl border border-white/10 bg-[#071326]/80 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[#FFCB05]/50 focus:outline-none focus:ring-2 focus:ring-[#FFCB05]/20"
            />
          </section>

          <section className="space-y-3">
            <label htmlFor="reimbursement-amount" className="block text-sm font-semibold text-white">
              How much do you need to be reimbursed?
              <span className="ml-1 text-[#FFCB05]" aria-hidden="true">*</span>
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm text-white/45">
                $
              </span>
              <input
                id="reimbursement-amount"
                name="amount"
                type="number"
                required
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-white/10 bg-[#071326]/80 py-3 pl-9 pr-4 text-sm text-white placeholder:text-white/35 focus:border-[#FFCB05]/50 focus:outline-none focus:ring-2 focus:ring-[#FFCB05]/20"
              />
            </div>
          </section>

          <section className="space-y-3">
            <label className="block text-sm font-semibold text-white" id="receipt-label">
              Picture of receipt
              <span className="ml-1 text-[#FFCB05]" aria-hidden="true">*</span>
            </label>
            <label
              htmlFor="receipt-upload"
              className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-[#071326]/50 px-5 py-6 text-center transition-colors hover:border-[#FFCB05]/50 hover:bg-[#071326]/80"
            >
              <DocumentArrowUpIcon className="mb-2 h-8 w-8 text-[#FFCB05]" />
              <span className="text-sm font-medium text-white">
                {receipt ? receipt.name : 'Choose a receipt image'}
              </span>
              <span className="mt-1 text-xs text-white/45">
                {receipt
                  ? `${(receipt.size / 1024 / 1024).toFixed(2)} MB`
                  : 'PNG, JPG, or other image format'}
              </span>
              <input
                id="receipt-upload"
                name="receipt"
                ref={receiptInputRef}
                type="file"
                accept="image/*"
                required
                aria-labelledby="receipt-label"
                onChange={(event) => setReceipt(event.target.files?.[0] || null)}
                className="sr-only"
              />
            </label>
            {receipt && (
              <button
                type="button"
                onClick={() => {
                  setReceipt(null);
                  if (receiptInputRef.current) receiptInputRef.current.value = '';
                }}
                className="inline-flex items-center gap-1 text-xs text-white/55 transition-colors hover:text-white"
              >
                <XMarkIcon className="h-4 w-4" />
                Remove selected file
              </button>
            )}
          </section>

          {submitError && (
            <div role="alert" className="rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-xs leading-5 text-red-200">
              {submitError}
              {needsSignIn && (
                <>
                  {' '}
                  <a
                    href={`/auth/signin?callbackUrl=${encodeURIComponent('/member/reimbursements')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold underline underline-offset-2"
                  >
                    Sign in in a new tab, then submit again.
                  </a>
                </>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-[#FFCB05] px-5 py-3.5 text-sm font-bold text-[#00274c] transition-colors hover:bg-[#FFE380] focus:outline-none focus:ring-2 focus:ring-[#FFCB05]/60 focus:ring-offset-2 focus:ring-offset-[#071326] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Submitting...' : 'Submit reimbursement request'}
          </button>
        </form>
      </main>
    </div>
  );
}
