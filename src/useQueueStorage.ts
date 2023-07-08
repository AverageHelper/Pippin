import type { MovieSuggestion, QueueConfig } from "./database/schemas.js";
import type { ReadonlyDeep } from "type-fest";
import type { Snowflake } from "discord.js";
import {
	getQueueConfig,
	getSuggestionQueue,
	saveQueueConfig,
	upsertEntryInQueue
} from "./database/index.js";

export type QueueEntry = MovieSuggestion;
export type UnsentQueueEntry = MovieSuggestion;

// ** Queue Config **

export type { QueueConfig };

/**
 * Retrieves the queue's configuration settings from the database.
 *
 * @returns a promise that resolves with the queue config for the channel
 * or a default one if none has been set yet.
 */
export async function getStoredQueueConfig(): Promise<QueueConfig> {
	return await getQueueConfig();
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
export async function pushEntryToQueue(
	newEntry: ReadonlyDeep<UnsentQueueEntry>
): Promise<QueueEntry> {
	// Add the entry, or update the one we have
	return await upsertEntryInQueue(newEntry);
}

// ** Read Media Entries **

/**
 * Retrieves all queue entries, in chronological order, from the database.
 *
 * @returns a promise that resolves with the queue's entries,
 * in the order in which they were added.
 */
export async function getAllStoredEntries(): Promise<Array<QueueEntry>> {
	return await getSuggestionQueue();
}

/**
 * Retrieves the number of queue entries stored in the database.
 *
 * @returns a promise that resolves with the number of entries in the queue.
 */
export async function countAllStoredEntries(): Promise<number> {
	const allEntries = await getAllStoredEntries();
	return allEntries.length;
}

/**
 * Retrieves all entries from the database that were sent by the given user.
 *
 * @param senderId The ID of the user who submitted entries.
 * @returns a promise that resolves with the user's entries,
 * in the order in which they were added.
 */
export async function getAllStoredEntriesFromSender(senderId: string): Promise<Array<QueueEntry>> {
	const allEntries = await getAllStoredEntries();
	return allEntries.filter(entry => entry.sentBy === senderId);
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
	const allEntries = await getAllStoredEntriesFromSender(senderId);
	return allEntries.length;
}

// ** User Blacklist **

/**
 * Adds the user to the queue's blacklist in the database. That user will not
 * be able to submit media requests.
 *
 * @param userId The ID of the user to blacklist.
 */
export async function saveUserToStoredBlacklist(userId: Snowflake): Promise<void> {
	const config = await getStoredQueueConfig();
	const blacklist = new Set(config.blacklistedUsers);
	blacklist.add(userId);
	config.blacklistedUsers = Array.from(blacklist);

	await saveQueueConfig(config);
}

/**
 * Removes the user from the queue's blacklist in the database.
 *
 * @param userId The ID of the user to whitelist.
 */
export async function removeUserFromStoredBlacklist(userId: Snowflake): Promise<void> {
	const config = await getStoredQueueConfig();
	const blacklist = new Set(config.blacklistedUsers);
	blacklist.delete(userId);
	config.blacklistedUsers = Array.from(blacklist);

	await saveQueueConfig(config);
}
