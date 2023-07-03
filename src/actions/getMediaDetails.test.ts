import type { MediaDetails } from "./getMediaDetails.js";
import { URL } from "node:url";
import { MediaFetchError } from "../errors/MediaFetchError.js";

jest.mock("./network/getBandcampTrack.js", () => ({ getBandcampTrack: jest.fn() }));
jest.mock("./network/getPonyFmTrack.js", () => ({ getPonyFmTrack: jest.fn() }));
jest.mock("./network/getSoundCloudTrack.js", () => ({ getSoundCloudTrack: jest.fn() }));
jest.mock("./network/getYouTubeVideo.js", () => ({ getYouTubeVideo: jest.fn() }));

import { getMovieDbEntry } from "./network/getMovieDbEntry.js";
const mockGetMovieDbEntry = getMovieDbEntry as jest.Mock<Promise<MediaDetails>, [URL]>;

import { getMediaDetails } from "./getMediaDetails.js";

describe("Video details", () => {
	const validUrl = new URL("https://example.com").href; // Sanity check: use `URL` to make sure Node agrees this URL is valid
	const details: MediaDetails = {
		title: "Sample",
		url: validUrl,
		year: "2000"
	};

	beforeEach(() => {
		// The URL check shouldn't come from the platform modules (by default) when testing
		mockGetMovieDbEntry.mockResolvedValue(details);
	});

	test.each`
		invalidUrl
		${"not a url"}
		${"lolz"}
		${"https://"}
		${""}
	`("returns null from a non-URL '$invalidUrl'", async ({ invalidUrl }: { invalidUrl: string }) => {
		// Our mocked modules don't return null, but the unit under test does
		await expect(getMediaDetails(invalidUrl, null)).resolves.toBeNull();
	});

	test("calls every video retrieval function with the given URL", async () => {
		await expect(getMediaDetails(validUrl, null)).resolves.toBe(details);
		expect(mockGetMovieDbEntry).toHaveBeenCalledOnce();
	});

	test("returns null when every module throws", async () => {
		mockGetMovieDbEntry.mockRejectedValueOnce(new MediaFetchError("testing"));
		await expect(getMediaDetails(validUrl, null)).resolves.toBeNull();
	});

	const urls = [
		["Bandcamp", "https://4everfreebrony.bandcamp.com/track/wandering-eyes-2018-2"],
		["Bandcamp custom-domain", "https://forestrainmedia.com/track/bad-wolf"],
		["SoundCloud", "https://soundcloud.com/hwps/no999"],
		["YouTube", "https://youtu.be/9RAQsdTQIcs"],
		["Pony.fm", "https://pony.fm/t46025"]
	] as const;
	test.each(urls)("strips extra info from a %s URL", async (_, url) => {
		const dirtyUrl = `${url} Text and stuff`;
		const cleanUrl = new URL(url);

		await expect(getMediaDetails(dirtyUrl, null)).resolves.toBeObject();
		expect(mockGetMovieDbEntry).toHaveBeenCalledOnce();
		expect(mockGetMovieDbEntry).toHaveBeenCalledWith(cleanUrl);
	});
});
