import writeXlsxFile from 'write-excel-file/node'
import type { Cell } from 'write-excel-file/node'
import {
	indexToLetter,
	findMatchType,
	getColWidth,
	resolveOutputPath,
	getMatchingSchemaFileName,
} from '../../utils/helpers'
import type { MatchResult } from '@/types/matches'
import type { ExcelRow } from 'types/excel'

import {
	cellStyles,
	cellStylesWithBg,
	cellStylesExtraHeight,
	colWidth,
	matchColor,
	traineeColor,
	schoolColor,
	nullColor,
} from '../../utils/constants'
import type { Round } from '@/types/primitives'

/**
 * Create the main matching matrix Excel.
 *
 * This generates a grid where:
 * - Rows = schools
 * - Columns = trainees
 * - Cells = match relationship between them
 *
 * Layout:
 * [HEADER ROW]
 * [DATA ROWS...]
 * [FOOTER ROW: match counts per trainee]
 * [SECOND FOOTER ROW: trainee comments]
 *
 * @param matchData - Prepared match result
 * @param config - Output configuration
 */
export async function createExcelMatchTable(
	matchData: MatchResult,
	config: { outputDir: string; round: Round },
): Promise<void> {
	/**
	 * HEADER ROW
	 * First column = "School"
	 * Then one column per trainee
	 * Then summary + comments columns
	 */
	const headerRow: ExcelRow = [
		{
			value: 'School',
			fontWeight: 'bold',
			...cellStylesWithBg,
		},
	]

	/**
	 * FOOTER ROW
	 * Contains Excel formulas to count matches per trainee column
	 */
	const footerRow: ExcelRow = [
		{
			value: 'Aantal matches',
			fontWeight: 'bold',
			...cellStylesWithBg,
		},
	]

	/**
	 * SECOND FOOTER ROW
	 * Contains trainee comments (aligned with trainee columns)
	 */
	const secondFooterRow: ExcelRow = [
		{
			value: 'Opmerkingen van kandidaat',
			fontWeight: 'bold',
			...cellStylesExtraHeight,
		},
	]

	/**
	 * Add a column per trainee
	 * Also populate second footer row with comments
	 */
	for (const trainee of matchData.matchesByTrainee) {
		headerRow.push({
			value: trainee.name,
			fontWeight: 'bold',
			...cellStylesWithBg,
		})

		secondFooterRow.push({
			value: trainee.comments,
			fontWeight: 'bold',
			wrap: true,
			...cellStylesExtraHeight,
		})
	}

	/**
	 * Add trailing columns:
	 * - total matches per school (row-wise)
	 * - school comments
	 */
	headerRow.push({
		value: 'Aantal matches',
		fontWeight: 'bold',
		...cellStylesWithBg,
	})

	headerRow.push({
		value: 'Opmerkingen van school',
		fontWeight: 'bold',
		...cellStylesWithBg,
	})

	/**
	 * Build footer formulas for each trainee column
	 *
	 * Uses COUNTIF over the column range:
	 * - "match"
	 * - "forcedMatch"
	 * - "forceMatch" (legacy typo compatibility)
	 */
	for (const [index] of matchData.matchesByTrainee.entries()) {
		const col = indexToLetter(index + 1) // +1 because first column is "School"
		const lastRow = 1 + matchData.matchesBySchool.length

		footerRow.push({
			type: 'Formula',
			value: `=COUNTIF(${col}2:${col}${lastRow}, "match") + COUNTIF(${col}2:${col}${lastRow}, "forcedMatch") + COUNTIF(${col}2:${col}${lastRow}, "forceMatch")`,
			fontWeight: 'bold',
			...cellStylesWithBg,
		})
	}

	/**
	 * DATA ROWS
	 * Each row represents a school
	 */
	const rows: ExcelRow[] = matchData.matchesBySchool.map((school, index) => {
		const rowNumber = index + 2 // Excel row index (1-based + header)
		const lastMatchColumn = indexToLetter(matchData.matchesByTrainee.length)

		return [
			/**
			 * First column: school name
			 */
			{
				type: String,
				value: school.name,
				fontWeight: 'bold',
				...cellStylesWithBg,
			},

			/**
			 * Match cells (one per trainee)
			 */
			...matchData.matchesByTrainee.map((trainee) => {
				const mt = findMatchType(trainee, school)

				/**
				 * Determine display value + color based on match type
				 */
				return {
					type: String,
					value: mt.double
						? 'match'
						: mt.byTrainee
							? `match vanuit trainee (#${mt.priority})`
							: mt.bySchool
								? `match vanuit school (#${mt.priority})`
								: undefined, // empty cell
					backgroundColor: mt.double
						? matchColor
						: mt.byTrainee
							? traineeColor
							: mt.bySchool
								? schoolColor
								: nullColor,
					...cellStyles,
				} satisfies Cell
			}),

			/**
			 * Row-wise match count (per school)
			 */
			{
				type: 'Formula',
				value: `=COUNTIF(B${rowNumber}:${lastMatchColumn}${rowNumber}, "match") + COUNTIF(B${rowNumber}:${lastMatchColumn}${rowNumber}, "forcedMatch") + COUNTIF(B${rowNumber}:${lastMatchColumn}${rowNumber}, "forceMatch")`,
				fontWeight: 'bold',
				...cellStylesWithBg,
			},

			/**
			 * School comments
			 */
			{
				type: String,
				value: school.comments,
				...cellStylesWithBg,
			},
		]
	})

	/**
	 * Final sheet structure
	 */
	const data: ExcelRow[] = [headerRow, ...rows, footerRow, secondFooterRow]

	const outputPath = resolveOutputPath(config.outputDir, getMatchingSchemaFileName(config.round))

	/**
	 * Write Excel file
	 */
	await writeXlsxFile(data, {
		columns: [
			{ width: Math.ceil(colWidth * 1.3) }, // first column slightly wider
			...getColWidth(matchData.matchesByTrainee.length, colWidth),
			{ width: colWidth }, // match count column
			{ width: 75 }, // comments column (fixed width)
		],
		filePath: outputPath,
	})
}
