import type { GoogleSpreadsheetCell, GoogleSpreadsheetWorksheet } from "google-spreadsheet";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { requireEnv } from "../helpers/environment";
import { useLogger } from "../logger.js";
import { URL } from "node:url";

const logger = useLogger();

// TODO: Parse the sheets URL, get the sheet ID

// Initialize the sheet
const DATABASE_SHEET_URL = new URL(requireEnv("DATABASE_SHEET_URL"));
const sheetId = "";
logger.debug(`Database Sheet ID: '${sheetId}'`);

let doc: GoogleSpreadsheet | null = new GoogleSpreadsheet(sheetId);

type DataSource = GoogleSpreadsheet;

async function dataSource(): Promise<DataSource> {
	if (doc) {
		// Load doc properties and worksheets
		await doc.loadInfo();
		return doc;
	}

	// Initialize the sheet
	doc = new GoogleSpreadsheet(sheetId);

	// Initialize Auth (See https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication)
	await doc.useServiceAccountAuth({
		client_email: "",
		private_key: ""
	});

	// Load doc properties and worksheets
	await doc.loadInfo();
	logger.debug(`Loading info from database doc at ${DATABASE_SHEET_URL.href}`);

	return doc;
}

/**
 * Returns an existing sheet with the given title. If `create` is set, and no sheet yet exists
 * with the given title, then a new one will be created and returned.
 */
export async function getSheetWithName(
	title: string,
	create: true
): Promise<GoogleSpreadsheetWorksheet>;
export async function getSheetWithName(
	title: string,
	create?: boolean
): Promise<GoogleSpreadsheetWorksheet | null>;
export async function getSheetWithName(
	title: string,
	create: boolean = false
): Promise<GoogleSpreadsheetWorksheet | null> {
	const doc = await dataSource();
	let sheet = doc.sheetsByTitle[title] ?? null;
	if (!sheet && create) {
		sheet = await doc.addSheet({ title });
	}
	return sheet;
}

function cellHasNormalizedValue(cell: GoogleSpreadsheetCell, value: string): boolean {
	return typeof cell.value === "string" && cell.value.toLowerCase() === value.toLowerCase();
}

/**
 * From a given array of cells, returns one whose value matches the given value.
 */
export function cellWithNormalizedValue(
	cells: ReadonlyArray<GoogleSpreadsheetCell>,
	value: string
): GoogleSpreadsheetCell | null {
	return cells.find(cell => cellHasNormalizedValue(cell, value)) ?? null;
}

/**
 * Returns the value of the cell at the given `row` beneath the given cell in the given sheet.
 */
export function getValueOfCellAtRowInColumn(
	sheet: GoogleSpreadsheetWorksheet,
	header: GoogleSpreadsheetCell,
	row: number
): string | number | boolean {
	const col = header.a1Column;
	const { value } = sheet.getCellByA1(`${col}${row}`);
	return value;
}

/**
 * Returns the value of the cell directly beneath the given cell in the given sheet.
 */
export function getValueOfCellBeneath(
	sheet: GoogleSpreadsheetWorksheet,
	cell: GoogleSpreadsheetCell
): string | number | boolean {
	return getValueOfCellAtRowInColumn(sheet, cell, cell.a1Row + 1);
}

/**
 * Overwrites the cell in the given sheet at the given row with the given value.
 */
export async function setValueOfCellAtRowInColumn(
	sheet: GoogleSpreadsheetWorksheet,
	header: GoogleSpreadsheetCell,
	row: number,
	value: string | number | boolean
): Promise<void> {
	const col = header.a1Column;
	const cell = sheet.getCellByA1(`${col}${row}`);
	cell.value = value;
	await cell.save();
}
