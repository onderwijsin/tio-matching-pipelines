import type {
	TraineeSideMatch,
	MatchResult,
	MatchBySchool,
	MatchByTrainee,
	TraineeListItem,
	SchoolListItem,
} from '@/types/matches'
import type { Preference, Submission } from 'types/submissions'
import { sortByName } from '../../utils/helpers'

/**
 * Internal entity representation used during matching.
 */
interface Entity {
	id: string
	name: string
	submission?: Submission
}

/**
 * Formats a preference into a readable string.
 *
 * @param pref - The preference object
 * @returns Formatted preference string
 */
function formatPreference(pref: Preference): string {
	if (!pref.subjects || pref.subjects.length === 0) return pref.name
	return `${pref.name} (${pref.subjects.join(', ')})`
}

/**
 * Builds a map of entity id → submission for fast lookup.
 *
 * @param submissions - All submissions
 * @param type - Whether to extract trainee or school submissions
 * @returns Map of entity id → submission
 */
function buildSubmissionMap(
	submissions: Submission[],
	type: 'trainee' | 'school',
): Map<string, Submission> {
	const map = new Map<string, Submission>()

	for (const s of submissions) {
		if (type === 'trainee' && s.trainee) {
			map.set(s.trainee.id, s)
		}
		if (type === 'school' && s.school) {
			map.set(s.school.id, s)
		}
	}

	return map
}

/**
 * Builds entity maps (id → name) from submissions and inferred preferences.
 *
 * @param submissions - All submissions
 * @returns Maps for trainees and schools
 */
function buildEntityMaps(submissions: Submission[]) {
	const traineeMap = new Map<string, string>()
	const schoolMap = new Map<string, string>()

	for (const s of submissions) {
		if (s.trainee) {
			traineeMap.set(s.trainee.id, s.trainee.name)
		}
		if (s.school) {
			schoolMap.set(s.school.id, s.school.name)
		}

		// infer missing entities from preferences
		for (const pref of s.formFields.preferences ?? []) {
			if (s.school) traineeMap.set(pref.id, pref.name)
			if (s.trainee) schoolMap.set(pref.id, pref.name)
		}
	}

	return { traineeMap, schoolMap }
}

/**
 * Builds match relations for a given entity.
 *
 * @param entity - Source entity
 * @param targetMap - Lookup map for targets
 * @returns Single-sided and double-sided matches
 */
function buildMatches(params: { entity: Entity; targetMap: Map<string, Entity> }): {
	doubleSideMatches: (TraineeSideMatch  )[]
	singleSideMatches: (TraineeSideMatch  )[]
} {
	const { entity, targetMap } = params

	const prefs = entity.submission?.formFields.preferences ?? []

	const doubleSideMatches: (TraineeSideMatch  )[] = []
	const singleSideMatches: (TraineeSideMatch  )[] = []

	for (const [index, pref] of prefs.entries()) {
		const target = targetMap.get(pref.id)
		if (!target) continue

		const targetPrefs = target.submission?.formFields.preferences ?? []

		const isDoubleSided = targetPrefs.some((p) => p.id === entity.id)

		const match = {
			id: target.id,
			name: target.name,
			priority: index + 1,
		}

		if (isDoubleSided) doubleSideMatches.push(match)
		else singleSideMatches.push(match)
	}

	return { doubleSideMatches, singleSideMatches }
}

/**
 * Build school and trainee match data from submissions.
 *
 * Transforms raw submission data into:
 * - match relations (school ↔ trainee)
 * - flattened export lists
 *
 * This function is deterministic and does not mutate input.
 *
 * @param submissions - Cleaned submissions
 * @returns Match data for excel generation
 */
export function buildMatchData(submissions: Submission[]): MatchResult {
	/**
	 * STEP 1: Build entity + submission maps
	 */
	const { traineeMap, schoolMap } = buildEntityMaps(submissions)

	const traineeSubmissionMap = buildSubmissionMap(submissions, 'trainee')
	const schoolSubmissionMap = buildSubmissionMap(submissions, 'school')

	/**
	 * STEP 2: Build entity arrays
	 */
	const traineeEntities: Entity[] = Array.from(traineeMap.entries()).map(([id, name]) => ({
		id,
		name,
		submission: traineeSubmissionMap.get(id),
	}))

	const schoolEntities: Entity[] = Array.from(schoolMap.entries()).map(([id, name]) => ({
		id,
		name,
		submission: schoolSubmissionMap.get(id),
	}))

	sortByName(traineeEntities)
	sortByName(schoolEntities)

	/**
	 * STEP 3: Build lookup maps (O(1) access)
	 */
	const traineeEntityMap = new Map(traineeEntities.map((t) => [t.id, t]))
	const schoolEntityMap = new Map(schoolEntities.map((s) => [s.id, s]))

	/**
	 * STEP 4: Build outputs
	 */
	const matchesBySchool: MatchBySchool[] = []
	const matchesByTrainee: MatchByTrainee[] = []
	const traineelist: TraineeListItem[] = []
	const schoollist: SchoolListItem[] = []

	/**
	 * Schools → matches + export list
	 */
	for (const school of schoolEntities) {
		const submission = school.submission
		const prefs = submission?.formFields.preferences ?? []

		const { doubleSideMatches, singleSideMatches } = buildMatches({
			entity: school,
			targetMap: traineeEntityMap,
		})

		schoollist.push({
			name: school.name,
			contactPhone: submission?.formFields.contactPhone ?? '',
			allergies: submission?.formFields.allergies ?? '',
			notes_general: submission?.formFields.notes_general ?? '',
			isPresent:
				submission?.formFields.isPresent?.map((p) => `${p.name} <${p.email}>`).join(', ') ??
				'',
			preferences: prefs.map(formatPreference).join(', '),
		})

		matchesBySchool.push({
			id: school.id,
			name: school.name,
			singleSideMatches,
			doubleSideMatches,
			comments: submission?.formFields.notes_selection ?? '',
		})
	}

	/**
	 * Trainees → matches + export list
	 */
	for (const trainee of traineeEntities) {
		const submission = trainee.submission
		const prefs = submission?.formFields.preferences ?? []

		const { doubleSideMatches, singleSideMatches } = buildMatches({
			entity: trainee,
			targetMap: schoolEntityMap,
		})

		traineelist.push({
			name: trainee.name,
			allergies: submission?.formFields.allergies ?? '',
			notes_general: submission?.formFields.notes_general ?? '',
			preferences: prefs.map(formatPreference).join(', '),
		})

		matchesByTrainee.push({
			id: trainee.id,
			name: trainee.name,
			singleSideMatches,
			doubleSideMatches,
			comments: submission?.formFields.notes_selection ?? '',
		})
	}

	return {
		matchesBySchool,
		matchesByTrainee,
		traineelist,
		schoollist,
	}
}
