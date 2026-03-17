/**
 * ISO date string (e.g. 2026-03-24 or full datetime)
 */
type ISODateString = string

/**
 * Time range string (e.g. "09:00-12:00")
 */
type TimeRange = string

/**
 * Deadline configuration
 */
export interface Deadline {
	deadline: ISODateString
	visibleDeadline: string
}

/**
 * Deadlines per role
 */
export interface Deadlines {
	school: Deadline
	candidate: Deadline
}

/**
 * School configuration per slot
 */
export interface SchoolConfig {
	seats?: number
	preferences: number
}

/**
 * Candidate configuration per slot
 */
export interface CandidateConfig {
	preferences: number
}

/**
 * Base structure shared by all slot settings
 */
export interface BaseSlotSetting {
	date: ISODateString
	school: SchoolConfig
	candidate: CandidateConfig
	deadlines: Deadlines
}

/**
 * Slot setting with sessions (day_1, day_2)
 */
export interface SlotSettingWithSessions extends BaseSlotSetting {
	slots: number
	sessions: TimeRange[]
	slot_duration: number
}

/**
 * Final round slot setting (final_3)
 */
export type FinalSlotSetting = BaseSlotSetting

/**
 * Explicit slot settings structure
 */
export interface SlotSettings {
	day_1: SlotSettingWithSessions
	day_2: SlotSettingWithSessions
	final_3: FinalSlotSetting
}

/**
 * Current matching reference
 */
export interface CurrentMatching {
	id: string
}

/**
 * Root object
 */
export interface MatchingConfig {
	id: string
	slotSettings: SlotSettings
	currentMatching: CurrentMatching
}
