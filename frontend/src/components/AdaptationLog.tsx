// src/components/AdaptationLog.tsx

import React from 'react';
import { AdaptationLogEntry } from '../api';

/**
 * @file AdaptationLog.tsx
 * @description This component is responsible for visualizing the history of the model's adaptation.
 * It follows the same "presentational" component pattern as the Dashboard, receiving its data via props.
 * Its purpose is to provide transparency into the "Evolving" aspect of the SEAL paradigm, allowing
 * researchers and operators to observe when and why the model has changed over time.
 */

interface AdaptationLogProps {
  log: AdaptationLogEntry[];
}

const AdaptationLog: React.FC<AdaptationLogProps> = ({ log }) => {
  return (
    <div className="p-4 border border-gray-700 rounded-lg bg-gray-900 shadow-md mt-4">
      <h2 className="text-xl font-bold text-green-300 mb-4">Adaptation Log</h2>
      <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
        {/* We reverse the log to show the most recent events first, which is the standard convention for logs. */}
        {/* Using the blockNumber as the key is acceptable here, assuming it's unique and stable for each entry. */}
        {log.length > 0 ? (
          [...log].reverse().map((entry) => (
            <div key={entry.blockNumber} className="p-2 bg-gray-800 rounded text-xs">
              <p className="font-semibold text-cyan-400">
                Block #{entry.blockNumber}: <span className="font-normal text-gray-300">{entry.event}</span>
              </p>
              {/* The feedback_count is an optional property, so we conditionally render it. */}
              {entry.feedback_count !== undefined && (
                 <p className="text-gray-500">Feedback items processed: {entry.feedback_count}</p>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500">No adaptation events have occurred yet.</p>
        )}
      </div>
    </div>
  );
};

export default AdaptationLog;