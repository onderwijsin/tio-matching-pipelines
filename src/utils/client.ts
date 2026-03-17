import { ofetch } from 'ofetch'
import { useEnv } from './env'
import { joinURL } from 'ufo'
import type { FetchError } from 'ofetch'

/**
 * Type guard for ofetch errors
 */
function isFetchError(error: unknown): error is FetchError {
	return typeof error === 'object' && error !== null && 'data' in error
}

const env = useEnv()

// The backend uses cookie based auth, so recreate the 🍪 header
const cookie = `cookieconsent_status=1; keystonejs-session=${process.env.AUTH_TOKEN};`

/**
 * Create an ofetch client for the host with defaults applied
 */
const client = ofetch.create({
	baseURL: joinURL(env.HOST, 'api', 'graphql'),
	method: 'POST',
	headers: {
		Cookie: cookie,
		'Content-Type': 'application/json',
	},
})

/**
 * Helper function for executing GraphQL queries
 * @param query The GraphQL query string
 * @param variables Variables for the query
 */
/**
 * Helper function for executing GraphQL queries
 * @param query The GraphQL query string
 * @param variables Variables for the query
 */
async function useQuery<T, TVariables extends Record<string, unknown> = Record<string, never>>(
	query: string,
	variables?: TVariables,
): Promise<{ data: T }> {
	try {
		return await client<{ data: T }>('', {
			body: {
				query,
				variables,
			},
		})
	} catch (error: unknown) {
		// 👇 this is where the good stuff is
		if (isFetchError(error)) {
			console.error('GraphQL error response:', JSON.stringify(error.data, null, 2))
		}

		throw error // rethrow so your safeAsync still works
	}
}

export { client, useQuery }
