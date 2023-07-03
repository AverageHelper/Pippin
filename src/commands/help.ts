import type { GuildedCommand } from "./Command.js";
import { localizations } from "../i18n.js";
import { SLASH_COMMAND_INTENT_PREFIX } from "../constants/database.js";
import { composed, createPartialString, push, pushNewLine } from "../helpers/composeStrings.js";

// TODO: i18n
export const help: GuildedCommand = {
	name: "help",
	nameLocalizations: localizations("commands.help.name"),
	description: "Print instructions for using the common commands.",
	descriptionLocalizations: localizations("commands.help.description"),
	dmPermission: false,
	async execute({ guildLocale, reply }) {
		const { suggest } = await import("./suggest.js");

		const suggestCommandName: string = suggest.nameLocalizations
			? suggest.nameLocalizations[guildLocale] ?? suggest.name
			: suggest.name;

		// Print the standard help
		const COMMAND_PREFIX = SLASH_COMMAND_INTENT_PREFIX; // TODO: Link the commands directly
		const msg = createPartialString();

		// TODO: Tell ppl to use the /suggest command

		const exampleQuery = "https://youtu.be/dQw4w9WgXcQ"; // :P

		push(
			`To submit a movie, find a link to it on TMDB, then, type \`${COMMAND_PREFIX}${suggestCommandName} <link>\`.`,
			msg
		);
		pushNewLine(msg);
		push(`For example: \`${COMMAND_PREFIX}${suggestCommandName} ${exampleQuery}\``, msg);
		pushNewLine(msg);
		push(
			"I will respond with a text verification indicating your movie has joined the listed!",
			msg
		);

		return await reply(composed(msg));
	}
};
