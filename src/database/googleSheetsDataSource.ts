import type { GoogleSpreadsheetWorksheet } from "google-spreadsheet";
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

export type DataSource = GoogleSpreadsheet;

export type Table = GoogleSpreadsheetWorksheet;

export async function dataSource(): Promise<DataSource> {
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
