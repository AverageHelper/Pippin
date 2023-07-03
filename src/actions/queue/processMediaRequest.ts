import type { CommandContext } from "../../commands/index.js";
import type { Logger } from "../../logger.js";
import type { Message } from "discord.js";
import type { QueueEntry, UnsentQueueEntry } from "../../useQueueStorage.js";
import {
	countAllStoredEntriesFromSender,
	getStoredQueueConfig,
	pushEntryToQueue
} from "../../useQueueStorage.js";
import { deleteMessage } from "../../actions/messages/index.js";
import { getMediaDetails } from "../getMediaDetails.js";
import { logUser } from "../../helpers/logUser.js";
import { richErrorMessage } from "../../helpers/richErrorMessage.js";
import { SHRUGGIE } from "../../constants/textResponses.js";
import { t, ti } from "../../i18n.js";
import { URL } from "node:url";
import { useLogger } from "../../logger.js";

export interface MediaRequest {
	/** The URL where the track may be found. */
	readonly mediaUrl: URL;

	/** The command context of the request. */
	readonly context: CommandContext;

	/**
	 * A `Promise` that resolves with the message that contains
	 * the original embed, if _we_ sent one. If the user sent one,
	 * this value should resolve to `null`.
	 */
	readonly publicPreemptiveResponse: Promise<Message | null>;

	/** The place where log messages should be sent. */
	readonly logger: Logger;
}

const logger = useLogger();

async function reject_private(request: MediaRequest, reason: string): Promise<void> {
	const context = request.context;
	const content = `:hammer: <@!${context.user.id}> ${reason}`;

	const publicPreemptiveResponse = await request.publicPreemptiveResponse;
	if (publicPreemptiveResponse) {
		// delete the mock invocation
		await deleteMessage(publicPreemptiveResponse);
	}
	try {
		await context.interaction.editReply({
			content,
			allowedMentions: { users: [context.user.id], repliedUser: true }
		});
	} catch (error) {
		logger.error(error);
	}
}

async function reject_public(request: MediaRequest, reason: string): Promise<void> {
	const context = request.context;
	await context.followUp({ content: `:hammer: <@!${context.user.id}> ${reason}`, reply: false });
	const publicPreemptiveResponse = await request.publicPreemptiveResponse;
	if (publicPreemptiveResponse) {
		// delete the mock invocation
		await deleteMessage(publicPreemptiveResponse);
	}
	try {
		await context.interaction.editReply(
			t("commands.suggest.responses.finished", context.userLocale)
		);
	} catch (error) {
		logger.error(error);
	}
}

interface MediaAcceptance {
	readonly context: CommandContext;
	readonly entry: UnsentQueueEntry;
	readonly logger: Logger;
}

/**
 * Adds an entry to the media queue, and sends appropriate feedback responses.
 *
 * @param param0 The feedback context.
 */
async function acceptMediaRequest({ context, entry, logger }: MediaAcceptance): Promise<void> {
	logger.debug(`Began enqueuing request at ${Date.now()} from ${logUser(context.user)}`);
	await pushEntryToQueue(entry);
	logger.debug(`Enqueued request at ${Date.now()} from ${logUser(context.user)}`);
	logger.verbose(`Accepted request from user ${logUser(context.user)}.`);
	logger.debug(
		`Pushed new request to queue. Sending public acceptance to user ${logUser(context.user)}`
	);

	const MENTION_SENDER = `<@!${context.user.id}>`;
	await context.followUp({
		content: `${MENTION_SENDER}, ${t(
			"commands.suggest.responses.submission-accepted",
			context.guildLocale
		)}`,
		reply: false
	});
	try {
		await context.interaction.editReply(
			t("commands.suggest.responses.finished", context.userLocale)
		);
	} catch (error) {
		logger.error(error);
	}
}

/**
 * Processes a media request, either accepting or rejecting the request, and possibly
 * adding the media to the list.
 *
 * @param request The media request context.
 */
export async function processMediaRequest(request: MediaRequest): Promise<void> {
	const { mediaUrl, context, logger } = request;
	const userLocale = context.userLocale;
	const guildLocale = context.guildLocale;
	const sender = context.user;
	const senderId = sender.id;

	const mediaInfoPromise = getMediaDetails(mediaUrl); // start this and do other things

	try {
		const [config, userSubmissionCount] = await Promise.all([
			getStoredQueueConfig(),
			countAllStoredEntriesFromSender(senderId)
		]);

		// ** If the user is blacklisted, reject!
		if (config.blacklistedUsers?.some(userId => userId === senderId) === true) {
			logger.verbose(
				`${config.blacklistedUsers.length} users on the blacklist. User ${logUser(
					sender
				)} is one of them.`
			);
			logger.verbose(`Rejected request from user ${logUser(sender)}: The user is blacklisted`);
			return await reject_private(request, t("commands.suggest.responses.not-allowed", userLocale));
		}

		// ** If the user has used all their submissions, reject!
		const maxSubs = config.submissionMaxQuantity;
		logger.verbose(
			`User ${logUser(sender)} has submitted ${userSubmissionCount} request${
				userSubmissionCount === 1 ? "" : "s"
			} before this one`
		);
		if (maxSubs !== null && maxSubs > 0 && userSubmissionCount >= maxSubs) {
			const reason = ti(
				"commands.suggest.responses.rejections.allotment-expended",
				{ max: `**${maxSubs}**` },
				userLocale
			);
			logger.verbose(
				`Rejected request from user ${logUser(
					sender
				)}: The user has submitted enough medias already`
			);
			return await reject_private(request, reason);
		}

		const media = await mediaInfoPromise; // we need this info now
		if (media === null) {
			logger.verbose("Could not find the requested media.");
			logger.verbose(
				`Rejected request from user ${logUser(sender)}: Couldn't find '${mediaUrl.href}'`
			);
			// FIXME: This response is too generic. Present something more actionable based on why the media can't be found
			return await reject_public(
				request,
				`${t("commands.suggest.responses.song-not-found", guildLocale)} ${SHRUGGIE}\n${t(
					"commands.suggest.responses.try-supported-platform",
					guildLocale
				)}`
			);
		}

		const url = new URL(media.url);

		// const entry: QueueEntry = { url, seconds, senderId };
		const entry: QueueEntry = {
			url,
			theMovieDbId: "lol",
			title: media.title,
			year: media.year,
			sentAt: new Date(context.createdTimestamp), // TODO: Is this accurate?
			sentBy: senderId
		};

		// ** Full send!
		await acceptMediaRequest({ context, entry, logger });

		// Handle fetch errors
	} catch (error) {
		logger.error(richErrorMessage("Failed to process media request", error));
		return await reject_public(
			request,
			`${t("commands.suggest.responses.query-returned-error", guildLocale)} :shrug:`
		);
	}
}
