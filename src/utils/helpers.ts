import type { MatchingConfig } from '@/types/matchConfig'
import type { MatchRef, MatchRow } from '@/types/matches'
import type { Round } from '@/types/primitives'
import path from 'pathe'

/**
 * Resolve output file path relative to CWD
 */
export function resolveOutputPath(dir: string, file: string): string {
	return path.resolve(process.cwd(), dir, file)
}

/**
 * Convert zero-based index to Excel column letter
 * @param index - Zero-based column index
 * @returns Excel column name (e.g. A, B, ..., AA)
 *
 * @example
 * indexToLetter(0) // A
 * indexToLetter(25) // Z
 * indexToLetter(26) // AA
 */
export function indexToLetter(index: number): string {
	let result = ''
	let n = index + 1 // Excel is 1-based

	while (n > 0) {
		const remainder = (n - 1) % 26
		result = String.fromCharCode(65 + remainder) + result
		n = Math.floor((n - 1) / 26)
	}

	return result
}

/**
 * Generate column width config for Excel
 * @param count - Number of columns
 * @param width - Width per column
 */
export function getColWidth(count: number, width: number): { width: number }[] {
	return Array.from({ length: count }, () => ({ width }))
}

/**
 * Match type result
 */
export interface MatchType {
	double: boolean
	single: boolean
	none: boolean
	byTrainee: boolean
	bySchool: boolean
	priority: number | null
}

/**
 * Entity used in matching logic (school or trainee)
 */
export type MatchEntity = MatchRow<MatchRef>

/**
 * Determine match type between two match entities
 */
export function findMatchType(trainee: MatchEntity, school: MatchEntity): MatchType {
	const doubleMatch = trainee.doubleSideMatches.find((m) => m.id === school.id)

	if (doubleMatch) {
		return {
			double: true,
			single: false,
			none: false,
			byTrainee: false,
			bySchool: false,
			priority: null,
		}
	}

	const traineeSingle = trainee.singleSideMatches.find((m) => m.id === school.id)

	if (traineeSingle) {
		return {
			double: false,
			single: true,
			none: false,
			byTrainee: true,
			bySchool: false,
			priority: traineeSingle.priority,
		}
	}

	const schoolSingle = school.singleSideMatches.find((m) => m.id === trainee.id)

	if (schoolSingle) {
		return {
			double: false,
			single: true,
			none: false,
			byTrainee: false,
			bySchool: true,
			priority: schoolSingle.priority,
		}
	}

	return {
		double: false,
		single: false,
		none: true,
		byTrainee: false,
		bySchool: false,
		priority: null,
	}
}

/**
 * Locale-aware alphabetical sort (case insensitive)
 */
export function sortByName<T extends { name: string }>(arr: T[]): T[] {
	return arr.sort((a, b) => a.name.localeCompare(b.name, 'nl', { sensitivity: 'base' }))
}

/**
 * Safely resolve settings for the active round.
 * @param settings - Matching settings
 * @param round - Active round
 * @returns Slot settings for the active round
 */
export function getRoundSettings(settings: MatchingConfig, round: Round) {
	return settings.slotSettings[round]
}

export function getRoundSettingsForSpeeddates(
	settings: MatchingConfig,
	round: Exclude<Round, 'final_3'>,
) {
	return settings.slotSettings[round]
}

/**
 * Return a .xlsx filename scoped to current round
 * @param baseName
 * @param scope
 * @returns
 */
export function createScopedFileName(baseName: string, scope: string): string {
	return `${baseName}.${scope}.xlsx`
}

/**
 * Return the matching schema excel file name based on current round
 * @param round
 */
export function getMatchingSchemaFileName(round: Round): string {
	return createScopedFileName('matching_schema', round)
}

/**
 * Resolve the matching schema file for the active round.
 * @param round - Active round
 * @returns File name of the matching schema
 */
export function resolveMatchingSchemaFile(round: Round, options: { inputDir: string }): string {
	const fileName = getMatchingSchemaFileName(round)
	return resolveOutputPath(options.inputDir, fileName)
}
