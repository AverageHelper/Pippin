import type {
	ApplicationCommandChoicesData,
	ApplicationCommandNonOptionsData,
	ApplicationCommandOption,
	ApplicationCommandOptionData
} from "discord.js";
import type { Command, CommandContext, Subcommand } from "../commands/index.js";
import type { PartialString } from "../helpers/composeStrings.js";
import type { SupportedLocale } from "../i18n.js";
import { ApplicationCommandOptionType } from "discord.js";
import { assertUserCanRunCommand } from "./assertUserCanRunCommand.js";
import { createPartialString, composed, push, pushNewLine } from "../helpers/composeStrings.js";
import { isGuildedCommandContext } from "../commands/CommandContext.js";
import { SLASH_COMMAND_INTENT_PREFIX } from "../constants/database.js";

// Standard punctuation that we'll only use here
const DASH = " - ";
const SEP = " | ";
const INDENT = "    ";
const CODE = "`";
const REQ_START = "<";
const REQ_END = ">";
const VAL_START = "[";
const VAL_END = "]";
const OPT = "?";

function localizedName(
	cmd: Pick<Command, "name" | "nameLocalizations">,
	locale: SupportedLocale
): string {
	const defaultName = cmd.name;
	if (cmd.nameLocalizations) {
		const localizedName = cmd.nameLocalizations[locale] ?? defaultName;
		return localizedName || defaultName;
	}
	return defaultName;
}

function localizedDescription(
	cmd: Pick<Command, "description" | "descriptionLocalizations">,
	locale: SupportedLocale
): string {
	const defaultDescription = cmd.description;
	if (cmd.descriptionLocalizations) {
		const localizedDescription = cmd.descriptionLocalizations[locale] ?? defaultDescription;
		return localizedDescription || defaultDescription;
	}
	return defaultDescription;
}

/**
 * Constructs a string that describes the available commands.
 *
 * @param context The context of the request. Determines which commands get printed.
 * @param commands The collection of available commands.
 * @returns a string describing all commands.
 */
export function describeAllCommands(
	context: CommandContext,
	commands: ReadonlyMap<string, Command>,
	locale: SupportedLocale
): string {
	const COMMAND_PREFIX = SLASH_COMMAND_INTENT_PREFIX;

	// Describe all commands
	const description = createPartialString();
	const allCommands = Array.from(commands.values());
	for (const command of allCommands) {
		if (command.deprecated === true) continue; // Skip obsolete commands
		if (
			!command.dmPermission &&
			(!isGuildedCommandContext(context) ||
				!context.channel ||
				!assertUserCanRunCommand(command, context.channel))
		) {
			continue; // User has no access, so move on
		}

		const cmdDesc = createPartialString();

		// Describe the command
		const commandName = localizedName(command, locale);
		const commandDescription = localizedDescription(command, locale);

		push(CODE, cmdDesc);
		push(`${COMMAND_PREFIX}${commandName}`, cmdDesc);

		describeParameters(command.options ?? [], cmdDesc, locale);

		push(CODE, cmdDesc);

		push(DASH, cmdDesc);
		push(commandDescription, cmdDesc);

		// Describe all subcommands
		command.options
			?.filter(optn => optn.type === ApplicationCommandOptionType.Subcommand)
			?.forEach(sub => {
				const subName = localizedName(sub, locale);
				const subDescription = localizedDescription(sub, locale);

				// Describe the subcommand
				const subDesc = createPartialString();
				pushNewLine(subDesc);
				push(INDENT, subDesc);

				push(CODE, subDesc);
				push(`${COMMAND_PREFIX}${commandName} ${subName}`, subDesc);

				if ("options" in sub) {
					describeParameters(sub.options ?? [], subDesc, locale);
				}

				push(CODE, subDesc);

				push(DASH, subDesc);
				push(subDescription, subDesc);
				push(composed(subDesc), cmdDesc);
			});

		push(composed(cmdDesc), description);
		pushNewLine(description);
	}

	return composed(description);
}

function describeParameters(
	options: ReadonlyArray<
		| ApplicationCommandOption
		| ApplicationCommandOptionData
		| ApplicationCommandChoicesData
		| ApplicationCommandNonOptionsData
		| Subcommand
	>,
	cmdDesc: PartialString,
	locale: SupportedLocale
): void {
	options
		?.filter(optn => optn.type !== ApplicationCommandOptionType.Subcommand)
		?.forEach(o => {
			const option = o as ApplicationCommandChoicesData;

			// Describe the parameter
			const subDesc = createPartialString();
			push(" ", subDesc);

			if (option.required === true && option.choices) {
				push(REQ_START, subDesc);
			} else {
				push(VAL_START, subDesc);
			}

			if (option.required === undefined || !option.required) {
				push(OPT, subDesc);
			}

			if (option.choices) {
				// specific value
				const choiceValues = option.choices.map(ch => `${ch.value}`);
				push(choiceValues.join(SEP) ?? "", subDesc);
			} else {
				// arbitrary value
				push(localizedName(option, locale), subDesc);
			}

			if (option.required === true && option.choices) {
				push(REQ_END, subDesc);
			} else {
				push(VAL_END, subDesc);
			}

			push(composed(subDesc), cmdDesc);
		});
}
