import type { URL } from "node:url";
import { MediaFetchError } from "./MediaFetchError.js";

export class NotFoundError extends MediaFetchError {
	readonly code = "404";

	constructor(url: URL) {
		super(`No media found at ${url.href}`); // TODO: i18n
		this.name = "NotFoundError";
	}
}
