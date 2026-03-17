import writeXlsxFile from 'write-excel-file/node'
import type { MatchResult, TraineeListItem, SchoolListItem } from '@/types/matches'
import type { ExcelRow } from 'types/excel'

import { cellStyles, cellStylesWithBg, colWidth } from '../../utils/constants'
import { resolveOutputPath, createScopedFileName } from '../../utils/helpers'
import type { Round } from '@/types/primitives'

/**
 * Create Excel export for schools.
 *
 * This produces a flat list (no matching logic), used for:
 * - printing
 * - manual review
 * - logistics (who is attending, preferences, etc.)
 *
 * Each row = one school
 * Each column = a simple field (no formulas)
 *
 * @param schoolList - Flattened school list (already normalized & sorted)
 * @param config - Configuration object containing output directory
 */
async function createSchoolListExcel(
	schoolList: SchoolListItem[],
	config: { outputDir: string; round: Round },
): Promise<void> {
	/**
	 * Header defines column order and meaning.
	 * Keep this in sync with row mapping below.
	 */
	const headerRow: ExcelRow = [
		{ value: 'School Name', fontWeight: 'bold', ...cellStylesWithBg },
		{ value: 'Contact Phone', fontWeight: 'bold', ...cellStylesWithBg },
		{ value: 'Allergies', fontWeight: 'bold', ...cellStylesWithBg },
		{ value: 'General Notes', fontWeight: 'bold', ...cellStylesWithBg },
		{ value: 'Present', fontWeight: 'bold', ...cellStylesWithBg },
		{ value: 'Preferences', fontWeight: 'bold', ...cellStylesWithBg },
	]

	/**
	 * Map domain objects → flat Excel rows
	 *
	 * Important:
	 * - All values are strings (no formulas here)
	 * - Missing values should already be normalized upstream
	 */
	const rows: ExcelRow[] = schoolList.map((school) => [
		{ type: String, value: school.name, ...cellStyles },
		{ type: String, value: school.contactPhone, ...cellStyles },
		{ type: String, value: school.allergies, ...cellStyles },
		{ type: String, value: school.notes_general, ...cellStyles },
		{ type: String, value: school.isPresent, ...cellStyles },
		{ type: String, value: school.preferences, ...cellStyles },
	])

	const outputPath = resolveOutputPath(
		config.outputDir,
		createScopedFileName('school_list', config.round),
	)

	/**
	 * Write Excel file
	 *
	 * Column widths are uniform here because:
	 * - content is predictable
	 * - no dynamic sizing needed (unlike match table)
	 */
	await writeXlsxFile([headerRow, ...rows], {
		columns: [
			{ width: colWidth },
			{ width: colWidth },
			{ width: colWidth },
			{ width: colWidth },
			{ width: colWidth },
			{ width: colWidth },
		],
		filePath: outputPath,
	})
}

/**
 * Create Excel export for trainees.
 *
 * Similar to school list, but with fewer fields.
 *
 * Each row = one trainee
 * No matching logic, purely informational export.
 *
 * @param traineeList - Flattened trainee list (already normalized & sorted)
 * @param config - Configuration object containing output directory
 */
async function createTraineeListExcel(
	traineeList: TraineeListItem[],
	config: { outputDir: string; round: Round },
): Promise<void> {
	/**
	 * Header defines column structure.
	 */
	const headerRow: ExcelRow = [
		{ value: 'Trainee Name', fontWeight: 'bold', ...cellStylesWithBg },
		{ value: 'Allergies', fontWeight: 'bold', ...cellStylesWithBg },
		{ value: 'General Notes', fontWeight: 'bold', ...cellStylesWithBg },
		{ value: 'Preferences', fontWeight: 'bold', ...cellStylesWithBg },
	]

	/**
	 * Map trainee data → Excel rows
	 */
	const rows: ExcelRow[] = traineeList.map((trainee) => [
		{ type: String, value: trainee.name, ...cellStyles },
		{ type: String, value: trainee.allergies, ...cellStyles },
		{ type: String, value: trainee.notes_general, ...cellStyles },
		{ type: String, value: trainee.preferences, ...cellStyles },
	])

	const outputPath = resolveOutputPath(
		config.outputDir,
		createScopedFileName('trainee_list', config.round),
	)

	await writeXlsxFile([headerRow, ...rows], {
		columns: [
			{ width: colWidth },
			{ width: colWidth },
			{ width: colWidth },
			{ width: colWidth },
		],
		filePath: outputPath,
	})
}

/**
 * Create all "form list" Excel exports.
 *
 * These are simple, human-readable exports used alongside the main
 * matching matrix:
 * - trainee list
 * - school list
 *
 * Important:
 * - Order should already be sorted upstream (do NOT sort here)
 * - Data should already be normalized (no null handling here)
 *
 * @param data - Prepared match result
 * @param config - Configuration object containing output directory
 */
export async function createFormlists(
	data: MatchResult,
	config: { outputDir: string; round: Round },
): Promise<void> {
	await createTraineeListExcel(data.traineelist, config)
	await createSchoolListExcel(data.schoollist, config)
}
