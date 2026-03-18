import type { Cell } from 'write-excel-file/node'

/* ---------------------------------------------------------------------------------------------------------
 * Excel Styles
 --------------------------------------------------------------------------------------------------------- */
export const colWidth = 30
export const rowHeight = 20
export const verticalCellAlign = 'center' as const

export const matchColor = '#92D050'
export const traineeColor = '#FFFF8F'
export const schoolColor = '#79CDCD'
export const nullColor = '#ffffff'
export const headerColor = '#d2d2d2'

export const borderColor = '#180018'
export const borderStyle = 'thin' as const

export const cellStyles = {
	height: rowHeight,
	alignVertical: verticalCellAlign,
	borderColor,
	borderStyle,
} satisfies Cell

export const cellStylesWithBg = {
	...cellStyles,
	backgroundColor: headerColor,
} satisfies Cell

export const cellStylesExtraHeight = {
	height: rowHeight * 80,
	alignVertical: 'top' as const,
	borderColor,
	borderStyle,
	backgroundColor: headerColor,
} satisfies Cell

/* ---------------------------------------------------------------------------------------------------------
 * Matching Values
 --------------------------------------------------------------------------------------------------------- */

/**
 * Cell values in the matching schema that count as a valid match.
 * Values will be lowercased before checking.
 */
export const MATCH_VALUES: ReadonlySet<string> = new Set([
	'match',
	'forcematch',
	'forcedmatch',
	'forcematch',
	'forcedmatchs',
	'forcedmatchk',
	'forcedmatcht',
])
