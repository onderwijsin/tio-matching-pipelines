import writeXlsxFile, { type Row } from 'write-excel-file/node'
import type { SchoolMatch } from 'types/dates'
import { cellStyles, cellStylesWithBg, colWidth } from '../../utils/constants'
import { getColWidth } from '../../utils/helpers'

/**
 * Create Excel file: school → ordered matches (dates)
 */
export async function createDatesTable(options: {
	matches: SchoolMatch[]
	numberOfSlots: number
	outputPath: string
}): Promise<void> {
	const { matches, numberOfSlots, outputPath } = options

	const headerRow: Row = [
		{ value: 'School', fontWeight: 'bold', ...cellStylesWithBg },
		...Array.from({ length: numberOfSlots }, (_, i) => ({
			value: `Date #${i + 1}`,
			fontWeight: 'bold' as const,
			...cellStylesWithBg,
		})),
	]

	const rows: Row[] = matches.map((school) => [
		{
			type: String,
			value: school.schoolName,
			fontWeight: 'bold',
			...cellStylesWithBg,
		},
		...school.matches.map((name) => ({
			type: String,
			value: name,
			...cellStyles,
		})),
	])

	await writeXlsxFile([headerRow, ...rows], {
		columns: [{ width: Math.ceil(colWidth * 1.3) }, ...getColWidth(numberOfSlots, colWidth)],
		filePath: outputPath,
	})
}
