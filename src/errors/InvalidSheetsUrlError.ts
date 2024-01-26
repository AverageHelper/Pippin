export class InvalidSheetsUrlError extends Error {
	readonly code = "422";

	constructor(url: URL) {
		super(`This URL isn't a valid Google Sheets URL: ${url.href}`); // TODO: i18n
		this.name = "InvalidSheetsUrlError";
	}
}
