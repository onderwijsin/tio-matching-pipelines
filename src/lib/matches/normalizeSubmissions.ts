import type { Submission } from 'types/submissions'

/**
 * Normalize submissions by removing references to missing entities
 * @param submissions - Array of submissions to normalize
 * @param options - Options for normalization
 * @param options.filterMissing - Whether to filter out missing entities
 * @returns Normalized submissions and sets of missing entities
 */
export function normalizeSubmissions(
	submissions: Submission[],
	options: { filterMissing: boolean },
) {
	const missingTrainees = new Set<string>()
	const missingSchools = new Set<string>()

	const traineeIds = new Set(submissions.filter((s) => s.trainee).map((s) => s.trainee!.id))

	const schoolIds = new Set(submissions.filter((s) => s.school).map((s) => s.school!.id))

	const normalized = submissions.map((submission) => {
		const prefs = submission.formFields.preferences ?? []

		const filteredPrefs = prefs.filter((pref) => {
			if (submission.school) {
				const exists = traineeIds.has(pref.id)
				if (!exists) missingTrainees.add(pref.name)
				return options.filterMissing ? exists : true
			}

			if (submission.trainee) {
				const exists = schoolIds.has(pref.id)
				if (!exists) missingSchools.add(pref.name)
				return options.filterMissing ? exists : true
			}

			return true
		})

		return {
			...submission,
			formFields: {
				...submission.formFields,
				preferences: filteredPrefs,
			},
		}
	})

	return { submissions: normalized, missingTrainees, missingSchools }
}
