import type { MediaDetails } from "./getMediaDetails.js";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { MediaFetchError } from "../errors/MediaFetchError.js";

vi.mock("./network/getBandcampTrack.js", () => ({ getBandcampTrack: vi.fn() }));
vi.mock("./network/getPonyFmTrack.js", () => ({ getPonyFmTrack: vi.fn() }));
vi.mock("./network/getSoundCloudTrack.js", () => ({ getSoundCloudTrack: vi.fn() }));
vi.mock("./network/getYouTubeVideo.js", () => ({ getYouTubeVideo: vi.fn() }));

import { getMovieDbEntry } from "./network/getMovieDbEntry.js";
const mockGetMovieDbEntry = getMovieDbEntry as Mock<
	Parameters<typeof getMovieDbEntry>,
	ReturnType<typeof getMovieDbEntry>
>;

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

		await expect(getMediaDetails(dirtyUrl, null)).resolves.toBe(Object);
		expect(mockGetMovieDbEntry).toHaveBeenCalledOnce();
		expect(mockGetMovieDbEntry).toHaveBeenCalledWith(cleanUrl);
	});
});
