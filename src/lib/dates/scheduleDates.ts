import type {
	DateDataset,
	ScheduleResult,
	AvailabilityOverride,
	SlotNumber,
	SchoolSlotSchedule,
	TraineeSlotSchedule,
} from 'types/dates'

/**
 * Create a lookup map for availability overrides.
 */
function createAvailabilityMap(overrides: AvailabilityOverride[]): Map<string, Set<SlotNumber>> {
	const map = new Map<string, Set<SlotNumber>>()

	for (const override of overrides) {
		map.set(override.name, new Set(override.availability))
	}

	return map
}

/**
 * Get availability for an entity.
 * Falls back to full availability if no override exists.
 */
function getAvailability(
	map: Map<string, Set<SlotNumber>>,
	name: string,
	numberOfSlots: number,
): Set<SlotNumber> {
	const existing = map.get(name)
	if (existing) return existing

	// default: fully available
	return new Set(Array.from({ length: numberOfSlots }, (_, i) => i + 1))
}

/**
 * Assign slots to school/trainee pairs using greedy first-fit.
 *
 * @param input - scheduling input
 * @returns schedule result
 */
export function scheduleDates(input: {
	dataset: DateDataset
	overrides: AvailabilityOverride[]
	numberOfSlots: number
}): ScheduleResult {
	const { dataset, overrides, numberOfSlots } = input

	const availabilityMap = createAvailabilityMap(overrides)

	const traineeSchedule = new Map<string, Set<SlotNumber>>() // prevent double booking

	const bySchool: SchoolSlotSchedule[] = []
	const unassignedMatches: ScheduleResult['unassignedMatches'] = []

	for (const school of dataset.matches) {
		const slots: (string | null)[] = Array.from({ length: numberOfSlots }, () => null)

		const schoolAvailability = getAvailability(
			availabilityMap,
			school.schoolName,
			numberOfSlots,
		)

		for (const trainee of school.matches) {
			const traineeAvailability = getAvailability(availabilityMap, trainee, numberOfSlots)

			let assigned = false

			for (let slot = 1; slot <= numberOfSlots; slot++) {
				const isFree = slots[slot - 1] === null
				const schoolAvailable = schoolAvailability.has(slot)
				const traineeAvailable = traineeAvailability.has(slot)
				const traineeFree =
					!traineeSchedule.has(trainee) || !traineeSchedule.get(trainee)!.has(slot)

				if (isFree && schoolAvailable && traineeAvailable && traineeFree) {
					slots[slot - 1] = trainee

					if (!traineeSchedule.has(trainee)) {
						traineeSchedule.set(trainee, new Set())
					}

					traineeSchedule.get(trainee)!.add(slot)

					assigned = true
					break
				}
			}

			if (!assigned) {
				unassignedMatches.push({
					schoolName: school.schoolName,
					traineeName: trainee,
				})
			}
		}

		bySchool.push({
			schoolName: school.schoolName,
			slots,
		})
	}

	/**
	 * Build trainee view from school schedule
	 */
	const traineeMap = new Map<string, (string | null)[]>()

	for (const trainee of dataset.trainees) {
		traineeMap.set(
			trainee,
			Array.from({ length: numberOfSlots }, () => null),
		)
	}

	for (const school of bySchool) {
		school.slots.forEach((trainee, index) => {
			if (!trainee) return

			const row = traineeMap.get(trainee)
			if (!row) return

			row[index] = school.schoolName
		})
	}

	const byTrainee: TraineeSlotSchedule[] = Array.from(traineeMap.entries()).map(
		([traineeName, slots]) => ({
			traineeName,
			slots,
		}),
	)

	return {
		bySchool,
		byTrainee,
		unassignedMatches,
	}
}
