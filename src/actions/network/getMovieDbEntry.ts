import type { MediaDetails } from "../getMediaDetails.js";
import { requireEnv } from "../../helpers/environment.js";
import { MediaFetchError } from "../../errors/MediaFetchError.js";
import { assert, boolean, integer, string, type } from "superstruct";
import { isArrayOfLength } from "../../helpers/guards.js";

const theMovieDbResponse = type({
	adult: boolean(),
	id: integer(),
	original_title: string(),
	overview: string(),
	release_date: string(), // ex. "1998-01-18"
	runtime: integer(), // in minutes
	title: string()
});

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
	// Make sure the domain is one we support
	if (!url.origin.toLowerCase().endsWith("themoviedb.org")) {
		throw new MediaFetchError(
			"Unsupported data platform. Please use a URL from https://themoviedb.org"
		); // TODO: I18N
	}

	// Make sure the path segment is what we expect
	const EXPECTED_SEGMENTS = 2;
	const pathSegments = url.pathname.split("/").filter(s => s);
	if (!isArrayOfLength(pathSegments, EXPECTED_SEGMENTS)) {
		throw new MediaFetchError(
			`URL path has too many segments. Expected ${EXPECTED_SEGMENTS}, got: ${pathSegments.length}`
		); // TODO: I18N
	}

	// Make sure the user is asking about a movie, not a TV show
	const EXPECTED_TYPE = "movie";
	const [type, id] = pathSegments;
	if (type !== EXPECTED_TYPE) {
		throw new MediaFetchError(`Expected media of type '${EXPECTED_TYPE}', got: ${type}`); // TODO: I18N
	}

	const key = requireEnv("THE_MOVIE_DB_API_KEY");

	// See https://developer.themoviedb.org/docs/search-and-query-for-details#query-for-details
	const movieDetails = new URL(`https://api.themoviedb.org/3/movie/${id}`);
	movieDetails.searchParams.set("api_key", key);

	try {
		const signal = AbortSignal.timeout(timeoutSeconds ?? 30_000);
		const result = await fetch(movieDetails, { signal });

		const data: unknown = await result.json();
		assert(data, theMovieDbResponse);

		const year = data.release_date.split("-")[0] ?? "";

		return {
			title: data.title,
			url: new URL(`https://www.themoviedb.org/movie/${data.id}`),
			year
		};
	} catch (error) {
		throw new MediaFetchError(error);
	}
}
