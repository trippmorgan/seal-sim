// src/components/Dashboard.tsx

import React from 'react';
import { SystemStatus } from '../api';

/**
 * @file Dashboard.tsx
 * @description This component serves as a high-level, read-only view of the entire SEAL system's state.
 * Its sole responsibility is to declaratively render the status object it receives via props.
 * This is a classic "presentational" or "dumb" component; it contains no logic of its own,
 * making it highly reusable and easy to test. It receives its data from a "container" or "smart"
 * parent component (in this case, App.tsx).
 */

interface DashboardProps {
  status: SystemStatus | null;
}

const Dashboard: React.FC<DashboardProps> = ({ status }) => {
  // If the status object is null (e.g., initial fetch failed or is pending),
  // we now handle the default state inside the return block. This is a cleaner pattern.
  if (!status) {
    return (
      <div className="p-4 border border-gray-700 rounded-lg bg-gray-900 shadow-md">
        <h2 className="text-xl font-bold text-green-300 mb-2">Status Dashboard</h2>
        <p className="text-gray-400">Loading system status...</p>
      </div>
    );
  }

  // THE FIX IS HERE:
  // We no longer need complex default values because the `if (!status)` check above
  // guarantees that `status` and its nested properties exist from this point forward.
  // We can safely destructure directly from the `status` object.
  const {
    model_status,
    seal_policy,
    feedback_pool_size,
  } = status;

  // This function determines the color based on the model's status, providing an immediate visual cue to the user.
  const getStatusColor = (modelState: string) => {
    switch (modelState) {
      case 'ready':
        return 'text-green-400';
      case 'loading':
        return 'text-yellow-400';
      case 'unloaded':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  // We add a defensive check for feedback_threshold to prevent a divide-by-zero error if it's 0.
  const progressPercentage = seal_policy.feedback_threshold > 0
    ? (seal_policy.feedback_count / seal_policy.feedback_threshold) * 100
    : 0;

  return (
    <div className="p-4 border border-gray-700 rounded-lg bg-gray-900 shadow-md">
      <h2 className="text-xl font-bold text-green-300 mb-4">System Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {/* Model Status Section */}
        <div className="p-3 bg-gray-800 rounded">
          <h3 className="font-semibold text-green-400 mb-2">Model Status</h3>
          <p>State: <span className={`font-bold ${getStatusColor(model_status.status)}`}>{model_status.status}</span></p>
          <p>Base: <span className="font-mono text-cyan-400">{model_status.base_model}</span></p>
          <p>Device: <span className="font-mono text-cyan-400">{model_status.device}</span></p>
          <p>Adapter: <span className="font-mono text-cyan-400 break-all">{model_status.current_adapter}</span></p>
        </div>

        {/* SEAL Policy Section */}
        <div className="p-3 bg-gray-800 rounded">
          <h3 className="font-semibold text-green-400 mb-2">SEAL Policy</h3>
          <p>Feedback Pool: <span className="font-bold text-yellow-400">{feedback_pool_size}</span></p>
          <p>Adaptation Progress:</p>
          <div className="w-full bg-gray-700 rounded-full h-4 mt-1">
            <div
              className="bg-green-500 h-4 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-right text-xs mt-1">
            {seal_policy.feedback_count} / {seal_policy.feedback_threshold} submissions
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;