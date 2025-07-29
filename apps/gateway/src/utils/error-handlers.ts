import { Cause } from 'effect';
import { JobNotFoundError, ValidationError, DbError } from '@usersdotfun/shared-db';

export class HttpError extends Error {
  constructor(message: string, public status: number, public details?: any) {
    super(message);
    this.name = 'HttpError';
  }
}

export const toHttpError = (error: any): HttpError => {
  console.error('Effect Error Details:', {
    error,
    message: error?.message,
    cause: error?.cause,
    stack: error?.stack,
    constructor: error?.constructor?.name,
    isJobNotFoundError: error instanceof JobNotFoundError,
    isValidationError: error instanceof ValidationError,
    isDbError: error instanceof DbError,
    isRuntimeException: Cause.isRuntimeException(error),
    errorType: error?._tag,
    errorData: error?.errors,
    nestedError: error?.error,
    errorCause: error?.cause,
    allKeys: Object.keys(error || {}),
  });

  let validationDetails = null;

  if (error instanceof ValidationError) {
    validationDetails = error.errors?.issues || error.errors;
  } else if (error?.message?.includes('Validation failed')) {
    const nestedError = error?.cause || error?.error || error;
    if (nestedError?.errors?.issues) {
      validationDetails = nestedError.errors.issues;
    } else if (nestedError?.errors) {
      validationDetails = nestedError.errors;
    }
  }

  if (validationDetails) {
    const formattedDetails = JSON.stringify(validationDetails, null, 2);
    console.error('Extracted Validation Details:', formattedDetails);
    return new HttpError(`Validation failed: ${formattedDetails}`, 400, validationDetails);
  }

  if (error instanceof JobNotFoundError) {
    return new HttpError('Job not found', 404);
  }

  if (error instanceof DbError) {
    return new HttpError(`Database error: ${error.message}`, 500);
  }

  if (Cause.isRuntimeException(error)) {
    return new HttpError(`Runtime error: ${error.message || 'Internal server error'}`, 500);
  }

  return new HttpError(`Unexpected error: ${error?.message || 'An unexpected error occurred'}`, 500);
};

export const honoErrorHandler = (c: any, error: unknown) => {
  console.error('Gateway Error:', {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    cause: error instanceof Error ? (error as any).cause : undefined,
    name: error instanceof Error ? error.constructor.name : typeof error,
    error: error,
  });

  if (error instanceof HttpError) {
    return c.json({ error: error.message, details: error.details }, error.status);
  }

  const isDev = process.env.NODE_ENV !== 'production';
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  const errorDetails = error instanceof Error ? error.stack : 'An unexpected error occurred';
  
  return c.json(
    {
      error: isDev ? errorMessage : 'Internal Server Error',
      details: isDev ? errorDetails : 'An unexpected error occurred',
    },
    500,
  );
};
