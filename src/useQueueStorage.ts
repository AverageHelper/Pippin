import type { MovieSuggestion, QueueConfig } from "./database/schemas.js";
import type { Snowflake } from "discord.js";
import { useRepository } from "./database/useDatabase.js";

// TODO: This should use the spreadsheet

export type QueueEntry = Readonly<MovieSuggestion>;
export type UnsentQueueEntry = Readonly<MovieSuggestion>;

// TODO: Break these into separate files where appropriate
// TODO: Only retain user-provided data for at most 90 days

// ** Queue Config **

export type { QueueConfig };

/**
 * Retrieves the queue's configuration settings from the database.
 *
 * @returns a promise that resolves with the queue config for the channel
 * or a default one if none has been set yet.
 */
export async function getStoredQueueConfig(): Promise<QueueConfig> {
	const extantConfig = await useRepository("config", configs => {
		// configs.findUnique({
		// 	where: { channelId: queueChannel.id },
		// 	include: {
		// 		blacklistedUsers: {
		// 			include: { user: true }
		// 		}
		// 	}
		// });
		return {
			blacklistedUsers: [],
			submissionMaxQuantity: null
		} satisfies QueueConfig;
	});
	return {
		blacklistedUsers: extantConfig?.blacklistedUsers ?? [],
		submissionMaxQuantity: extantConfig?.submissionMaxQuantity ?? null
	};
}

// ** Write Media Entries **

/**
 * Adds a queue entry to the database. Does NOT check for adjacent concerns,
 * like whether the guild has a config, whether that config marks the queue
 * as "open", or whether the queue's config and limits are defined.
 *
 * @param entry Properties of the new request entity.
 *
 * @returns a promise that resolves with the new queue entry
 */
export async function pushEntryToQueue(newEntry: UnsentQueueEntry): Promise<QueueEntry> {
	// Add the entry, or update the one we have
	return await useRepository("suggestions", suggestions => {
		// TODO: Upsert the entry
		return { ...newEntry };
		// suggestions.upsert({
		// 	where: {
		// 		queueMessageId: entry.queueMessageId
		// 	},
		// 	update: newEntry,
		// 	create: newEntry,
		// 	include: { haveCalledNowPlaying: true }
		// });
	});
}

// ** Read Media Entries **

/**
 * Retrieves all queue entries, in chronological order, from the database.
 *
 * @returns a promise that resolves with the queue's entries,
 * in the order in which they were added.
 */
export async function getAllStoredEntries(): Promise<Array<QueueEntry>> {
	return await useRepository("suggestions", suggestions => {
		return [];
		// suggestions.findMany({
		// 	where: {
		// 		channelId: queueChannel.id,
		// 		guildId: queueChannel.guild.id
		// 	},
		// 	orderBy: { sentAt: "asc" },
		// 	include: { haveCalledNowPlaying: true }
		// });
	});
}

/**
 * Retrieves the number of queue entries stored in the database.
 *
 * @returns a promise that resolves with the number of entries in the queue.
 */
export async function countAllStoredEntries(): Promise<number> {
	return await useRepository("suggestions", async suggestions => {
		return 0;
		// return suggestions.count({
		// 	where: {
		// 		channelId: queueChannel.id,
		// 		guildId: queueChannel.guildId
		// 	}
		// });
	});
}

/**
 * Retrieves all entries from the database that were sent by the given user.
 *
 * @param senderId The ID of the user who submitted entries.
 * @returns a promise that resolves with the user's entries,
 * in the order in which they were added.
 */
export async function getAllStoredEntriesFromSender(senderId: string): Promise<Array<QueueEntry>> {
	return await useRepository("suggestions", suggestions => {
		return [];
		// suggestions.findMany({
		// 	where: {
		// 		channelId: queueChannel.id,
		// 		guildId: queueChannel.guild.id,
		// 		senderId
		// 	},
		// 	orderBy: { sentAt: "asc" },
		// 	include: { haveCalledNowPlaying: true }
		// });
	});
}

/**
 * Retrieves the number of queue entries stored in the database that were sent
 * by the given user.
 *
 * @param senderId The ID of the user who submitted entries.
 *
 * @returns a promise that resolves with the number of entries in
 * the queue associated with the user.
 */
export async function countAllStoredEntriesFromSender(senderId: string): Promise<number> {
	return await useRepository("suggestions", suggestions => {
		return 0;
		// suggestions.count({
		// 	where: {
		// 		channelId: queueChannel.id,
		// 		guildId: queueChannel.guild.id,
		// 		senderId
		// 	}
		// });
	});
}

// ** User Blacklist **

/**
 * Adds the user to the queue's blacklist in the database. That user will not
 * be able to submit media requests.
 *
 * @param userId The ID of the user to blacklist.
 */
export async function saveUserToStoredBlacklist(userId: Snowflake): Promise<void> {
	// const blacklistedUsers = {
	// 	connectOrCreate: {
	// 		where: {
	// 			queueConfigsChannelId_userId: {
	// 				queueConfigsChannelId: queueChannel.id,
	// 				userId
	// 			}
	// 		},
	// 		create: {
	// 			user: {
	// 				connectOrCreate: {
	// 					where: { id: userId },
	// 					create: { id: userId }
	// 				}
	// 			}
	// 		}
	// 	}
	// };

	await useRepository("config", configs => {
		// TODO: Inser the user into the blacklist array
		// configs.upsert({
		// 	// If a config is found, update it:
		// 	where: { channelId: queueChannel.id },
		// 	update: { blacklistedUsers },
		// 	// If the queue config isn't found, create it:
		// 	create: {
		// 		channelId: queueChannel.id,
		// 		blacklistedUsers
		// 	}
		// });
	});
}

/**
 * Removes the user from the queue's blacklist in the database.
 *
 * @param userId The ID of the user to whitelist.
 */
export async function removeUserFromStoredBlacklist(userId: Snowflake): Promise<void> {
	await useRepository("config", async config => {
		// TODO: Remove the user from the blacklist array
		// Delete the relation, easy as that:
		// await config.delete({
		// 	where: { queueConfigsChannelId_userId: { queueConfigsChannelId: queueChannel.id, userId } }
		// });
	});
}
