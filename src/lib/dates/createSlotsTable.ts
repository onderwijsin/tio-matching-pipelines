import writeXlsxFile, { type Row } from 'write-excel-file/node'
import type { ScheduleResult } from 'types/dates'
import { cellStyles, cellStylesWithBg, colWidth } from '../../utils/constants'
import { getColWidth, createScopedFileName } from '../../utils/helpers'
import type { Round } from '@/types/primitives'

/**
 * Create Excel files:
 * - slots by school
 * - slots by trainee
 */
export async function createSlotsTables(options: {
	schedule: ScheduleResult
	numberOfSlots: number
	outputDir: string
	round: Round
}): Promise<void> {
	const { schedule, numberOfSlots, outputDir } = options

	/**
	 * Schools table
	 */
	const schoolHeader: Row = [
		{ value: 'School', fontWeight: 'bold', ...cellStylesWithBg },
		...Array.from({ length: numberOfSlots }, (_, i) => ({
			value: `Slot #${i + 1}`,
			fontWeight: 'bold' as const,
			...cellStylesWithBg,
		})),
	]

	const schoolRows: Row[] = schedule.bySchool.map((school) => [
		{
			type: String,
			value: school.schoolName,
			fontWeight: 'bold' as const,
			...cellStylesWithBg,
		},
		...school.slots.map((trainee) => ({
			type: String,
			value: trainee ?? '',
			...cellStyles,
		})),
	])

	await writeXlsxFile([schoolHeader, ...schoolRows], {
		columns: [{ width: Math.ceil(colWidth * 1.3) }, ...getColWidth(numberOfSlots, colWidth)],
		filePath: `${outputDir}/${createScopedFileName('slotsBySchool', options.round)}`,
	})

	/**
	 * Trainees table
	 */
	const traineeHeader: Row = [
		{ value: 'Trainee', fontWeight: 'bold', ...cellStylesWithBg },
		...Array.from({ length: numberOfSlots }, (_, i) => ({
			value: `Slot #${i + 1}`,
			fontWeight: 'bold' as const,
			...cellStylesWithBg,
		})),
	]

	const traineeRows: Row[] = schedule.byTrainee.map((trainee) => [
		{
			type: String,
			value: trainee.traineeName,
			fontWeight: 'bold' as const,
			...cellStylesWithBg,
		},
		...trainee.slots.map((school) => ({
			type: String,
			value: school ?? '',
			...cellStyles,
		})),
	])

	await writeXlsxFile([traineeHeader, ...traineeRows], {
		columns: [{ width: Math.ceil(colWidth * 1.3) }, ...getColWidth(numberOfSlots, colWidth)],
		filePath: `${outputDir}/${createScopedFileName('slotsByTrainee', options.round)}`,
	})
}
