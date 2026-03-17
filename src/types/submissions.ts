export interface Trainee {
	id: string
	name: string
}

export interface User {
	id: string
	email: string
}

export interface School {
	id: string
	name: string
}

/**
 * Root raw submission object
 */
export interface RawMatchSubmission {
	id: string
	form: string
	formFields: string // ⚠️ JSON string, NOT parsed yet
	school: School | null
	trainee: Trainee | null
	createdAt: string
	updatedAt: string
	user: User | null
}

export interface Preference {
	id: string
	name: string
	__typename: 'School' | 'Trainee'
	subjects?: string[]
	image?: Image
}

export interface Image {
	url: string
	secure_url?: string

	width?: number
	height?: number
	format?: string

	public_id?: string
	version?: number

	resource_type?: string

	// allow unknown junk without breaking
	[key: string]: unknown
}

/**
 * Parsed formFields JSON
 */
export interface FormFields {
	lastEditedBy: {
		userId: string
		email: string
		name: string
	}

	allergies: string
	notes_selection: string
	notes_general: string
	contactPhone?: string

	isPresent?: {
		name: string
		email: string
	}[]

	preferences?: Preference[]
}

export interface Submission extends Omit<RawMatchSubmission, 'formFields'> {
	formFields: FormFields
}
