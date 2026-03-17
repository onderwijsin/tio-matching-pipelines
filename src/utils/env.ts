import dotenv from 'dotenv'
import { z } from 'zod'
import { createLogger } from './logger'

dotenv.config()

export const envSchema = z.object({
	LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
	LOG_TAG: z.string().default('tio'),
	AUTH_TOKEN: z.string({ error: 'AUTH_TOKEN is required' }),
	HOST: z.url({ error: 'HOST is required and must be a valid URL' }),
	ROUND: z.enum(['day_1', 'day_2', 'final_3']),
	OUTPUT_DIR: z.string().default('./.output'),
	INPUT_DIR: z.string().default('./.input'),
	FILTER_MISSING_RECORDS: z.stringbool().default(false),
})

/**
 * Type representing the validated environment variables for the search package.
 */
export type Env = z.infer<typeof envSchema>

/**
 * Retrieves and validates environment variables for the search package.
 * @param rawEnv Optional raw environment variables object. if not provided, uses process.env.
 * @returns Validated environment variables
 * @throws Will exit the process if validation fails.
 */
export function useEnv(rawEnv?: Record<string, unknown>): Env {
	const parsed = envSchema.safeParse(rawEnv ?? process.env)

	if (!parsed.success) {
		const log = createLogger()
		log.error('Meili environment variable validation failed:')
		for (const issue of parsed.error.issues) {
			log.error(`- ${issue.path.join('.')} : ${issue.message}`)
		}
		throw new Error('Invalid Meili environment variables. Please check the logs for details.')
	}

	return parsed.data
}
