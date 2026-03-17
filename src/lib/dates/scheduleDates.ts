import type {
	DateDataset,
	ScheduleResult,
	AvailabilityOverride,
	SlotNumber,
	SchoolSlotSchedule,
	TraineeSlotSchedule,
} from 'types/dates'

/**
 * Create availability lookup map.
 */
function createAvailabilityMap(overrides: AvailabilityOverride[]): Map<string, Set<SlotNumber>> {
	const map = new Map<string, Set<SlotNumber>>()
	for (const override of overrides) {
		map.set(override.name, new Set(override.availability))
	}
	return map
}

/**
 * Get availability for entity (fallback = fully available).
 */
function getAvailability(
	map: Map<string, Set<SlotNumber>>,
	name: string,
	numberOfSlots: number,
): Set<SlotNumber> {
	return (
		map.get(name) ??
		new Set(Array.from({ length: numberOfSlots }, (_, i) => i + 1))
	)
}

/**
 * Score a slot for a given trainee.
 * Lower = better.
 */
function scoreSlot(params: {
	slot: number
	trainee: string
	traineeSchedule: Map<string, Set<SlotNumber>>
}): number {
	const { slot, trainee, traineeSchedule } = params

	let score = 0

	// prefer earlier slots slightly
	score += slot

	// penalize busy trainees
	score += (traineeSchedule.get(trainee)?.size ?? 0) * 10

	return score
}

/**
 * Run a single scheduling pass.
 */
function runSchedulingPass(input: {
	dataset: DateDataset
	availabilityMap: Map<string, Set<SlotNumber>>
	numberOfSlots: number
}): ScheduleResult {
	const { dataset, availabilityMap, numberOfSlots } = input

	const traineeSchedule = new Map<string, Set<SlotNumber>>()
	const bySchool: SchoolSlotSchedule[] = []
	const unassignedMatches: ScheduleResult['unassignedMatches'] = []

	/**
	 * 1. Sort schools by difficulty (fewest matches first)
	 */
	const schools = [...dataset.matches].sort(
		(a, b) => a.matches.length - b.matches.length,
	)

	for (const school of schools) {
		const slots: (string | null)[] = Array.from(
			{ length: numberOfSlots },
			() => null,
		)

		const schoolAvailability = getAvailability(
			availabilityMap,
			school.schoolName,
			numberOfSlots,
		)

		/**
		 * 2. Sort trainees by availability (fewest options first)
		 */
		const sortedMatches = [...school.matches].sort((a, b) => {
			const aAvail = getAvailability(availabilityMap, a, numberOfSlots).size
			const bAvail = getAvailability(availabilityMap, b, numberOfSlots).size
			return aAvail - bAvail
		})

		for (const trainee of sortedMatches) {
			const traineeAvailability = getAvailability(
				availabilityMap,
				trainee,
				numberOfSlots,
			)

			const availableSlots: number[] = []

			for (let slot = 1; slot <= numberOfSlots; slot++) {
				const isFree = slots[slot - 1] === null
				const schoolAvailable = schoolAvailability.has(slot)
				const traineeAvailable = traineeAvailability.has(slot)
				const traineeFree =
					!traineeSchedule.has(trainee) ||
					!traineeSchedule.get(trainee)!.has(slot)

				if (isFree && schoolAvailable && traineeAvailable && traineeFree) {
					availableSlots.push(slot)
				}
			}

			if (availableSlots.length === 0) {
				unassignedMatches.push({
					schoolName: school.schoolName,
					traineeName: trainee,
				})
				continue
			}

			/**
			 * 3 + 4. Pick best slot using scoring
			 */
			const bestSlot = availableSlots.sort((a, b) =>
				scoreSlot({ slot: a, trainee, traineeSchedule }) -
				scoreSlot({ slot: b, trainee, traineeSchedule }),
			)[0]!

			slots[bestSlot - 1] = trainee

			if (!traineeSchedule.has(trainee)) {
				traineeSchedule.set(trainee, new Set())
			}
			traineeSchedule.get(trainee)!.add(bestSlot)
		}

		bySchool.push({
			schoolName: school.schoolName,
			slots,
		})
	}

	/**
	 * Build trainee view
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
			traineeMap.get(trainee)![index] = school.schoolName
		})
	}

	const byTrainee: TraineeSlotSchedule[] = Array.from(
		traineeMap.entries(),
	).map(([traineeName, slots]) => ({
		traineeName,
		slots,
	}))

	return {
		bySchool,
		byTrainee,
		unassignedMatches,
	}
}

/**
 * Assign slots using multiple runs and pick best result.
 */
export function scheduleDates(input: {
	dataset: DateDataset
	overrides: AvailabilityOverride[]
	numberOfSlots: number
}): ScheduleResult {
	const { dataset, overrides, numberOfSlots } = input

	const availabilityMap = createAvailabilityMap(overrides)

	let bestResult: ScheduleResult | null = null

	const RUNS = 5

	for (let i = 0; i < RUNS; i++) {
		const result = runSchedulingPass({
			dataset,
			availabilityMap,
			numberOfSlots,
		})

		if (
			!bestResult ||
			result.unassignedMatches.length < bestResult.unassignedMatches.length
		) {
			bestResult = result
		}
	}

	return bestResult!
}