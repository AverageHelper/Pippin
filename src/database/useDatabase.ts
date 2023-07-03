import type { MovieSuggestion, Preferences, QueueConfig } from "./schemas.js";
import type { Table } from "./googleSheetsDataSource.js";
import { dataSource } from "./googleSheetsDataSource.js";

interface RowTypes {
	Suggestions: MovieSuggestion;
	Preferences: Preferences;
	Config: QueueConfig;
}

type TableName = keyof RowTypes;

/**
 * Calls a given callback with a CRUD interface for working with a database table.
 *
 * @param table A string that identifies the database table on which to operate.
 * @param cb A callback that receives a CRUD interface for the given `table` key.
 * @returns A `Promise` that resolves with the value returned by the callback.
 */
export async function useRepository<Entity extends TableName, T = undefined>(
	tableName: Lowercase<Entity>,
	cb: (table: Table) => T | Promise<T>
): Promise<T> {
	const doc = await dataSource();
	const sheet = doc.sheetsByTitle[tableName] ?? (await doc.addSheet({ title: tableName }));
	return await cb(sheet);
}
