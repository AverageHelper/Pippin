import type { Mock } from "vitest";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../permissions");

import type { CommandContext, GuildedCommand } from "../commands/index.js";
import type { Guild, GuildMember, Role } from "discord.js";
import { invokeCommand } from "./invokeCommand.js";

import { userHasRoleInGuild } from "../permissions/index.js";
const mockUserHasRoleInGuild = userHasRoleInGuild as Mock<
	Parameters<typeof userHasRoleInGuild>,
	ReturnType<typeof userHasRoleInGuild>
>;

const mockExecute = vi.fn<Array<unknown>, Promise<void>>().mockResolvedValue(undefined);
const mockReply = vi.fn().mockResolvedValue(undefined);
const mockReplyPrivately = vi.fn().mockResolvedValue(undefined);

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
