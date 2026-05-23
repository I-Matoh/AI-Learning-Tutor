import React from 'react';

type SyncState = 'idle' | 'saving' | 'saved' | 'failed';

type SyncStatusProps = {
  syncState: SyncState;
  lastSavedAt: number | null;
  onRetry: () => void;
};

export const SyncStatus: React.FC<SyncStatusProps> = ({ syncState, lastSavedAt, onRetry }) => {
  if (syncState === 'saving') {
    return <span className="text-amber-700">Saving...</span>;
  }

  if (syncState === 'saved') {
    return (
      <span className="text-green-700">
        Saved
        {lastSavedAt ? ` at ${new Date(lastSavedAt).toLocaleTimeString()}` : ''}
      </span>
    );
  }

  if (syncState === 'failed') {
    return (
      <button onClick={onRetry} className="text-red-700 underline">
        Sync failed - retry
      </button>
    );
  }

  return null;
};

