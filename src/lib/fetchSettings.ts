import { useQuery } from '../utils/client'
import type { MatchingConfig } from '@/types/matchConfig'

const settingsQuery = `
    query {
        matchSetting {
            id
            slotSettings
            currentMatching {
                id
            }
        }
    }
`

/**
 * Fetches the match settings from the server.
 * @returns The match settings.
 */
export async function fetchMatchSettings() {
	const settings = await useQuery<{ matchSetting: MatchingConfig }>(settingsQuery)
	return settings.data.matchSetting
}
