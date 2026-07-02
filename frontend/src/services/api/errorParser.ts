import axios from 'axios';

export function parseApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ERR_NETWORK') {
      return 'Network error: Cannot reach server. Please check your internet connection and ensure the server is running.';
    }

    const serverMessage = error.response?.data?.message;
    if (serverMessage) {
      return serverMessage;
    }

    if (error.response?.status === 400) {
      return 'Invalid request details. Please check form validation.';
    }
    if (error.response?.status === 401) {
      return 'Incorrect email or password.';
    }
    if (error.response?.status === 403) {
      return 'Access forbidden. You do not have permission to access this resource.';
    }
    if (error.response?.status === 404) {
      return 'Requested resource not found.';
    }
    if (error.response?.status === 429) {
      return 'Too many attempts. Account locked or rate limit reached. Please try again later.';
    }
    if (error.response?.status && error.response.status >= 500) {
      return 'Internal server error. Please try again in a few minutes.';
    }
  }

  return error instanceof Error ? error.message : 'An unexpected error occurred.';
}
