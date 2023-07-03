import type { Client, GuildMember, Message } from "discord.js";
import "../tests/testUtils/leakedHandles.js";
import { userMention } from "discord.js";
import { expectDefined } from "../tests/testUtils/expectations/jest.js";

import { handleCommand } from "./handleCommand.js";
import { useTestLogger } from "../tests/testUtils/logger.js";

const logger = useTestLogger();

describe("Command handler", () => {
	const botId = "this-user";

	const mockReply = jest.fn().mockResolvedValue(undefined);
	const mockAuthorSend = jest.fn().mockResolvedValue(undefined);
	const mockChannelSend = jest.fn().mockResolvedValue(undefined);
	const mockChannelSendTyping = jest.fn().mockResolvedValue(undefined);

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
				fetch: jest.fn().mockImplementation(
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
		jest.clearAllMocks();
	});
});
