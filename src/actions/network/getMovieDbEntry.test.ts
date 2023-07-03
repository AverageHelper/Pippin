import { expectDefined, expectValueEqual } from "../../../tests/testUtils/expectations/jest.js";
import { URL } from "node:url";
import { MediaFetchError } from "../../errors/MediaFetchError.js";

// Import the unit under test
import { getMovieDbEntry } from "./getMovieDbEntry.js";

describe("Movie details", () => {
	test("throws for TV Show links", async () => {
		// It's a show, not a movie
		const url = "https://www.themoviedb.org/tv/33765-my-little-pony-friendship-is-magic";

		await expect(() => getMovieDbEntry(new URL(url))).rejects.toThrow(MediaFetchError);
	});

	test.each`
		url                                                                      | year      | id
		${"https://www.themoviedb.org/movie/96715-ruby-bridges"}                 | ${"1998"} | ${"96715"}
		${"https://www.themoviedb.org/movie/550-fight-club"}                     | ${"1999"} | ${"550"}
		${"https://www.themoviedb.org/movie/315162-puss-in-boots-the-last-wish"} | ${"2022"} | ${"315162"}
	`(
		"returns info for movie $url, $year seconds long",
		async ({ url, year, id }: { url: string; year: string; id: string }) => {
			const details = await getMovieDbEntry(new URL(url));
			expectValueEqual(details.url, url);
			expectDefined(details.year);
			expectValueEqual(details.year, year);
		}
	);
});
