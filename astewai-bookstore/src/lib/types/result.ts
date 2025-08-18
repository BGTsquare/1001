/**
 * Generic Result type for better error handling
 * Inspired by Rust's Result<T, E> type
 */

export type Result<T, E = string> = 
  | { success: true; data: T }
  | { success: false; error: E }

/**
 * Creates a successful result
 */
export function success<T>(data: T): Result<T> {
  return { success: true, data }
}

/**
 * Creates an error result
 */
export function error<E = string>(error: E): Result<never, E> {
  return { success: false, error }
}

/**
 * Alias for error function for backward compatibility
 */
export const failure = error

/**
 * Type guard to check if result is successful
 */
export function isSuccess<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success
}

/**
 * Type guard to check if result is an error
 */
export function isError<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success
}

/**
 * Maps a successful result to a new value
 */
export function mapResult<T, U, E>(
  result: Result<T, E>,
  mapper: (data: T) => U
): Result<U, E> {
  if (isSuccess(result)) {
    return success(mapper(result.data))
  }
  return result
}

/**
 * Chains results together, useful for sequential operations
 */
export function chainResult<T, U, E>(
  result: Result<T, E>,
  mapper: (data: T) => Result<U, E>
): Result<U, E> {
  if (isSuccess(result)) {
    return mapper(result.data)
  }
  return result
}