import type {
	ApplicationCommandOptionData,
	ApplicationCommandOptionType,
	ApplicationCommandSubCommandData,
	ApplicationCommandType,
	ChatInputApplicationCommandData,
	PermissionResolvable
} from "discord.js";
import type { CommandContext, GuildedCommandContext } from "./CommandContext.js";

export * from "./CommandContext.js";

interface BaseCommand
	extends Omit<
		ChatInputApplicationCommandData,
		"options" | "type" | "defaultMemberPermissions" | "dmPermission"
	> {
	readonly aliases?: ReadonlyArray<string>;
	readonly options?: Readonly<NonEmptyArray<ApplicationCommandOptionData>>;
	readonly type?: ApplicationCommandType.ChatInput;

	/**
	 * Deprecated commands are hidden from normal `/help` output,
	 * marked in user-facing contexts with a *"Deprecated"* note,
	 * and should be removed in the next Semver major version.
	 *
	 * Users may still invoke a deprecated command. Use such
	 * invocations this as opportunities to educate users about
	 * the command's alternatives, if any.
	 */
	readonly deprecated?: boolean;
}

export interface GlobalCommand extends BaseCommand {
	/** The default permissions that guild members must satisfy to be able to run the command. */
	readonly defaultMemberPermissions?: PermissionResolvable | null;

	/** Whether the command may be run in DMs. */
	readonly dmPermission: true;

	/**
	 * The command implementation. Receives contextual information about the
	 * command invocation. May return a `Promise`.
	 *
	 * @param context Contextual information about the command invocation.
	 */
	readonly execute: (context: CommandContext) => void | Promise<void>;
}

export interface GuildedCommand extends BaseCommand {
	/** The default permissions that guild members must satisfy to be able to run the command. */
	readonly defaultMemberPermissions?: PermissionResolvable | null;

	/** Whether the command may be run in DMs. */
	readonly dmPermission: false;

	/**
	 * The command implementation. Receives contextual information about the
	 * command invocation. May return a `Promise`.
	 *
	 * @param context Contextual information about the command invocation.
	 */
	readonly execute: (context: GuildedCommandContext) => void | Promise<void>;
}

/**
 * A top-level command description.
 */
export type Command = GlobalCommand | GuildedCommand;

interface BaseSubcommand
	extends Omit<
		ApplicationCommandSubCommandData,
		"type" | "defaultMemberPermissions" | "dmPermission"
	> {
	readonly type: ApplicationCommandOptionType.Subcommand;
}

export interface GlobalSubcommand extends BaseSubcommand {
	/** The default permissions that guild members must satisfy to be able to run the command. */
	readonly defaultMemberPermissions?: PermissionResolvable | null;

	/** Whether the command may be run in DMs. */
	readonly dmPermission: true;

	/**
	 * The command implementation. Receives contextual information about the
	 * command invocation. May return a `Promise`.
	 *
	 * @param context Contextual information about the command invocation.
	 */
	readonly execute: (context: CommandContext) => void | Promise<void>;
}

export interface GuildedSubcommand extends BaseSubcommand {
	/** The default permissions that guild members must satisfy to be able to run the command. */
	readonly defaultMemberPermissions?: PermissionResolvable | null;

	/** Whether the command may be run in DMs. */
	readonly dmPermission: false;

	/**
	 * The command implementation. Receives contextual information about the
	 * command invocation. May return a `Promise`.
	 *
	 * @param context Contextual information about the command invocation.
	 */
	readonly execute: (context: GuildedCommandContext) => void | Promise<void>;
}

export type Subcommand = GlobalSubcommand | GuildedSubcommand;
