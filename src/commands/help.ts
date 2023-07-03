import type { GlobalCommand } from "./Command.js";
import { localizations } from "../i18n.js";
import { composed, createPartialString, push, pushNewLine } from "../helpers/composeStrings.js";
import { deployedGlobalCommand } from "../actions/verifyCommandDeployments.js";

function commandMention<N extends string, ID extends string>(name: N, id: ID): `</${N}:${ID}>` {
	return `</${name}:${id}>`;
}

function mentionForCommand(command: GlobalCommand): `</${string}:${string}>` {
	const deployedCommand = deployedGlobalCommand(command);
	return commandMention(command.name, deployedCommand.id);
}

// TODO: i18n
export const help: GlobalCommand = {
	name: "help",
	nameLocalizations: localizations("commands.help.name"),
	description: "Print instructions for using the common commands.",
	descriptionLocalizations: localizations("commands.help.description"),
	dmPermission: true,
	async execute({ guildLocale, reply }) {
		const { suggest } = await import("./suggest.js");

		const suggestCommandName: string = suggest.nameLocalizations
			? suggest.nameLocalizations[guildLocale] ?? suggest.name
			: suggest.name;

		// Print the standard help
		const commandName = mentionForCommand(suggest);
		const msg = createPartialString();

		const exampleQuery = "https://youtu.be/dQw4w9WgXcQ"; // :P

		push(`To submit a movie, find a link to it on TMDB, then submit it with ${commandName}.`, msg);
		pushNewLine(msg);
		push(`For example: \`/${suggestCommandName} url:${exampleQuery}\``, msg);
		pushNewLine(msg);
		pushNewLine(msg);
		push("I will respond with a text verification indicating your movie has joined the list!", msg);

		return await reply(composed(msg));
	}
};
