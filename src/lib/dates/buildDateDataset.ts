import type { DateDataset, SchoolMatch } from 'types/dates'
import { parseMatchingExcel } from './parseMatchingExcel'
import type { Submission } from '@/types/submissions'
import type { Row } from 'read-excel-file/node'

interface BuildDateDatasetOptions {
	rows: Row[]
	submissions: Submission[]
	overrideNames: string[]
}

/**
 * Build the dataset used for scheduling and Excel exports.
 *
 * This function is PURE:
 * - no IO
 * - no globals
 *
 * @param options - input data required to construct dataset
 * @returns structured dataset
 */
export function buildDateDataset(options: BuildDateDatasetOptions): DateDataset {
	const { rows, submissions, overrideNames } = options

	/**
	 * STEP 1: parse Excel → SchoolMatch[]
	 */
	const parsedMatches = parseMatchingExcel(rows)

	/**
	 * STEP 2: sort schools (overrides first)
	 */
	const matches: SchoolMatch[] = parsedMatches
		.sort((a, b) => {
			if (overrideNames.includes(a.schoolName)) return -1
			if (overrideNames.includes(b.schoolName)) return 1
			return 0
		})
		.map((school) => ({
			schoolName: school.schoolName,
			matches: [...school.matches].sort((a, b) => {
				if (overrideNames.includes(a)) return -1
				if (overrideNames.includes(b)) return 1
				return 0
			}),
		}))

	/**
	 * STEP 3: extract trainees + schools from submissions
	 */
	const trainees = submissions.filter((s) => s.trainee).map((s) => s.trainee!.name)

	const schools = submissions.filter((s) => s.school).map((s) => s.school!.name)

	return {
		matches,
		trainees,
		schools,
	}
}
