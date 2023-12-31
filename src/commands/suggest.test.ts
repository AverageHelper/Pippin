import "../../tests/testUtils/leakedHandles.js";

jest.mock("../useQueueStorage.js");
jest.mock("../actions/getMediaDetails.js");

import {
	countAllStoredEntriesFromSender,
	getStoredQueueConfig,
	pushEntryToQueue
} from "../useQueueStorage.js";
const mockCountAllStoredEntriesFromSender = countAllStoredEntriesFromSender as jest.Mock;
const mockGetStoredQueueConfig = getStoredQueueConfig as jest.Mock;
const mockQueuePush = pushEntryToQueue as jest.Mock;

import { randomInt } from "../helpers/randomInt.js";
import { getMediaDetails } from "../actions/getMediaDetails.js";
const mockGetMediaDetails = getMediaDetails as jest.Mock;
mockGetMediaDetails.mockImplementation(async (url: string) => {
	// Enough uncertainty that *something* should go out of order if it's going to
	const ms = randomInt(50);
	await new Promise(resolve => setTimeout(resolve, ms));
	return {
		url,
		title: "video-title",
		duration: {
			seconds: 500
		}
	};
});

import type { Client, GuildMember, Message } from "discord.js";
import type { GuildedCommandContext } from "./Command.js";
import type { ReadonlyTuple } from "type-fest";
import { ApplicationCommandOptionType } from "discord.js";
import { suggest } from "./suggest.js";
import { URL } from "node:url";
import { useTestLogger } from "../../tests/testUtils/logger.js";

const logger = useTestLogger();

describe("Media request via URL", () => {
	const urls: ReadonlyTuple<URL, 10> = [
		new URL("https://youtu.be/dQw4w9WgXcQ"),
		new URL("https://youtu.be/9RAQsdTQIcs"),
		new URL("https://youtu.be/tao1Ic8qVkM"),
		new URL("https://youtu.be/sSukg-tAK1k"),
		new URL("https://youtu.be/9eWHXhLu-uM"),
		new URL("https://youtu.be/jeKH5HhmNQc"),
		new URL("https://youtu.be/NUYvbT6vTPs"),
		new URL("https://youtu.be/aekVhtK9yuQ"),
		new URL("https://youtu.be/BwyY5LdpECA"),
		new URL("https://youtu.be/7btMEX3kAPo")
	];
	const botId = "this-user";

	const mockPrepareForLongRunningTasks = jest.fn().mockResolvedValue(undefined);
	const mockReply = jest.fn().mockResolvedValue(undefined);
	const mockReplyPrivately = jest.fn().mockResolvedValue(undefined);
	const mockChannelSend = jest.fn().mockResolvedValue(undefined);
	const mockDeleteMessage = jest.fn().mockResolvedValue(undefined);
	const mockFollowUp = jest.fn().mockResolvedValue(undefined);

	mockCountAllStoredEntriesFromSender.mockResolvedValue(0);

	const queueChannel = {
		id: "queue-channel-123",
		name: "queue"
	};

	mockGetStoredQueueConfig.mockResolvedValue({
		blacklistedUsers: [],
		cooldownSeconds: 600,
		entryDurationMaxSeconds: null,
		queueDurationSeconds: null,
		submissionMaxQuantity: null
	});

	const mockClient: Client<true> = {
		user: { id: botId }
	} as unknown as Client<true>;

	function mockMessage(senderId: string, content: string): Message {
		const mockSenderMember: GuildMember = {
			user: { id: senderId }
		} as unknown as GuildMember;

		return {
			content,
			author: {
				bot: false,
				id: mockSenderMember.user.id,
				username: senderId
			},
			createdAt: new Date(),
			client: mockClient,
			prepareForLongRunningTasks: mockPrepareForLongRunningTasks,
			reply: mockReply,
			channel: {
				id: "request-channel-456",
				send: mockChannelSend
			},
			guild: {
				members: {
					fetch: jest.fn().mockImplementation(
						(userId: string) =>
							new Promise(resolve => {
								if (userId === mockSenderMember.user.id) {
									return resolve(mockSenderMember);
								} else if (userId === botId) {
									return resolve(mockClient);
								}
							})
					)
				}
			}
		} as unknown as Message;
	}

	describe("Media request help", () => {
		test("descibes how to submit a movie", async () => {
			const context = {
				type: "message",
				guild: "any-guild",
				channel: "any-channel",
				user: "doesn't matter",
				createdTimestamp: new Date(),
				options: [],
				logger,
				prepareForLongRunningTasks: mockPrepareForLongRunningTasks,
				reply: mockReply,
				replyPrivately: mockReplyPrivately,
				deleteInvocation: mockDeleteMessage,
				followUp: mockFollowUp
			} as unknown as GuildedCommandContext;

			await suggest.execute(context);
			expect(mockReply).toHaveBeenCalledOnce();
			expect(mockReply).toHaveBeenCalledWith(expect.toBeString());

			const calls = mockReply.mock.calls[0] as Array<unknown>;
			const description = calls[0];
			expect(description).toMatchSnapshot();
		});
	});

	test("only a user's first submission gets in if a cooldown exists", async () => {
		const mockMessage1 = mockMessage("another-user", `?sr ${urls[0].href}`);
		const mockMessage2 = mockMessage("another-user", `?sr ${urls[1].href}`);

		mockQueuePush.mockImplementationOnce(() => {
			// mockGetLatestStoredEntryFromSender.mockResolvedValueOnce({
			// 	queueMessageId: mockMessage1.id,
			// 	url: urls[0],
			// 	seconds: 500,
			// 	sentAt: new Date(),
			// 	senderId: mockMessage1.author.id,
			// 	isDone: false
			// });
			mockCountAllStoredEntriesFromSender.mockResolvedValueOnce(1);
			return Promise.resolve();
		});

		const context1 = {
			guild: mockMessage1.guild,
			channel: mockMessage1.channel,
			user: mockMessage1.author,
			createdTimestamp: new Date(),
			options: [
				{
					name: "url",
					value: urls[0].href,
					type: ApplicationCommandOptionType.String
				}
			],
			logger,
			prepareForLongRunningTasks: mockPrepareForLongRunningTasks,
			reply: mockReply,
			replyPrivately: mockReplyPrivately,
			deleteInvocation: mockDeleteMessage,
			followUp: mockFollowUp
		} as unknown as GuildedCommandContext;
		const context2 = {
			...context1,
			options: [
				{
					name: "url",
					value: urls[1].href,
					type: ApplicationCommandOptionType.String
				}
			],
			user: mockMessage2.author,
			guild: mockMessage2.guild,
			channel: mockMessage2.channel
		} as unknown as GuildedCommandContext;

		// Request a movie twice in quick succession
		void suggest.execute(context1);
		await suggest.execute(context2);

		// Wait for handles to close
		await new Promise(resolve => setTimeout(resolve, 500));

		// queue.push should only have been called on the first URL
		expect(mockQueuePush).toHaveBeenCalledOnce();
		expect(mockQueuePush).toHaveBeenCalledWith(
			expect.toContainEntry(["url", urls[0]]),
			queueChannel
		);

		// The submission should have been rejected with a cooldown warning via DMs
		expect(mockDeleteMessage).toHaveBeenCalledOnce();
		expect(mockReplyPrivately).toHaveBeenCalledOnce();
		expect(mockReplyPrivately).toHaveBeenCalledWith(expect.stringContaining("must wait") as string);
	});

	test("submissions enter the queue in order", async () => {
		const mockMessages: Array<Message> = [];
		urls.forEach((url, i) => {
			const userId = `user-${i + 1}`;
			const message = mockMessage(userId, `?sr ${url.href}`);
			mockMessages.push(message);
		});

		await Promise.all([
			mockMessages
				.map(message => {
					return {
						options: message.content
							.split(" ")
							.slice(1)
							.map(url => ({
								name: "url",
								value: url,
								type: ApplicationCommandOptionType.String
							})),
						guild: message.guild,
						channel: message.channel,
						user: message.author,
						createdTimestamp: new Date(),
						logger,
						prepareForLongRunningTasks: mockPrepareForLongRunningTasks,
						reply: mockReply,
						replyPrivately: mockReplyPrivately,
						followUp: mockFollowUp
					} as unknown as GuildedCommandContext;
				})
				.map(suggest.execute)
		]);

		// Wait for handles to close
		await new Promise(resolve => setTimeout(resolve, 500));

		// queue.push should have been called on each URL
		urls.forEach((url, i) => {
			expect(mockQueuePush).toHaveBeenNthCalledWith(
				i + 1,
				expect.toContainEntries([
					["url", url],
					["senderId", `user-${i + 1}`]
				]),
				queueChannel
			);
		});
		expect(mockQueuePush).toHaveBeenCalledTimes(10);
	});
});
