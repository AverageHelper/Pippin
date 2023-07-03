import type { Command } from "./Command.js";
import { code } from "../helpers/composeStrings.js";
import { localizations, ti } from "../i18n.js";
import { randomPhrase, unwrappingFirstWith } from "../helpers/randomStrings.js";

export const ping: Command = {
	name: "ping",
	nameLocalizations: localizations("commands.ping.name"),
	description: "Ping my host server to check latency.",
	descriptionLocalizations: localizations("commands.ping.description"),
	dmPermission: true,
	async execute({ client, user, logger, guildLocale, interaction }) {
		const random = unwrappingFirstWith(
			{
				me: client.user.username,
				otherUser: user,
				otherMember: null
			},
			randomPhrase()
		);

		await interaction.reply({
			content: random,
			allowedMentions: { repliedUser: false }
		});
		const testMessage = await interaction.fetchReply();
		const responseTime = testMessage.createdTimestamp - interaction.createdTimestamp;

		const apiLatency = Math.round(client.ws.ping);
		await testMessage.edit({
			content: ti(
				"commands.ping.responses.pong",
				{ time: code(`${responseTime}ms`), latency: code(`${apiLatency}ms`) },
				guildLocale
			),
			allowedMentions: { repliedUser: false }
		});
		logger.info(`Sent ping response in ${responseTime}ms. API latency is ${apiLatency}ms.`);
	}
};
