import type { URL } from "node:url";
import type { MediaDetails } from "../getMediaDetails.js";

/**
 * Gets information about a movie from TheMovieDB.
 *
 * @param url The media URL to check.
 *
 * @throws an error if metadata couldn't be found on the webpage pointed to by the
 * provided `url`, or a `MediaFetchError` if no media year or title could be
 * found in that metadata.
 * @returns a `Promise` that resolves with the track details.
 */
export async function getMovieDbEntry(url: URL, timeoutSeconds?: number): Promise<MediaDetails> {
	// TODO: Query TheMovieDB for info, respecting the given `timeoutSeconds`

	return await Promise.resolve({
		url: url.href,
		title: "404",
		year: "2023"
	});
}
