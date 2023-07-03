import { array, create, date, nonempty, nullable, number, string, type } from "superstruct";
import { url } from "./url";

// MARK: - Movie Suggestion

export const movieSuggestion = type({
	url: url(),
	theMovieDbId: nonempty(string()),
	title: nonempty(string()),
	year: string(),
	sentAt: date(),
	sentBy: nonempty(string())
});

export type MovieSuggestion = typeof movieSuggestion.TYPE;

export function movieSuggestionFromRaw(value: unknown): MovieSuggestion {
	return create(value, movieSuggestion);
}

// MARK: - Preferences

export const preferences = type({
	messageCommandPrefix: nonempty(string())
});

export type Preferences = typeof preferences.TYPE;

export function preferencesFromRaw(value: unknown): Preferences {
	return create(value, preferences);
}

// MARK: - QueueConfig

export const queueConfig = type({
	blacklistedUsers: nullable(array(nonempty(string()))),
	submissionMaxQuantity: nullable(number())
});

export type QueueConfig = typeof queueConfig.TYPE;

export function queueConfigFromRaw(value: unknown): QueueConfig {
	return create(value, queueConfig);
}
