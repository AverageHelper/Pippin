import { isError } from "../helpers/isError.js";

export class MediaFetchError extends Error {
	readonly code: string;

	constructor(error: unknown) {
		super("Unknown error"); // TODO: i18n
		this.name = "MediaFetchError";

		if (isError(error)) {
			this.message = error.message;
			this.code = error.code ?? "500";
			this.stack = error.stack;
		} else {
			this.message = JSON.stringify(error);
			this.code = "500";
		}
	}
}
