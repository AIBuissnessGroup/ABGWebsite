'use client';

import { CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { ArrowRightIcon, CalendarIcon } from '@heroicons/react/24/outline';
import type { RoundTrackerData, RoundStatus } from '@/types/recruitment';

interface RoundTrackerProps {
  tracker: RoundTrackerData;
}

type RoundDisplayStatus = 'completed' | 'current' | 'upcoming' | 'skipped';

// Map round status to display status
function getDisplayStatus(round: RoundStatus, currentRound: number): RoundDisplayStatus {
  if (round.status === 'completed' || round.status === 'advanced') return 'completed';
  if (round.status === 'not_advanced') return 'skipped';
  if (round.round === currentRound) return 'current';
  return 'upcoming';
}

export default function RoundTracker({ tracker }: RoundTrackerProps) {
  const { rounds, currentRound, nextAction } = tracker;

  return (
    <div className="portal-card p-4">
      {/* Header + Progress Steps in one row */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">Your Progress</h3>
        <span className="text-xs text-gray-500">Step {currentRound} of {rounds.length}</span>
      </div>

      {/* Compact horizontal stepper */}
      <div className="flex items-center gap-1 mb-3">
        {rounds.map((round, idx) => {
          const displayStatus = getDisplayStatus(round, currentRound);
          const isLast = idx === rounds.length - 1;
          
          return (
            <div key={round.round} className="flex items-center flex-1">
              {/* Step circle */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                displayStatus === 'completed' ? 'bg-green-500 text-white' :
                displayStatus === 'current' ? 'bg-blue-500 text-white' :
                displayStatus === 'skipped' ? 'bg-red-100 text-red-500' :
                'bg-gray-100 text-gray-400'
              }`}>
                {displayStatus === 'completed' ? (
                  <CheckCircleIcon className="w-5 h-5" />
                ) : displayStatus === 'skipped' ? (
                  <XCircleIcon className="w-5 h-5" />
                ) : (
                  round.round
                )}
              </div>
              
              {/* Connector line */}
              {!isLast && (
                <div className={`flex-1 h-1 mx-1 rounded ${
                  displayStatus === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Round labels */}
      <div className="flex gap-1 text-xs mb-3">
        {rounds.map((round) => {
          const displayStatus = getDisplayStatus(round, currentRound);
          return (
            <div key={round.round} className="flex-1 text-center">
              <span className={`${
                displayStatus === 'current' ? 'text-blue-600 font-medium' :
                displayStatus === 'completed' ? 'text-green-600' :
                displayStatus === 'skipped' ? 'text-red-500' :
                'text-gray-400'
              }`}>
                {round.name.replace('Round ', 'R').replace(': Technical Interview', '').replace(': Behavioral Interview', '')}
              </span>
            </div>
          );
        })}
      </div>

      {/* Next Action - compact */}
      {nextAction && (
        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
          <ClockIcon className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-medium text-amber-800">{nextAction.title}</span>
            {nextAction.deadline && (
              <span className="text-amber-600 ml-2">
                · Due {new Date(nextAction.deadline).toLocaleDateString()}
              </span>
            )}
          </div>
          {nextAction.actionUrl && (
            <a
              href={nextAction.actionUrl}
              className="flex-shrink-0 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-medium"
            >
              Go <ArrowRightIcon className="w-3 h-3 inline ml-1" />
            </a>
          )}
        </div>
      )}

      {/* Success State - compact */}
      {tracker.rounds.every(r => r.status === 'completed' || r.status === 'advanced') && (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
          <CheckCircleIcon className="w-5 h-5 text-green-500" />
          <span className="text-green-700 font-medium">All rounds completed! Check your email for next steps.</span>
        </div>
      )}
    </div>
  );
}