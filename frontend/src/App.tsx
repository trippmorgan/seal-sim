// src/App.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { SystemStatus, getStatus, generateCompletion, submitFeedback } from './api';
import Dashboard from './components/Dashboard';
import ModelVisualizer from './components/ModelVisualizer';
import FeedbackForm from './components/FeedbackForm';
import AdaptationLog from './components/AdaptationLog';

/**
 * @file App.tsx
 * @description This is the root component of the SEAL-Sim application. It functions as the primary "container"
 * or "smart" component.
 *
 * Architectural Philosophy:
 * - **Centralized State Management**: `App.tsx` holds all the critical application-wide state (e.g., `systemStatus`,
 *   `currentPrompt`, `currentCompletion`). This "single source of truth" approach simplifies the application's
 *   data flow and makes state changes predictable.
 * - **Unidirectional Data Flow**: State flows down from `App.tsx` to child components via props. Actions flow up
 *   from child components to `App.tsx` via callback functions (e.g., `handleGenerate`, `handleSubmitFeedback`).
 *   This is a core principle of React that makes applications easier to reason about and debug.
 * - **State Colocation vs. Lifting State**: State is kept at the lowest possible level until it needs to be shared.
 *   For example, the input text in `ModelVisualizer` is local to that component. However, `currentCompletion`
 *   needs to be known by both `ModelVisualizer` and `FeedbackForm`, so its state is "lifted up" to their
 *   nearest common ancestor, which is `App.tsx`.
 *
 * Hooks Usage:
 * - `useState`: Used for all pieces of state managed by this component.
 * - `useEffect`: Used to fetch the initial system status and to set up a polling mechanism to keep the dashboard
 *   live. The empty dependency array `[]` ensures the initial fetch runs only once on mount. The returned cleanup
 *   function from the effect is critical for clearing the interval when the component unmounts, preventing memory leaks.
 * - `useCallback`: Wraps the handler functions (`handleGenerate`, `handleSubmitFeedback`). This is a performance
 *   optimization. It memoizes the function instances so they are not recreated on every render, preventing
 *   unnecessary re-renders of child components that depend on these functions as props. The dependency arrays for
 *   `useCallback` include all external state variables the function depends on, ensuring the callback always has
 *   access to the latest state.
 */
const App: React.FC = () => {
  // --- State Management ---
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  // State for the generation and feedback loop
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null);
  const [currentCompletion, setCurrentCompletion] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);


  // State for tracking async operations to provide user feedback
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // --- Data Fetching and Effects ---

  // A robust, reusable function for fetching status.
  const fetchStatus = useCallback(async () => {
    try {
      const statusData = await getStatus();
      setSystemStatus(statusData);
      setError(null); // Clear previous errors on a successful fetch
    } catch (err) {
      console.error("Failed to fetch status:", err);
      setError("Failed to connect to the backend. Is it running?");
    }
  }, []); // No dependencies, as `getStatus` is a stable import.

  // The primary effect for managing the application's connection to the backend.
  useEffect(() => {
    // Fetch status immediately on component mount.
    fetchStatus();

    // Set up an interval to poll the status every 5 seconds. This makes the dashboard feel "live."
    const intervalId = setInterval(fetchStatus, 5000);

    // This cleanup function is crucial. React runs it when the component unmounts.
    // It clears the interval, preventing it from running in the background indefinitely, which would cause a memory leak.
    return () => clearInterval(intervalId);
  }, [fetchStatus]); // `fetchStatus` is wrapped in useCallback, so this effect runs once on mount.

  // --- Callback Handlers ---
  // These functions are passed down to child components to handle user interactions.

  const handleGenerate = useCallback(async (prompt: string) => {
    setIsGenerating(true);
    setCurrentPrompt(prompt);
    // Clear previous results before new generation
    setCurrentCompletion(null);
    setFeedbackMessage(null);

    try {
      const response = await generateCompletion({ prompt });
      setCurrentCompletion(response.completion);
    } catch (err) {
      console.error("Generation failed:", err);
      setError("Failed to generate completion from the model.");
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleSubmitFeedback = useCallback(async (correctedCompletion: string) => {
    if (!currentPrompt || !currentCompletion) return;

    setIsSubmitting(true);
    setFeedbackMessage(null);

    try {
      const response = await submitFeedback({
        prompt: currentPrompt,
        original_completion: currentCompletion,
        corrected_completion: correctedCompletion,
      });
      setFeedbackMessage(response.message);
      // Immediately fetch status to reflect the new feedback submission
      // in the dashboard (e.g., feedback pool size, progress bar).
      fetchStatus();
    } catch (err) {
      console.error("Feedback submission failed:", err);
      setError("Failed to submit feedback.");
    } finally {
      setIsSubmitting(false);
    }
  }, [currentPrompt, currentCompletion, fetchStatus]);

  return (
    <div className="text-green-300 p-4 lg:p-8 font-mono bg-gray-950 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6 text-center">
          <h1 className="text-4xl font-bold text-green-400">SEAL-Sim</h1>
          <p className="text-gray-400 mt-1">A Dashboard for Safe, Evolving, Adaptive Learning</p>
        </header>

        {error && (
            <div className="p-4 mb-4 bg-red-900 border border-red-700 rounded-lg text-center text-white">
                <strong>Error:</strong> {error}
            </div>
        )}

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Interaction */}
          <div className="flex flex-col gap-6">
            <ModelVisualizer
              onGenerate={handleGenerate}
              completion={currentCompletion}
              isLoading={isGenerating}
            />
            <FeedbackForm
              prompt={currentPrompt}
              originalCompletion={currentCompletion}
              onSubmitFeedback={handleSubmitFeedback}
              isSubmitting={isSubmitting}
              feedbackMessage={feedbackMessage}
            />
          </div>

          {/* Right Column: Monitoring */}
          <div className="flex flex-col gap-6">
            <Dashboard status={systemStatus} />
            <AdaptationLog log={systemStatus?.adaptation_log || []} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;