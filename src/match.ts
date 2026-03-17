import { getRoundSettings } from './utils/helpers'
import { createLogger } from './utils/logger'
import { useEnv } from './utils/env'
import { safeAsync } from './utils/safeAsync'
import { fetchMatchSettings } from './lib/fetchSettings'
import { fetchMatchSubmissions } from './lib/fetchSubmissions'
import { createExcelMatchTable } from './lib/matches/createMatchTable'
import { createFormlists } from './lib/matches/createLists'
import { normalizeSubmissions } from './lib/matches/normalizeSubmissions'
import { buildMatchData } from './lib/matches/buildMatchData'

const { ROUND, OUTPUT_DIR, FILTER_MISSING_RECORDS } = useEnv()
const logger = createLogger()

/**
 * Script entrypoint.
 *
 * High-level flow:
 * 1. Fetch settings (defines constraints like #preferences)
 * 2. Fetch submissions (raw user input)
 * 3. Normalize data (remove/flag invalid references)
 * 4. Build match structures (core logic)
 * 5. Generate Excel outputs
 *
 * This file should stay orchestration-only (no business logic).
 */
async function main(): Promise<void> {
	/**
	 * STEP 1: Fetch matching settings
	 * Contains config like:
	 * - number of preferences
	 * - active matching round
	 */
	const { data: settings, error: settingsError } = await safeAsync(fetchMatchSettings)

	if (settingsError || !settings) {
		logger.warn('An error occurred while fetching match settings')
		logger.error(settingsError)
		process.exit(1) // hard fail → nothing else can run without this
		return
	}

	/**
	 * Resolve settings specific to the current round (day_1, day_2, final_3)
	 */
	const roundSettings = getRoundSettings(settings, ROUND)

	logger.info(
		`Running matching export for ${ROUND} (${roundSettings.school.preferences} school prefs, ${roundSettings.candidate.preferences} trainee prefs)`,
	)

	/**
	 * STEP 2: Fetch submissions
	 * These are raw CMS entries (already parsed & cleaned upstream)
	 */
	const { data: rawSubmissions, error: submissionsError } = await safeAsync(() =>
		fetchMatchSubmissions({
			matchingId: settings.currentMatching.id,
			round: ROUND,
		}),
	)

	if (submissionsError || !rawSubmissions) {
		logger.warn('An error occurred while fetching match submissions')
		logger.error(submissionsError)
		process.exit(1) // cannot proceed without input data
		return
	}

	/**
	 * STEP 3: Normalize submissions
	 *
	 * - Detect missing references (typos, deleted records, etc.)
	 * - Optionally filter them out entirely
	 *
	 * Important:
	 * This ensures matching logic works with a consistent dataset.
	 */
	const { submissions, missingTrainees, missingSchools } = normalizeSubmissions(rawSubmissions, {
		filterMissing: FILTER_MISSING_RECORDS,
	})

	/**
	 * Log data inconsistencies (but do NOT fail)
	 * These are usually caused by:
	 * - typos in preferences
	 * - deleted schools/trainees
	 */
	if (missingTrainees.size > 0) {
		logger.warn(`Missing trainees: ${Array.from(missingTrainees).join(', ')}`)
	}

	if (missingSchools.size > 0) {
		logger.warn(`Missing schools: ${Array.from(missingSchools).join(', ')}`)
	}

	/**
	 * STEP 4: Build match data
	 *
	 * Transforms submissions → structured match model:
	 * - matchesBySchool (rows)
	 * - matchesByTrainee (columns)
	 * - flattened lists for exports
	 */
	const matchData = buildMatchData(submissions)

	/**
	 * STEP 5: Generate Excel outputs
	 *
	 * - Main matching matrix (core deliverable)
	 * - Supporting lists (for logistics/manual review)
	 */
	await createExcelMatchTable(matchData, { outputDir: OUTPUT_DIR, round: ROUND })
	await createFormlists(matchData, { outputDir: OUTPUT_DIR, round: ROUND })

	/**
	 * Done 🎉
	 */
	logger.info('-'.repeat(50))
	logger.info('Finished matching script! Please check output folder')
}

await main()
