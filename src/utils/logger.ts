import { createConsola, type ConsolaInstance } from 'consola'

type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace'
/**
 * Numeric severity mapping aligned with Consola.
 * Higher = noisier.
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
	error: 0,
	warn: 1,
	info: 3,
	debug: 4,
	trace: 5,
}

/**
 * Creates a scoped, level-aware logger for scripts.
 * Log filtering is explicit and predictable based on configured log level
 * in environment variables.
 *
 * @returns Level-aware logger API
 *
 * @example
 * const log = createLogger({ level: 'warn' })
 * log.info('nope') // ignored
 * log.error('boom') // printed
 */
export const createLogger = (options?: {
	LOG_LEVEL?: LogLevel
	LOG_TAG?: string
}): Record<LogLevel, (message: unknown, ...params: unknown[]) => void> & {
	success: (message: unknown, ...params: unknown[]) => void
	blank: () => void
	divider: (level?: LogLevel) => void
	section: (title: string, level?: LogLevel) => void
} => {
	const { LOG_LEVEL = 'info', LOG_TAG = 'tio' } = options ?? process.env
	const instance: ConsolaInstance = createConsola({
		level: LOG_LEVEL_PRIORITY[LOG_LEVEL as LogLevel],
	})

	/**
	 * Helper log log a blank line for better readability in CI logs.
	 * We use console.log directly to avoid being filtered by log level,
	 * and to ensure it appears as a simple blank line in the output.
	 */
	const blank = () => console.log('')

	/**
	 * Utility to log a divider line, which is a visually distinct log entry
	 * that can be used to separate different sections of the logs.
	 * @param LOG_LEVEL The log level to use for the divider (default: 'info').
	 */
	const divider = (LOG_LEVEL: LogLevel = 'info') =>
		instance[LOG_LEVEL](
			'----------------------------------------------------------------------',
		)

	/**
	 * Helper to log a section header, which is a visually distinct log
	 * entry that can be used to separate different parts of the logs.
	 * @param title The title of the section to log.
	 * @param LOG_LEVEL The log level to use for the section header (default: 'info').
	 */
	const section = (title: string, LOG_LEVEL: LogLevel = 'info') => {
		blank()
		divider(LOG_LEVEL)
		instance[LOG_LEVEL](` ${title}   `)
		divider(LOG_LEVEL)
	}

	return {
		...instance.withTag(LOG_TAG),
		blank,
		divider,
		section,
	}
}

/**
 * Type representing the logger instance created by createLogger.
 */
export type Logger = ReturnType<typeof createLogger>
