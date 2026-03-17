/**
 * A human-readable school name as it appears in the Excel exports.
 */
export type SchoolName = string

/**
 * A human-readable trainee name as it appears in the Excel exports.
 */
export type TraineeName = string

/**
 * Slot numbers are 1-based in this domain.
 * Example: slot 1 = first speed date slot.
 */
export type SlotNumber = number

/**
 * Override type for manual availability constraints.
 */
export type AvailabilityOverrideType = 'school' | 'trainee'

/**
 * A parsed school row from the matching schema.
 * Represents one school and all trainees matched to that school.
 */
export interface SchoolMatch {
	/**
	 * The school name taken from the first column of the matching schema row.
	 */
	schoolName: SchoolName

	/**
	 * Ordered trainee names extracted from matching cells in the row.
	 */
	matches: TraineeName[]
}

/**
 * The complete dataset required to generate dates and slot exports.
 */
export interface DateDataset {
	/**
	 * School-to-trainee match relations parsed from the matching schema.
	 */
	matches: SchoolMatch[]

	/**
	 * All trainee names known from submissions.
	 */
	trainees: TraineeName[]

	/**
	 * All school names known from submissions.
	 */
	schools: SchoolName[]
}

/**
 * A manual availability override for either a school or a trainee.
 */
export interface AvailabilityOverride {
	/**
	 * Entity name as used in the source data.
	 */
	name: string

	/**
	 * Whether this override applies to a school or trainee.
	 */
	type: AvailabilityOverrideType

	/**
	 * 1-based slot numbers where the entity is available.
	 */
	availability: SlotNumber[]
}

/**
 * Fast lookup structure for availability rules.
 */
export interface AvailabilityRule {
	/**
	 * Entity type.
	 */
	type: AvailabilityOverrideType

	/**
	 * The set of slots this entity is available in.
	 */
	availability: ReadonlySet<SlotNumber>
}

/**
 * Slot assignment row for a school.
 * Example: a school with its assigned trainee per slot.
 */
export interface SchoolSlotSchedule {
	/**
	 * School name for this row.
	 */
	schoolName: SchoolName

	/**
	 * Assigned trainee per slot, in slot order.
	 * Null means the slot is unassigned.
	 */
	slots: (TraineeName | null)[]
}

/**
 * Slot assignment row for a trainee.
 * Example: a trainee with its assigned school per slot.
 */
export interface TraineeSlotSchedule {
	/**
	 * Trainee name for this row.
	 */
	traineeName: TraineeName

	/**
	 * Assigned school per slot, in slot order.
	 * Null means the slot is unassigned.
	 */
	slots: (SchoolName | null)[]
}

/**
 * Result of the scheduling engine.
 */
export interface ScheduleResult {
	/**
	 * Slot schedule grouped by school.
	 */
	bySchool: SchoolSlotSchedule[]

	/**
	 * Slot schedule grouped by trainee.
	 */
	byTrainee: TraineeSlotSchedule[]

	/**
	 * Matches that could not be scheduled into any slot.
	 */
	unassignedMatches: {
		schoolName: SchoolName
		traineeName: TraineeName
	}[]
}
