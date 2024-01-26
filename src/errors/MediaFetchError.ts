import { StructError } from "superstruct";
import { isError } from "../helpers/isError.js";

export class MediaFetchError extends Error {
	readonly code: string;

	constructor(error: unknown) {
		super("Unknown error"); // TODO: i18n
		this.name = "MediaFetchError";

		if (error instanceof StructError) {
			this.message = `Unexpected response type from TheMovieDb: ${error.message}`; // TODO: I18N
			this.code = "unexpected-server-response";
			this.stack = error.stack;
		} else if (isError(error)) {
			this.message = error.message;
			this.code = error.code ?? "500";
			this.stack = error.stack;
		} else if (typeof error === "string") {
			this.message = error;
			this.code = "500";
		} else {
			this.message = JSON.stringify(error);
			this.code = "500";
		}
	}
}
