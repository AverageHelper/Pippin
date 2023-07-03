import "dotenv/config.js";

import { EnvVariableNotFoundError } from "../errors/EnvVariableNotFoundError.js";

export type EnvKey =
	| "BOT_PREFIX" // used for testing
	| "BOT_TEST_ID"
	| "CHANNEL_ID"
	| "CI"
	| "CORDE_BOT_ID"
	| "CORDE_TEST_TOKEN"
	| "DATABASE_SHEET_URL"
	| "DISCORD_TOKEN"
	| "GUILD_ID"
	| "LOG_LEVEL"
	| "NODE_ENV"
	| "QUEUE_CHANNEL_ID"
	| "THE_MOVIE_DB_API_KEY"
	| "QUEUE_ADMIN_ROLE_ID"
	| "QUEUE_CREATOR_ROLE_ID";

/**
 * Fetches the value of an environment variable key.
 *
 * @param key The key to find in the process environment variables.
 *
 * @returns the value of the environment variable key.
 */
export function getEnv(key: EnvKey): string | undefined {
	return process.env[key];
}

/**
 * Fetches the value of an environment variable key. If that value is not found, an error is thrown.
 *
 * @param key The key to find in the process environment variables.
 *
 * @throws an `EnvVariableNotFoundError` if there is no value set for the variable.
 * @returns the value of the environment variable key.
 */
export function requireEnv(key: EnvKey): string {
	const value = getEnv(key);
	if (value === undefined) throw new EnvVariableNotFoundError(key);
	return value;
}
