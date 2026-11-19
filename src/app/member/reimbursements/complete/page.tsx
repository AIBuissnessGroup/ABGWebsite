import type { Metadata } from 'next';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

export const metadata: Metadata = {
  title: 'Reimbursement Request Successful | AI Business Group',
  description: 'Your reimbursement request has been submitted.',
};

export default function ReimbursementCompletePage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#001730] via-[#00274c] to-[#0a192f] px-4 py-12 text-white">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-[#FFCB05]/[0.07] blur-3xl" />

      <section
        role="status"
        className="relative z-10 w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.05] p-8 text-center shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-12"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-400/10 text-emerald-300">
          <CheckCircleIcon className="h-9 w-9" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Reimbursement Request Successful
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-7 text-white/70 sm:text-lg">
          Please wait a few days as we verify and process this request
        </p>
      </section>
    </main>
  );
}
