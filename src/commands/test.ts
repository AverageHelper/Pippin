import type { Command } from "./Command.js";
import { EmbedBuilder } from "discord.js";
import { getMovieDbEntry } from "../actions/network/getMovieDbEntry.js";
import { localizations, t, ti } from "../i18n.js";
import { URL } from "node:url";
import { version } from "../version.js";

type FetchTestFunction = typeof getMovieDbEntry;

interface FetchTest {
	readonly name: string;
	readonly fn: FetchTestFunction;
	readonly urlString: string;
}

interface FetchResult {
	test: FetchTest;
	startTime: number;
	endTime?: number;
	error?: NodeJS.ErrnoException;
}

const SERVICE_TESTS: Readonly<NonEmptyArray<FetchTest>> = [
	{
		name: "TheMovieDB",
		fn: getMovieDbEntry,
		// Fight Club
		urlString: "https://www.themoviedb.org/movie/550-fight-club"
	}
];

const SUCCESS = ":white_check_mark:";
const FAILURE = ":x:";

async function runTest(test: FetchTest): Promise<FetchResult> {
	const startTime = Date.now();
	const result: FetchResult = { test, startTime };
	try {
		await test.fn(new URL(test.urlString));
	} catch (error) {
		result.error = error as NodeJS.ErrnoException;
	} finally {
		result.endTime = Date.now();
	}

	return result;
}

function addResult(result: FetchResult, embed: EmbedBuilder): void {
	const name = result.test.name;
	const runTime = (result.endTime ?? 0) - result.startTime;
	embed.addFields({
		name,
		value: `${result.error ? FAILURE : SUCCESS} ${
			result.error?.message ?? "Success"
		} (${runTime}ms)`
	});
}

let isTesting = false;

export const test: Command = {
	name: "test",
	nameLocalizations: localizations("commands.test.name"),
	description: "Make sure I still know how to talk to video services.",
	descriptionLocalizations: localizations("commands.test.description"),
	dmPermission: true,
	async execute({ userLocale, prepareForLongRunningTasks, replyPrivately }) {
		if (isTesting) {
			// TODO: Scope this to the user, instead of globally
			await replyPrivately(
				t("commands.test.responses.cannot-run-concurrent-invocations", userLocale)
			);
			return;
		}
		isTesting = true;
		try {
			await prepareForLongRunningTasks(true);

			// Ask for video info from our various services
			const results = await Promise.all(
				SERVICE_TESTS.map(runTest) //
			);

			// Prepare response
			const embed = new EmbedBuilder();
			embed.setFooter({ text: `Pippin v${version}` });

			// TODO: We use this URL in several places. Move it into a central place for us to import and use around
			const supportedPlatformsList =
				"https://git.average.name/AverageHelper/Pippin#supported-media-platforms";
			const list = `[${t(
				"commands.test.responses.supported-platforms",
				userLocale
			)}](${supportedPlatformsList})`;

			embed.setTitle(t("commands.test.responses.results-header", userLocale));
			embed.setDescription(ti("commands.test.responses.see-at-forge", { list }, userLocale));
			results.forEach(result => addResult(result, embed));

			const anyFailures = results.some(result => result.error !== undefined);
			const content = anyFailures
				? `:sweat: ${t("commands.test.responses.preamble-failure", userLocale)}`
				: `${t("commands.test.responses.preamble-success", userLocale)} :grin:`;

			await replyPrivately({ content, embeds: [embed] });
		} finally {
			// eslint-disable-next-line require-atomic-updates
			isTesting = false;
		}
	}
};
