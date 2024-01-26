import type { Mock } from "vitest";
import { describe, expect, test, vi } from "vitest";

vi.mock("../useQueueStorage.js");
vi.mock("../actions/getMediaDetails.js");

import {
	countAllStoredEntriesFromSender,
	getStoredQueueConfig,
	pushEntryToQueue
} from "../useQueueStorage.js";
const mockCountAllStoredEntriesFromSender = countAllStoredEntriesFromSender as Mock<
	Parameters<typeof countAllStoredEntriesFromSender>,
	ReturnType<typeof countAllStoredEntriesFromSender>
>;
const mockGetStoredQueueConfig = getStoredQueueConfig as Mock<
	Parameters<typeof getStoredQueueConfig>,
	ReturnType<typeof getStoredQueueConfig>
>;
const mockQueuePush = pushEntryToQueue as Mock<
	Parameters<typeof pushEntryToQueue>,
	ReturnType<typeof pushEntryToQueue>
>;

import { randomInt } from "../helpers/randomInt.js";
import { getMediaDetails } from "../actions/getMediaDetails.js";
const mockGetMediaDetails = getMediaDetails as Mock<
	Parameters<typeof getMediaDetails>,
	ReturnType<typeof getMediaDetails>
>;
mockGetMediaDetails.mockImplementation(async url => {
	// Enough uncertainty that *something* should go out of order if it's going to
	const ms = randomInt(50);
	await new Promise(resolve => setTimeout(resolve, ms));
	return {
		url: typeof url === "string" ? new URL(url) : url,
		title: "",
		year: "2024"
	};
});

import type { Client, GuildMember, Message } from "discord.js";
import type { GuildedCommandContext } from "./Command.js";
import type { ReadonlyTuple } from "type-fest";
import { ApplicationCommandOptionType } from "discord.js";
import { suggest } from "./suggest.js";
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

	const mockPrepareForLongRunningTasks = vi.fn().mockResolvedValue(undefined);
	const mockReply = vi.fn().mockResolvedValue(undefined);
	const mockReplyPrivately = vi.fn().mockResolvedValue(undefined);
	const mockChannelSend = vi.fn().mockResolvedValue(undefined);
	const mockDeleteMessage = vi.fn().mockResolvedValue(undefined);
	const mockFollowUp = vi.fn().mockResolvedValue(undefined);

	mockCountAllStoredEntriesFromSender.mockResolvedValue(0);

	const queueChannel = {
		id: "queue-channel-123",
		name: "queue"
	};

	mockGetStoredQueueConfig.mockResolvedValue({
		blacklistedUsers: [],
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
					fetch: vi.fn().mockImplementation(
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
			expect(mockReply).toHaveBeenCalledWith(expect.stringContaining(""));

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
			return Promise.resolve({
				sentAt: new Date(),
				sentBy: mockMessage1.author.id,
				theMovieDbId: "0",
				title: "",
				url: new URL("https://example.com"),
				year: "2024"
			});
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
			expect.objectContaining({ url: urls[0] }),
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
				expect.objectContaining({
					url,
					senderId: `user-${i + 1}`
				}),
				queueChannel
			);
		});
		expect(mockQueuePush).toHaveBeenCalledTimes(10);
	});
});
