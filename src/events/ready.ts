import { ActivityType, Client, ClientPresence } from "discord.js";
import { deployCommands } from "../actions/deployCommands.js";
import { getEnv } from "../helpers/environment.js";
import { onEvent } from "../helpers/onEvent.js";
import { parseArgs } from "../helpers/parseArgs.js";
import { revokeCommands } from "../actions/revokeCommands.js";
import { verifyCommandDeployments } from "../actions/verifyCommandDeployments.js";
import { version as pippinVersion } from "../version.js";

/**
 * The event handler for when the Discord Client is ready for action
 */
export const ready = onEvent("ready", {
	once: true,
	async execute(client, logger) {
		logger.debug(`Node ${process.version}`);
		logger.debug(`NODE_ENV: ${getEnv("NODE_ENV") ?? "undefined"}`);
		logger.info(`Starting ${client.user.username} v${pippinVersion}...`);

		const args = parseArgs();

		// If we're only here to deploy commands, do that and then exit
		if (args.deploy) {
			await deployCommands(client, logger);
			client.destroy();
			return;
		}

		// If we're only here to revoke commands, do that and then exit
		if (args.revoke) {
			await revokeCommands(client, logger);
			client.destroy();
			return;
		}

		logger.verbose("*Yawn* Good morning!");
		logger.verbose("Starting...");
		logger.info(`Started Pippin Core v${pippinVersion}`);

		// Sanity check for commands
		logger.info("Verifying command deployments...");
		try {
			await verifyCommandDeployments(client, logger);
		} catch (error) {
			// Logging directly to console, because `winston` might not flush properly before we exit
			// eslint-disable-next-line no-console
			console.error(error);
			process.exit(1); // Getting around our own error handler
		}

		// Set user activity
		logger.info("Setting user activity");
		setActivity(client);

		if (getEnv("NODE_ENV")?.startsWith("test") === true) {
			// Don't log the tag in test mode, people might see that!
			logger.info(`Logged in as ${client.user.username}`);
		} else {
			logger.info(`Logged in as ${client.user.tag}`);
		}

		logger.info("Ready!");
	}
});

function setActivity(client: Client<true>): ClientPresence {
	// Shout out our source code.
	// This looks like crap, but it's the only way to show a custom
	// multiline string on the bot's user profile.
	return client.user.setActivity({
		type: ActivityType.Playing,
		name: "Source: codeberg.org/AverageHelper/Pippin",
		url: "https://codeberg.org/AverageHelper/Pippin"
	});
}
