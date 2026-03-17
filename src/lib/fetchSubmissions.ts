import { z } from 'zod'
import { useQuery } from '../utils/client'
import type { Round } from '@/types/primitives'
import type { RawMatchSubmission, Submission } from '@/types/submissions'

const submissionsQuery = `
  query GetMatchSubmissions($matchingId: ID!, $round: String!) {
    matchSubmissions(
      where: { 
        year: { 
            id: { 
                equals: $matchingId 
            } 
        } 
        form: { 
            equals: $round 
        }
    }) {
      id
      form
      formFields
      school {
        id
        name
      }
      trainee {
        id
        name
      }
      createdAt
      updatedAt
      user {
        id
        email
      }
    }
  }
`

/**
 * Fetch match submissions from server for a specific matching and a specific matching round
 * @param options - object contain the matching ID and current round
 * @returns an array of submission objects
 */
export async function fetchMatchSubmissions(options: { matchingId: string; round: Round }) {
	const submissions = await useQuery<
		{ matchSubmissions: RawMatchSubmission[] },
		{ matchingId: string; round: Round }
	>(submissionsQuery, options)
	return cleanupMatchSubmissions(submissions.data.matchSubmissions)
}

/**
 * Person schema
 */
const PersonSchema = z.object({
	name: z.string().default(''),
	email: z.string().default(''),
})

/**
 * Preference schema
 */
const PreferenceSchema = z.object({
	id: z.string().default(''),
	name: z.string().default(''),

	__typename: z.enum(['School', 'Trainee']).default('School'), // 👈 enforce required output

	subjects: z.array(z.string()).optional(),

	image: z
		.object({
			url: z.string(),
		})
		.loose()
		.optional(),
})

/**
 * FormFields schema (aligned with your TS type)
 */
export const FormFieldsSchema = z.object({
	lastEditedBy: z.object({
		userId: z.string(),
		email: z.string().email(),
		name: z.string(),
	}),

	contactPhone: z.string().optional(),

	allergies: z.string().default(''),
	notes_selection: z.string().default(''),
	notes_general: z.string().default(''),

	isPresent: z
		.array(PersonSchema)
		.optional()
		.transform(
			(arr) => arr?.filter((p) => p.name), // 💥 clean garbage
		),

	preferences: z
		.array(PreferenceSchema)
		.optional()
		.transform(
			(arr) => arr?.filter((p) => p.id), // 💥 clean garbage
		),
})

/**
 * Safely parse JSON
 */
function safeParseJSON(value: string): unknown {
	try {
		return JSON.parse(value)
	} catch {
		throw new Error('Invalid JSON in formFields')
	}
}

/**
 * Clean up submissions by parsing form fields and setting default values
 * @param data Raw submissions
 * @returns Cleaned submissions
 */
export function cleanupMatchSubmissions(data: RawMatchSubmission[]): Submission[] {
	return data.map((submission) => {
		const parsed = safeParseJSON(submission.formFields)

		const result = FormFieldsSchema.safeParse(parsed)

		if (!result.success) {
			throw new Error(
				`Invalid formFields for submission ${submission.id}: ${result.error.message}`,
			)
		}

		return {
			...submission,
			formFields: result.data,
		}
	})
}
