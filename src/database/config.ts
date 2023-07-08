import type { GoogleSpreadsheetCell, GoogleSpreadsheetWorksheet } from "google-spreadsheet";
import type { QueueConfig } from "./schemas.js";
import type { ReadonlyDeep } from "type-fest";
import {
	cellWithNormalizedValue,
	getSheetWithName,
	getValueOfCellBeneath
} from "./googleSheetsDataSource.js";

const configSheetTitle = "config";
const blacklistedUsersKey = "Blacklisted Users";
const submissionMaxQuantityKey = "Submission Max Quantity";

type QueueConfigWithSuffixes<S extends string> = {
	[P in keyof QueueConfig as `${P}${S}`]: QueueConfig[P];
};
type QueueConfigButSheets = Replace<
	QueueConfigWithSuffixes<"Header">,
	keyof QueueConfigWithSuffixes<"Header">,
	GoogleSpreadsheetCell | null
>;

function getConfigSheetHeaders(sheet: GoogleSpreadsheetWorksheet): QueueConfigButSheets {
	const headerCell1 = sheet.getCellByA1("A1");
	const headerCell2 = sheet.getCellByA1("B1");
	const cells = [headerCell1, headerCell2];

	return {
		blacklistedUsersHeader: cellWithNormalizedValue(cells, blacklistedUsersKey),
		submissionMaxQuantityHeader: cellWithNormalizedValue(cells, submissionMaxQuantityKey)
	};
}

async function createConfigSheetHeaders(
	sheet: GoogleSpreadsheetWorksheet
): Promise<NonNull<QueueConfigButSheets>> {
	await sheet.clear();

	return {
		blacklistedUsersHeader: sheet.getCellByA1("A1"),
		submissionMaxQuantityHeader: sheet.getCellByA1("B1")
	};
}

export async function getQueueConfig(): Promise<QueueConfig> {
	const sheet = await getSheetWithName(configSheetTitle);
	if (!sheet) {
		return {
			blacklistedUsers: [],
			submissionMaxQuantity: null
		};
	}

	// Parse header
	const { blacklistedUsersHeader, submissionMaxQuantityHeader } = getConfigSheetHeaders(sheet);

	// Blacklist
	const blacklistedUsers = new Set<string>();
	if (blacklistedUsersHeader) {
		// Collect values from the column
		const col = blacklistedUsersHeader.a1Column;
		let row = blacklistedUsersHeader.a1Row + 1;

		let { value } = sheet.getCellByA1(`${col}${row}`);
		while (value) {
			value = sheet.getCellByA1(`${col}${row}`).value;
			if (typeof value === "string") {
				blacklistedUsers.add(value);
			} else if (typeof value === "number") {
				blacklistedUsers.add(`${value}`);
			}
			row += 1;
		}
	}

	// Submission Max Quantity
	let submissionMaxQuantity: number | null = null;
	if (submissionMaxQuantityHeader) {
		const value = getValueOfCellBeneath(sheet, submissionMaxQuantityHeader);
		if (typeof value === "number") {
			submissionMaxQuantity = value;
		}
	}

	return {
		blacklistedUsers: Array.from(blacklistedUsers),
		submissionMaxQuantity
	};
}

/**
 * Writes the given queue config to the database.
 */
export async function saveQueueConfig(newConfig: ReadonlyDeep<QueueConfig>): Promise<void> {
	const sheet = await getSheetWithName(configSheetTitle, true);

	// Parse header
	const {
		blacklistedUsersHeader, //
		submissionMaxQuantityHeader
	} = await createConfigSheetHeaders(sheet);

	// Populate blacklist
	const blacklistedUsers = new Set(newConfig.blacklistedUsers);
	const col = blacklistedUsersHeader.a1Column;
	let row = blacklistedUsersHeader.a1Row + 1;
	for (const userId of blacklistedUsers) {
		const valueCell = sheet.getCellByA1(`${col}${row}`);
		valueCell.value = userId;
		await valueCell.save();
		row += 1;
	}

	// Populate submission limit
	{
		const col = submissionMaxQuantityHeader.a1Column;
		const row = submissionMaxQuantityHeader.a1Row + 1;
		const submissionMaxQuantityValue = sheet.getCellByA1(`${col}${row}`);
		submissionMaxQuantityValue.value = newConfig.submissionMaxQuantity ?? "";
		await submissionMaxQuantityValue.save();
	}
}
