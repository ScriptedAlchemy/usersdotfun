import type z from "zod";

export const API_BASE_URL = '/api';

export async function handleResponse<T>(response: Response, schema: z.Schema<T>): Promise<T> {
  if (!response.ok) {
    const error = await response.json();
    const errorMessage = error.error?.message || error.message || 'API request failed';

    const apiError = new Error(errorMessage) as Error & { status: number; isNotFound: boolean };
    apiError.status = response.status;
    apiError.isNotFound = response.status === 404;

    throw apiError;
  }
  const data = await response.json();
  try {
    const parsed = schema.parse(data);
    return parsed;
  } catch (error) {
    console.error("Zod validation error:", error);
    return data as T;
  }
}

// Helper function to extract data from API success response
export function extractData<T>(apiResponse: { data?: T }): T {
  if (apiResponse.data === undefined) {
    throw new Error('API response missing data field');
  }
  return apiResponse.data;
}
