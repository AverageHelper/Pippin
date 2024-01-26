import type { Client, GuildMember, Message } from "discord.js";
import { beforeEach, describe, test, vi } from "vitest";
import { userMention } from "discord.js";
import { expectDefined } from "../tests/testUtils/expectations/vitest.js";

import { handleCommand } from "./handleCommand.js";
import { useTestLogger } from "../tests/testUtils/logger.js";

const logger = useTestLogger();

describe("Command handler", () => {
	const botId = "this-user";

	const mockReply = vi.fn().mockResolvedValue(undefined);
	const mockAuthorSend = vi.fn().mockResolvedValue(undefined);
	const mockChannelSend = vi.fn().mockResolvedValue(undefined);
	const mockChannelSendTyping = vi.fn().mockResolvedValue(undefined);

	const mockClient: Client<true> = {
		user: { id: botId },
		isReady: () => true
	} as unknown as Client<true>;
	const mockSenderMember: GuildMember = {
		user: { id: "another-user" }
	} as unknown as GuildMember;

	const mockMessage: Message = {
		content: "",
		author: {
			bot: false,
			id: mockSenderMember.user.id,
			send: mockAuthorSend
		},
		client: mockClient,
		reply: mockReply,
		channel: {
			send: mockChannelSend,
			sendTyping: mockChannelSendTyping
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
							return resolve(mockSenderMember);
						})
				)
			}
		}
	} as unknown as Message;

	beforeEach(() => {
		mockMessage.content = "Some words";
		mockMessage.author.bot = false;
		vi.clearAllMocks();
	});
});
