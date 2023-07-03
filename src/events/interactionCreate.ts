import { handleInteraction } from "../handleInteraction.js";
import { onEvent } from "../helpers/onEvent.js";

export const interactionCreate = onEvent("interactionCreate", {
	async execute(interaction, logger) {
		if (interaction.isChatInputCommand()) {
			await handleInteraction(interaction, logger);
		}
	}
});
