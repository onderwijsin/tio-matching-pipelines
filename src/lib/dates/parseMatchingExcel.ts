import type { SchoolMatch } from 'types/dates'
import { MATCH_VALUES } from '../../utils/constants'
import type { Row } from 'read-excel-file/node'

/**
 * Parse raw Excel rows into structured school match data.
 *
 * @param rows - raw rows from read-excel-file
 * @returns structured school match list
 */
export function parseMatchingExcel(rows: Row[]): SchoolMatch[] {
	if (rows.length === 0) return []

	const headerRow = rows[0] as string[]

	const result: SchoolMatch[] = []

	// start at 1 → skip header
	for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
		const row = rows[rowIndex] as string[]

		const schoolName = row[0]
		if (typeof schoolName !== 'string' || schoolName.trim() === '') continue

		const matches: string[] = []

		// start at 1 → skip school column
		for (let colIndex = 1; colIndex < row.length; colIndex++) {
			const cellValue = row[colIndex]

			if (typeof cellValue !== 'string') continue

			if (MATCH_VALUES.has(cellValue.trim().toLowerCase())) {
				const traineeName = headerRow[colIndex]
				if (traineeName) {
					matches.push(traineeName)
				}
			}
		}

		if (matches.length === 0) continue

		result.push({
			schoolName,
			matches,
		})
	}

	return result
}
