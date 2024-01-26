import type { GoogleSpreadsheetCell, GoogleSpreadsheetWorksheet } from "google-spreadsheet";
import type { MovieSuggestion } from "./schemas.js";
import type { ReadonlyDeep } from "type-fest";
import { richErrorMessage } from "../helpers/richErrorMessage.js";
import { useLogger } from "../logger.js";
import {
	cellWithNormalizedValue,
	getSheetWithName,
	getValueOfCellAtRowInColumn,
	setValueOfCellAtRowInColumn
} from "./googleSheetsDataSource.js";

const logger = useLogger();

const suggestionsSheetTitle = "suggestions";
const urlKey = "URL";
const theMovieDbIdKey = "TMDB ID";
const titleKey = "Title";
const yearKey = "Year";
const sentAtKey = "Submitted At";
const sentByKey = "Submitted By";

type MovieSuggestionWithSuffixes = {
	[P in keyof MovieSuggestion as `${P}Header`]: MovieSuggestion[P];
};
type MovieSuggestionButSheets = Replace<
	MovieSuggestionWithSuffixes,
	keyof MovieSuggestionWithSuffixes,
	GoogleSpreadsheetCell | null
>;

function getQueueSheetHeaders(sheet: GoogleSpreadsheetWorksheet): MovieSuggestionButSheets {
	const headerCell1 = sheet.getCellByA1("A1");
	const headerCell2 = sheet.getCellByA1("B1");
	const headerCell3 = sheet.getCellByA1("C1");
	const headerCell4 = sheet.getCellByA1("D1");
	const headerCell5 = sheet.getCellByA1("E1");
	const headerCell6 = sheet.getCellByA1("F1");
	const cells = [headerCell1, headerCell2, headerCell3, headerCell4, headerCell5, headerCell6];

	return {
		urlHeader: cellWithNormalizedValue(cells, urlKey),
		theMovieDbIdHeader: cellWithNormalizedValue(cells, theMovieDbIdKey),
		titleHeader: cellWithNormalizedValue(cells, titleKey),
		yearHeader: cellWithNormalizedValue(cells, yearKey),
		sentAtHeader: cellWithNormalizedValue(cells, sentAtKey),
		sentByHeader: cellWithNormalizedValue(cells, sentByKey)
	};
}

async function createQueueSheetHeaders(
	sheet: GoogleSpreadsheetWorksheet
): Promise<NonNull<MovieSuggestionButSheets>> {
	await sheet.clear();

	return {
		urlHeader: sheet.getCellByA1("A1"),
		theMovieDbIdHeader: sheet.getCellByA1("B1"),
		titleHeader: sheet.getCellByA1("C1"),
		yearHeader: sheet.getCellByA1("D1"),
		sentAtHeader: sheet.getCellByA1("E1"),
		sentByHeader: sheet.getCellByA1("F1")
	};
}

function getSuggestionAtRow(
	sheet: GoogleSpreadsheetWorksheet,
	row: number
): MovieSuggestion | null {
	// Parse header
	const {
		urlHeader, //
		theMovieDbIdHeader,
		titleHeader,
		yearHeader,
		sentAtHeader,
		sentByHeader
	} = getQueueSheetHeaders(sheet);

	if (
		!urlHeader ||
		!theMovieDbIdHeader ||
		!titleHeader ||
		!yearHeader ||
		!sentAtHeader ||
		!sentByHeader
	) {
		return null;
	}

	// URL
	let url: URL;
	try {
		const rawUrl = getValueOfCellAtRowInColumn(sheet, urlHeader, row);
		url = new URL(rawUrl.toString());
	} catch (error) {
		logger.error(
			richErrorMessage(`Failed to parse URL in entry at row ${row} due to error:`, error)
		);
		return null;
	}

	// TMDB ID
	const theMovieDbId = getValueOfCellAtRowInColumn(sheet, theMovieDbIdHeader, row).toString();

	// Title
	const title = getValueOfCellAtRowInColumn(sheet, titleHeader, row).toString();

	// Year
	const year = getValueOfCellAtRowInColumn(sheet, yearHeader, row).toString();

	// Sent at
	const sentAtRaw = getValueOfCellAtRowInColumn(sheet, sentAtHeader, row).toString();
	const sentAt = new Date(sentAtRaw);

	// Sent by
	const sentBy = getValueOfCellAtRowInColumn(sheet, sentByHeader, row).toString();

	return {
		url,
		theMovieDbId,
		title,
		year,
		sentAt,
		sentBy
	};
}

function getSuggestionQueueWithSheet(sheet: GoogleSpreadsheetWorksheet): Array<MovieSuggestion> {
	const suggestions: Array<MovieSuggestion> = [];
	let latest: MovieSuggestion | null = getSuggestionAtRow(sheet, 1);
	if (latest) {
		suggestions.push(latest);
	}
	while (latest !== null) {
		latest = getSuggestionAtRow(sheet, suggestions.length);
		if (latest) {
			suggestions.push(latest);
		}
	}

	return suggestions;
}

export async function getSuggestionQueue(): Promise<Array<MovieSuggestion>> {
	const sheet = await getSheetWithName(suggestionsSheetTitle);
	if (!sheet) return [];

	return getSuggestionQueueWithSheet(sheet);
}

async function setEntryAtIndex(
	index: number,
	sheet: GoogleSpreadsheetWorksheet,
	newEntry: ReadonlyDeep<MovieSuggestion>
): Promise<void> {
	// Parse header
	let {
		urlHeader, //
		theMovieDbIdHeader,
		titleHeader,
		yearHeader,
		sentAtHeader,
		sentByHeader
	} = getQueueSheetHeaders(sheet);

	if (
		!urlHeader ||
		!theMovieDbIdHeader ||
		!titleHeader ||
		!yearHeader ||
		!sentAtHeader ||
		!sentByHeader
	) {
		// Missing a header? Throw out the database!
		const headers = await createQueueSheetHeaders(sheet);
		urlHeader = headers.urlHeader;
		theMovieDbIdHeader = headers.theMovieDbIdHeader;
		titleHeader = headers.titleHeader;
		yearHeader = headers.yearHeader;
		sentAtHeader = headers.sentAtHeader;
		sentByHeader = headers.sentByHeader;
	}

	// Offset by 1 for header row
	const row = index + 1;

	// URL
	await setValueOfCellAtRowInColumn(sheet, urlHeader, row, newEntry.url.href);

	// TMDB ID
	await setValueOfCellAtRowInColumn(sheet, theMovieDbIdHeader, row, newEntry.theMovieDbId);

	// Title
	await setValueOfCellAtRowInColumn(sheet, titleHeader, row, newEntry.title);

	// Year
	await setValueOfCellAtRowInColumn(sheet, yearHeader, row, newEntry.year);

	// Sent at
	await setValueOfCellAtRowInColumn(sheet, sentAtHeader, row, newEntry.sentAt.toUTCString());

	// Sent by
	await setValueOfCellAtRowInColumn(sheet, sentByHeader, row, newEntry.sentBy);
}

export async function upsertEntryInQueue(
	newEntry: ReadonlyDeep<MovieSuggestion>
): Promise<MovieSuggestion> {
	const sheet = await getSheetWithName(suggestionsSheetTitle, true);
	const allEntries = getSuggestionQueueWithSheet(sheet);
	const index = allEntries.findIndex(entry => entry.theMovieDbId === newEntry.theMovieDbId);

	if (index === -1) {
		// New entry! Append to end
		await setEntryAtIndex(allEntries.length, sheet, newEntry);
	} else {
		// Old entry! Update existing
		await setEntryAtIndex(index, sheet, newEntry);
	}

	return { ...newEntry };
}
