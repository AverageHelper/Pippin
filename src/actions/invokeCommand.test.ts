import "../../tests/testUtils/leakedHandles.js";

jest.mock("../permissions");

import type { CommandContext, GuildedCommand } from "../commands/index.js";
import type { Guild, GuildMember, Role } from "discord.js";
import { invokeCommand } from "./invokeCommand.js";

import { userHasRoleInGuild } from "../permissions/index.js";
const mockUserHasRoleInGuild = userHasRoleInGuild as jest.Mock<
	Promise<boolean>,
	[user: GuildMember, roleId: string, guild: Guild]
>;

const mockExecute = jest.fn<Promise<void>, Array<unknown>>().mockResolvedValue(undefined);
const mockReply = jest.fn().mockResolvedValue(undefined);
const mockReplyPrivately = jest.fn().mockResolvedValue(undefined);

describe("Invoke Command", () => {
	const callerId = "the-user";

	let command: GuildedCommand;
	let context: CommandContext;

	beforeEach(() => {
		command = {
			name: "test",
			description: "A sample command",
			dmPermission: false,
			execute: mockExecute
		};

		const guild = {
			id: "the-guild",
			ownerId: callerId,
			roles: {
				async fetch(id: string): Promise<Role | null> {
					// Promise.reject(new Error("You shouldn't get here"))
					const doesHave = await mockUserHasRoleInGuild(member, id, guild);
					return {
						id,
						members: {
							has: () => doesHave
						}
					} as unknown as Role;
				}
			}
		} as unknown as Guild;

		const member = {
			id: callerId,
			guild
		} as unknown as GuildMember;

		context = {
			user: {
				id: callerId
			},
			member,
			guild,
			channel: {
				id: "the-channel",
				guild
			},
			reply: mockReply,
			replyPrivately: mockReplyPrivately
		} as unknown as CommandContext;

		mockUserHasRoleInGuild.mockResolvedValue(false);
	});

	describe("Guild Guards", () => {
		test("always executes if the command does not require a guild", async () => {
			(command as { dmPermission: boolean }).dmPermission = true;
			(context as { guild: null }).guild = null;
			(context as { channel: null }).channel = null;
			(context as { member: null }).member = null;
			await expect(invokeCommand(command, context)).resolves.toBeUndefined();
			expect(mockExecute).toHaveBeenCalledOnce();
			expect(mockExecute).toHaveBeenCalledWith(context);
		});

		test("never executes if the command requires a guild and context does not have one", async () => {
			(context as { guild: null }).guild = null;
			(context as { channel: null }).channel = null;
			(context as { member: null }).member = null;
			await expect(invokeCommand(command, context)).resolves.toBeUndefined();
			expect(mockExecute).not.toHaveBeenCalled();
		});
	});
});
