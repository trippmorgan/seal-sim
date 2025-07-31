// src/components/FeedbackForm.tsx

import React, { useState, useEffect } from 'react';

/**
 * @file FeedbackForm.tsx
 * @description This component is the core of the human-in-the-loop feedback mechanism for the SEAL system.
 * It allows the user to correct the model's output and submit it for fine-tuning.
 *
 * State Management Strategy:
 * - `correctedCompletion`: This state is managed locally within the component via `useState` because it represents
 *   the user's direct input into this specific form. It does not need to be shared elsewhere until submission.
 * - `prompt` and `originalCompletion`: These are passed down as props. The form itself does not create them;
 *   it merely consumes them from the generation step.
 * - `useEffect`: This hook is used to synchronize the local `correctedCompletion` state with the `originalCompletion`
 *   prop. When a new generation occurs (and thus `originalCompletion` changes), the correction textarea is
 *   automatically populated. This provides a seamless UX, as the user can immediately start editing from the
 *   model's output. The dependency array `[originalCompletion]` ensures this effect runs *only* when a new
 *   completion is received.
 */

interface FeedbackFormProps {
  prompt: string | null;
  originalCompletion: string | null;
  onSubmitFeedback: (correctedCompletion: string) => Promise<void>;
  isSubmitting: boolean;
  feedbackMessage: string | null;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({
  prompt,
  originalCompletion,
  onSubmitFeedback,
  isSubmitting,
  feedbackMessage,
}) => {
  const [correctedCompletion, setCorrectedCompletion] = useState('');

  // This effect synchronizes the editable textarea with the latest model output.
  // When `originalCompletion` (the prop) changes, it updates `correctedCompletion` (the local state).
  // This is a controlled side-effect, essential for connecting the generation step to the feedback step.
  useEffect(() => {
    setCorrectedCompletion(originalCompletion || '');
  }, [originalCompletion]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt || !originalCompletion || !correctedCompletion.trim() || isSubmitting) {
      return;
    }
    onSubmitFeedback(correctedCompletion);
  };

  // The form is disabled until a generation has been performed.
  const isFormDisabled = !prompt || !originalCompletion;

  return (
    <div className={`p-4 mt-4 border rounded-lg shadow-md ${isFormDisabled ? 'border-gray-800' : 'border-yellow-700'}`}>
      <h2 className="text-xl font-bold text-yellow-300 mb-4">2. Submit Feedback</h2>
      {isFormDisabled ? (
        <p className="text-gray-500">Generate a completion first to provide feedback.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-1">Original Prompt (read-only)</label>
            <div className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-gray-300">
              {prompt}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-1">Original Completion (read-only)</label>
            <div className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-cyan-400 whitespace-pre-wrap font-mono text-sm">
              {originalCompletion}
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="corrected" className="block text-sm font-medium text-gray-300 mb-1">
              Corrected Completion
            </label>
            <textarea
              id="corrected"
              rows={5}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-white"
              value={correctedCompletion}
              onChange={(e) => setCorrectedCompletion(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !correctedCompletion.trim()}
            className="w-full px-4 py-2 bg-yellow-600 text-white font-semibold rounded-md hover:bg-yellow-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Correction'}
          </button>
          {feedbackMessage && (
             <div className="mt-3 p-2 text-center text-sm bg-green-900 border border-green-700 rounded">
                {feedbackMessage}
             </div>
          )}
        </form>
      )}
    </div>
  );
};

export default FeedbackForm;