import type { Submission } from './submissions'

/**
 * Generic match reference used for both school-side and trainee-side matches.
 */
export interface MatchRef {
	/** ID of the matched entity (school or trainee) */
	id: string

	/** Display name of the matched entity */
	name?: string

	/** Priority index (1-based) */
	priority: number
}

/**
 * Match reference from school perspective (points to trainee).
 */
export type SchoolSideMatch = MatchRef

/**
 * Match reference from trainee perspective (points to school).
 */
export type TraineeSideMatch = MatchRef

/**
 * Generic match row used to build matrix data.
 */
export interface MatchRow<TMatch extends MatchRef = MatchRef> {
	/** ID of the base entity (school or trainee) */
	id: string

	/** Name of the base entity */
	name: string

	/** One-sided matches */
	singleSideMatches: TMatch[]

	/** Mutual matches */
	doubleSideMatches: TMatch[]

	/** Optional comment field */
	comments: string
}

/**
 * Match row from school perspective.
 */
export type MatchBySchool = MatchRow<SchoolSideMatch>

/**
 * Match row from trainee perspective.
 */
export type MatchByTrainee = MatchRow<TraineeSideMatch>

/**
 * Base list item shared between school and trainee exports.
 */
export interface BaseListItem {
	/** Name of the entity */
	name: string

	/** Allergies or dietary restrictions */
	allergies: string

	/** General notes */
	notes_general: string

	/** Comma-separated preference names */
	preferences: string
}

/**
 * Flattened school list row used for export.
 */
export interface SchoolListItem extends BaseListItem {
	/** Contact phone number */
	contactPhone: string

	/** Comma-separated list of present attendees */
	isPresent: string
}

/**
 * Flattened trainee list row used for export.
 */
export type TraineeListItem = BaseListItem

/**
 * Aggregated match output used by Excel generators.
 */
export interface MatchResult {
	matchesBySchool: MatchBySchool[]
	matchesByTrainee: MatchByTrainee[]
	traineelist: TraineeListItem[]
	schoollist: SchoolListItem[]
}

/**
 * Submission guaranteed to contain a school.
 */
export type SchoolSubmission = Submission & {
	school: NonNullable<Submission['school']>
}

/**
 * Submission guaranteed to contain a trainee.
 */
export type TraineeSubmission = Submission & {
	trainee: NonNullable<Submission['trainee']>
}
