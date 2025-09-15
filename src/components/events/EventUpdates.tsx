'use client';

import { EventUpdate } from '../../types/events';

interface EventUpdatesProps {
  updates: EventUpdate[];
}

export default function EventUpdates({ updates }: EventUpdatesProps) {
  if (!updates || updates.length === 0) {
    return null;
  }

  const sortedUpdates = [...updates].sort((a, b) => b.sentAt - a.sentAt);

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'urgent': return '🚨';
      case 'reminder': return '⏰';
      case 'info': 
      default: return 'ℹ️';
    }
  };

  const getUpdateBorderColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'border-red-200 bg-red-50';
      case 'reminder': return 'border-yellow-200 bg-yellow-50';
      case 'info':
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  const getUpdateTextColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'text-red-800';
      case 'reminder': return 'text-yellow-800';
      case 'info':
      default: return 'text-blue-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        📢 Event Updates
      </h3>
      
      <div className="space-y-4">
        {sortedUpdates.map((update) => (
          <div 
            key={update.id}
            className={`border rounded-lg p-4 ${getUpdateBorderColor(update.type)}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">
                {getUpdateIcon(update.type)}
              </span>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-semibold ${getUpdateTextColor(update.type)}`}>
                    {update.title}
                  </h4>
                  <span className="text-sm text-gray-500 flex-shrink-0 ml-2">
                    {new Date(update.sentAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {update.message}
                </p>
                
                <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                  <span>
                    Sent to: {update.recipients === 'all' ? 'All attendees' : 
                            update.recipients === 'confirmed' ? 'Confirmed attendees' : 
                            'Waitlist members'}
                  </span>
                  <span>
                    By: {update.sentBy}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {sortedUpdates.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <p>No updates yet for this event.</p>
        </div>
      )}
    </div>
  );
}