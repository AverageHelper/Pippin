import type { CommandContext, Command, Subcommand } from "../commands/index.js";
import { isGuildedCommandContext } from "../commands/CommandContext.js";
import { t } from "../i18n.js";
import { useLogger } from "../logger.js";

export type Invocable = Command | Subcommand;

const logger = useLogger();

async function failNoGuild(context: CommandContext): Promise<void> {
	return await context.reply({
		content: t("common.not-here", context.userLocale),
		ephemeral: true
	});
}

/**
 * Runs the command if the invocation context satisfies the command's
 * declared guild and permission requirements.
 *
 * @param command The command to execute.
 * @param context The invocation context.
 */
export async function invokeCommand(command: Invocable, context: CommandContext): Promise<void> {
	if (command.dmPermission) {
		// No guild required
		logger.debug(`Command '${command.name}' does not require guild information.`);
		logger.debug("Proceeding...");
		return await command.execute(context);
	}

	if (!isGuildedCommandContext(context)) {
		// No guild found
		logger.debug(`Command '${command.name}' requires guild information, but none was found.`);
		return await failNoGuild(context);
	}

	return await command.execute(context);
}
