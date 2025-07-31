// src/api.ts

/**
 * @file api.ts
 * @description This module serves as the dedicated data access layer for the SEAL-Sim frontend.
 * It encapsulates all interactions with the backend's FastAPI endpoints. This architectural pattern,
 * often referred to as a "service layer" or "API client," is crucial for several reasons:
 *   1.  **Separation of Concerns**: It abstracts the complexities of network requests (e.g., fetch, error handling,
 *       URL construction) away from the React components, which should primarily be concerned with UI rendering and state.
 *   2.  **Reusability & Maintainability**: If multiple components need the same data, they can all import functions
 *       from this file. If an endpoint changes, the update only needs to be made in one place.
 *   3.  **Type Safety**: By defining explicit TypeScript types for API responses, we can leverage compile-time
 *       checking throughout the application, significantly reducing runtime errors.
 */

// The base URL for the backend API. Using an environment variable is best practice for production,
// but hardcoding is acceptable for this local simulation environment.
const API_BASE_URL = "http://localhost:8000/api";

// --- Type Definitions ---
// These interfaces define the data contracts between the frontend and backend. They are derived
// from the Pydantic models in the FastAPI application and the structure of its JSON responses.

export interface SystemStatus {
  model_status: {
    status: 'unloaded' | 'loading' | 'ready';
    base_model: string;
    current_adapter: string;
    device: string;
  };
  seal_policy: {
    feedback_count: number;
    feedback_threshold: number;
  };
  adaptation_log: AdaptationLogEntry[];
  feedback_pool_size: number;
}

export interface AdaptationLogEntry {
  blockNumber: number;
  timestamp: string; // This appears to be a JSON string of a list in the backend, a slight eccentricity.
  event: string;
  feedback_count?: number; // Optional, as not all log entries have this.
}

export interface GenerateRequest {
  prompt: string;
}

export interface GenerateResponse {
  completion: string;
}

export interface FeedbackRequest {
  prompt: string;
  original_completion: string;
  corrected_completion: string;
}

export interface FeedbackResponse {
  message: string;
}


// --- API Functions ---

/**
 * Fetches the current system status from the `/api/status` endpoint.
 * This function exemplifies a robust async data-fetching pattern.
 * @returns {Promise<SystemStatus>} A promise that resolves to the system's status.
 * @throws {Error} Throws an error if the network response is not 'ok' (e.g., 404, 500).
 *         This allows the calling component to catch the error and update the UI accordingly.
 */
export const getStatus = async (): Promise<SystemStatus> => {
  const response = await fetch(`${API_BASE_URL}/status`);
  if (!response.ok) {
    throw new Error(`Network response was not ok. Status: ${response.status}`);
  }
  return response.json();
};

/**
 * Sends a prompt to the `/api/generate` endpoint to get a model completion.
 * @param {GenerateRequest} request - The request object containing the prompt.
 * @returns {Promise<GenerateResponse>} A promise that resolves to the model's completion.
 * @throws {Error} Throws if the network request fails.
 */
export const generateCompletion = async (request: GenerateRequest): Promise<GenerateResponse> => {
  const response = await fetch(`${API_BASE_URL}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error(`Failed to generate completion. Status: ${response.status}`);
  }
  return response.json();
};

/**
 * Submits user feedback to the `/api/submit_feedback` endpoint.
 * This is a critical function in the SEAL (Safe, Evolving, Adaptive Learning) loop.
 * @param {FeedbackRequest} request - The feedback object.
 * @returns {Promise<FeedbackResponse>} A promise that resolves to the backend's confirmation message.
 * @throws {Error} Throws if the network request fails.
 */
export const submitFeedback = async (request: FeedbackRequest): Promise<FeedbackResponse> => {
  const response = await fetch(`${API_BASE_URL}/submit_feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error(`Failed to submit feedback. Status: ${response.status}`);
  }
  return response.json();
};