import type { GuildTextBasedChannel } from "discord.js";
import type { Invocable } from "./invokeCommand.js";
import { useLogger } from "../logger.js";

const logger = useLogger();

/**
 * Assesses whether the calling guild member is allowed to run the given command.
 *
 * @param command The command the user wants to run.
 * @param channel The channel in which the command is being run.
 *
 * @returns `true` if the user may be permitted to run the command. `false` otherwise.
 */
export function assertUserCanRunCommand(
	command: Invocable,
	channel: GuildTextBasedChannel | null
): boolean {
	if (!command.dmPermission && !channel) {
		logger.debug(`Command '${command.name}' reqires a guild, but we don't have one right now.`);
		return false;
	}

	if (command.dmPermission) {
		// No permissions demanded
		logger.debug(`Command '${command.name}' does not require specific user permissions.`);
		logger.debug("Proceeding...");
		return true;
	}

	// Caller fails permissions checks
	logger.debug("User did not pass any permission checks.");
	return false;
}
