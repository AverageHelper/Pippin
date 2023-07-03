import type { Guild, GuildMember } from "discord.js";

export async function userHasRoleInGuild(
	member: GuildMember,
	roleId: string,
	guild: Guild
): Promise<boolean> {
	return await Promise.resolve(member.roles.cache.has(roleId));
}
