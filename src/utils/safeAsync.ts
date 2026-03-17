import { createLogger } from './logger'

const logger = createLogger()

/** Response type for successful async operations, containing the data and a null error */
export interface SuccessResponse<T> {
	data: T
	error: null
}

/** Response type for failed async operations, containing a null data and the error */
export interface ErrorResponse {
	data: null
	error: Error
}

/**
 * A helper function to safely execute an asynchronous function and handle errors gracefully.
 * It returns a standardized response object that contains either the data or the error.
 *
 * @param fn - The asynchronous function to execute, which should return a Promise
 * @returns A Promise that resolves to either a SuccessResponse containing the data or an ErrorResponse containing the error
 */
export async function safeAsync<T>(
	fn: () => Promise<T>,
): Promise<SuccessResponse<T> | ErrorResponse> {
	try {
		const response = await fn()
		return {
			data: response, // Extract data property from ofetch response
			error: null,
		}
	} catch (error) {
		logger.error('Error during fetch:')
		logger.error(error)
		return {
			data: null,
			error: error instanceof Error ? error : new Error(String(error)),
		}
	}
}
