import type { Logger } from "../logger.js";
import { getMovieDbEntry } from "./network/getMovieDbEntry.js";
import { richErrorMessage } from "../helpers/richErrorMessage.js";
import { useLogger } from "../logger.js";

export interface MediaDetails {
	url: URL;
	title: string;
	year: string;
}

/**
 * Retrieves details about a piece of media.
 *
 * @param urlOrString The location of an online media record. If the URL is
 * a TheMovieDB link, media details are retrieved directly. If the value is a
 * string, only the substring up to (but not including) the first whitespace
 * is considered.
 * @param logger The place to report errors.
 *
 * @returns a details about the media, or `null` if no media could be
 * found from the provided query.
 */
export async function getMediaDetails(
	urlOrString: URL | string,
	logger: Logger | null = useLogger()
): Promise<MediaDetails | null> {
	try {
		const url: URL =
			typeof urlOrString === "string" ? new URL(urlOrString.split(/\s+/u)[0] ?? "") : urlOrString;
		return await getMovieDbEntry(url); // If we add more sources, consider `Promise.all` here
	} catch (error) {
		logger?.error(
			richErrorMessage(`Failed to fetch media using url '${urlOrString.toString()}'`, error)
		);
		return null;
	}
}
