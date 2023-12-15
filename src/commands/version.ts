import type { Command } from "./Command.js";
import { localizations, ti } from "../i18n.js";
import { version as pippinVersion } from "../version.js";
import { randomCelebration, unwrappingFirstWith } from "../helpers/randomStrings.js";

export const version: Command = {
	name: "version",
	nameLocalizations: localizations("commands.version.name"),
	description: "Display the bot's current codebase version.",
	descriptionLocalizations: localizations("commands.version.description"),
	dmPermission: true,
	async execute({ client, user, guildLocale, reply }) {
		const celebration = unwrappingFirstWith(
			{
				me: client.user.username,
				otherUser: user,
				otherMember: null
			},
			randomCelebration()
		);

		const systemName = "Pippin Core";

		const repo = "https://git.average.name/AverageHelper/Pippin";
		const changelog = `${repo}/src/branch/main/CHANGELOG.md`; // TODO: Select the current version's heading
		// Discord lets bots link stuff in Markdown syntax, but it'll also embed by default.
		// We use angled brackets (`<` and `>`) to prevent the embed.
		return await reply(
			`${ti(
				"commands.version.response",
				{ version: `[${systemName} v${pippinVersion}](<${changelog}>)` },
				guildLocale
			)}  ${celebration}`
		);
	}
};
