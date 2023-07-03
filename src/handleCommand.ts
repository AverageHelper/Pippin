import type { Logger } from "./logger.js";
import type { Message } from "discord.js";
import type { Response, ResponseContext } from "./helpers/randomStrings.js";
import { getEnv } from "./helpers/environment.js";
import { getUserIdFromMention } from "./helpers/getUserIdFromMention.js";
import { logUser } from "./helpers/logUser.js";
import { SLASH_COMMAND_INTENT_PREFIX } from "./constants/database.js";
import { timeoutSeconds } from "./helpers/timeoutSeconds.js";
import { isNonEmptyArray } from "./helpers/guards.js";
import { reply as _reply } from "./actions/messages/index.js";
import {
	randomGreeting,
	randomHug,
	randomPhrase,
	randomQuestion,
	unwrappingWith
} from "./helpers/randomStrings.js";

/**
 * The method that was used to invoke a command via a normal Discord message.
 *
 * Slash-commands and other interactions do not apply here, because those
 * interactions skip the message parser.
 *
 * A `"bot-mention"` invocation happens when the user mentions the bot user
 * directly. (e.g. "@bot help")
 *
 * A `"slash"` invocation happens when the user attempts to use a Discord
 * Slash Command, but Discord didn't catch that that's what the user was doing.
 * (e.g. "/help")
 */
type InvocationMethod = "bot-mention" | "slash";

interface QueryMessage {
	/** The command name and arguments. */
	query: Array<string>;

	/** The method the user used to invoke the command. */
	invocationMethod: InvocationMethod;
}

/**
 * Parses a message and returns a command query if one exists.
 *
 * If the message starts with a ping to the bot, then we assume no command prefix
 * and return the message verbatim as a query. Otherwise, we check the first word
 * for the command prefix. If that exists, then the prefix is trimmed and the message
 * is returned as a query.
 *
 * Non-query messages will resolve to an `undefined` query, and should be ignored.
 *
 * @param message The message to parse.
 * @param logger The place to write system messages.
 *
 * @returns The command query. The first argument is the command name, and the rest are arguments.
 */
function queryFromMessage(message: Message, logger: Logger): QueryMessage | null {
	const client = message.client;
	const content = message.content.trim();
	const query = content.split(/ +/u);

	const firstWord = query[0];
	if (firstWord === undefined || firstWord === "") return null;

	const mentionedUserId = getUserIdFromMention(firstWord);
	if (mentionedUserId !== null) {
		// See if it's for us.
		if (client.isReady() && mentionedUserId === client.user.id) {
			logger.debug("They're talking to me!");
			// It's for us. Return the query verbatim.
			return { query: query.slice(1), invocationMethod: "bot-mention" };
		}

		// It's not for me.
		logger.debug("They're not talking to me. Ignoring.");
		return null;
	}

	// See if it's an interaction-command intent
	if (content.startsWith(SLASH_COMMAND_INTENT_PREFIX)) {
		// get rid of the slash
		query[0] = query[0]?.slice(SLASH_COMMAND_INTENT_PREFIX.length) ?? "";
		query.forEach(s => s.trim());
		return { query, invocationMethod: "slash" };
	}

	// This is where we would see if it's a message-command intent, but (*T'challa voice*) we don't do that here

	// It's not for me.
	logger.debug("They're not talking to me. Ignoring.");
	return null;
}

/** Resolves guild member information for the bot and for the user who invoked the interaction. */
async function responseContext(message: Message): Promise<ResponseContext> {
	let me: string;
	const otherUser = message.author;
	const otherMember = (await message.guild?.members.fetch(otherUser)) ?? null;

	const client = message.client;
	if (client.isReady()) {
		me = (await message.guild?.members.fetch(client.user.id))?.nickname ?? client.user.username;
	} else {
		me = "Me";
	}

	return { me, otherUser, otherMember };
}

/**
 * Performs actions from a Discord message. The command is ignored if the
 * message is from a bot or the message does not begin with the guild's
 * configured command prefix.
 *
 * @param message The Discord message to handle.
 * @param logger The place to write system messages.
 */
export async function handleCommand(message: Message, logger: Logger): Promise<void> {
	// Don't respond to bots unless we're being tested
	if (
		message.author.bot &&
		(message.author.id !== getEnv("CORDE_BOT_ID") || getEnv("NODE_ENV") !== "test-mocha")
	) {
		logger.debug("Momma always said not to talk to strangers. They could be *bots* ");
		return;
	}

	// Ignore self messages
	if (message.author.id === message.client.user?.id) return;

	// Don't bother with empty messages
	const content = message.content.trim();
	if (!content) return;

	logger.debug(
		`User ${logUser(message.author)} sent message: '${content.slice(0, 20)}${
			content.length > 20 ? "...' (trimmed)" : "'"
		}`
	);

	const parsedQuery = queryFromMessage(message, logger);
	if (!parsedQuery) return; // Don't bother with normal chatter
	const { query, invocationMethod } = parsedQuery;

	if (!isNonEmptyArray(query)) {
		// This is a query for us to handle (we might've been pinged), but it's empty.
		const ctx = await responseContext(message);
		return await unwrappingWith(ctx, randomQuestion(), r => _reply(message, r));
	}

	if (invocationMethod === "slash") {
		// TODO: Educate the masses on Slash Commands
		// const commandPrefix = await getCommandPrefix(message.guild);
		// await message.reply(
		// 	`It seems like you tried a Slash Command (\`${SLASH_COMMAND_INTENT_PREFIX}${givenCommandName}\`), but Discord thought you were going for a normal message. If your text field doesn't show a command name above it as you type, Discord doesn't think you're writing a command.\n\nI'll take your message like an old-style command (\`${commandPrefix}${givenCommandName}\`) for now, but you might wanna practice your slasher skills for next time :P`
		// );
		return; // Comment this to continue handling the interaction even tho it's wrong
	}

	// Here's where we would run the specified command, but (*T'challa voice*) we don't do that here

	// Some helpers for parsing intents
	const messageContainsWord = (str: string): boolean =>
		query.map(s => s.toLowerCase()).includes(str);
	const messageContainsOneOfWords = (strs: ReadonlyArray<string>): boolean =>
		query.map(s => s.toLowerCase()).some(s => strs.includes(s));

	if (invocationMethod === "bot-mention") {
		// This is likely a game. Play along!
		void message.channel.sendTyping();
		logger.debug(
			`Started typing in channel ${message.channel.id} due to handleCommand receiving a game`
		);
		await timeoutSeconds(2);

		let wrapped: Response;

		if (messageContainsWord("hello")) {
			wrapped = randomGreeting();
		} else if (
			messageContainsOneOfWords([
				"hug",
				"hug?",
				"hug!",
				"hugs",
				"hugs?",
				"hugs!",
				"*hugs",
				"hugs*",
				"*hugs*",
				"hugs,",
				"hug"
			])
		) {
			wrapped = randomHug();
		} else {
			wrapped = randomPhrase();
		}

		const ctx = await responseContext(message);
		await unwrappingWith(ctx, wrapped, r => message.channel.send(r));
	}
}
