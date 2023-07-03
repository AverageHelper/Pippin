import type { GuildedCommand } from "./Command.js";
import type { Message } from "discord.js";
import type { MediaRequest } from "../actions/queue/processMediaRequest.js";
import { ApplicationCommandOptionType, hideLinkEmbed } from "discord.js";
import { localizations, t } from "../i18n.js";
import { logUser } from "../helpers/logUser.js";
import { processMediaRequest } from "../actions/queue/processMediaRequest.js";
import { resolveStringFromOption } from "../helpers/optionResolvers.js";
import { sendMessageInChannel, stopEscapingUriInString } from "../actions/messages/index.js";
import { URL } from "node:url";
import { useJobQueue } from "@averagehelper/job-queue";

export const suggest: GuildedCommand = {
	name: "suggest",
	nameLocalizations: localizations("commands.suggest.name"),
	description: "Submit a movie.",
	descriptionLocalizations: localizations("commands.suggest.description"),
	options: [
		{
			name: "url",
			nameLocalizations: localizations("commands.suggest.options.url.name"),
			description: "A media link from TheMovieDB",
			descriptionLocalizations: localizations("commands.suggest.options.url.description"),
			type: ApplicationCommandOptionType.String,
			required: true
		}
	],
	dmPermission: false,
	async execute(context) {
		const {
			guildLocale,
			channel,
			user,
			options,
			createdTimestamp,
			logger,
			reply,
			prepareForLongRunningTasks
		} = context;

		const MENTION_SENDER = `<@!${user.id}>`;

		logger.debug(`Got media request message at ${createdTimestamp} from ${logUser(user)}`);

		const firstOption = options[0];
		if (!firstOption) {
			const { help } = await import("./help.js");
			return await help.execute(context);
		}

		const escapedMediaUrlString = resolveStringFromOption(firstOption).trim();
		const shouldHideEmbeds =
			escapedMediaUrlString.startsWith("<") && escapedMediaUrlString.endsWith(">");

		const mediaUrlString = shouldHideEmbeds
			? stopEscapingUriInString(escapedMediaUrlString)
			: escapedMediaUrlString;
		let mediaUrl: URL;
		let publicPreemptiveResponse: Promise<Message | null> = Promise.resolve(null);

		try {
			mediaUrl = new URL(mediaUrlString);
		} catch (error) {
			logger.error(`Could not parse URL string due to error: ${JSON.stringify(error)}`);
			// TODO: Be more specific. What kind of error?
			return await reply(
				`:hammer: ${MENTION_SENDER} ${t(
					"commands.suggest.responses.query-returned-error",
					guildLocale
				)}`
			);
		}

		if (channel) {
			// The link hasn't been embedded yet, so embed it (unless the user has said not to do that)
			// This means we'll need to remember this message to delete it if the submission gets rejected
			// This should match the behavior of context.deleteInvocation() on `?sr`
			const href = shouldHideEmbeds ? hideLinkEmbed(mediaUrl.href) : mediaUrl.href;
			publicPreemptiveResponse = sendMessageInChannel(channel, {
				content: `${MENTION_SENDER}\n?${suggest.name} ${href}`,
				allowedMentions: { users: [], repliedUser: false }
			});

			await prepareForLongRunningTasks(true);
		}

		const requestQueue = useJobQueue<MediaRequest>("urlRequest");
		requestQueue.process(processMediaRequest); // Same function instance, so a nonce call

		requestQueue.createJob({
			mediaUrl,
			context,
			publicPreemptiveResponse,
			logger
		});
		logger.debug(`Enqueued request for processing at ${Date.now()} from ${logUser(user)}`);
	}
};
