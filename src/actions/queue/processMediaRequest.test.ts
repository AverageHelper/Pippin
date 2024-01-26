import type { Mock } from "vitest";
import { beforeEach, describe, vi } from "vitest";

vi.mock("../../actions/messages/index.js");
vi.mock("../getVideoDetails.js");
vi.mock("../../useQueueStorage.js");

// ** Gather mockable actions

import { deleteMessage } from "../../actions/messages/index.js";
const mockDeleteMessage = deleteMessage as Mock<
	Parameters<typeof deleteMessage>,
	ReturnType<typeof deleteMessage>
>;

import { getMediaDetails } from "../getMediaDetails.js";
const mockGetMediaDetails = getMediaDetails as Mock<
	Parameters<typeof getMediaDetails>,
	ReturnType<typeof getMediaDetails>
>;

import {
	countAllStoredEntriesFromSender,
	getStoredQueueConfig,
	pushEntryToQueue
} from "../../useQueueStorage.js";
import type { QueueConfig, QueueEntry } from "../../useQueueStorage.js";
const mockCountAllStoredEntriesFromSender = countAllStoredEntriesFromSender as Mock<
	Parameters<typeof countAllStoredEntriesFromSender>,
	ReturnType<typeof countAllStoredEntriesFromSender>
>;
const mockGetStoredQueueConfig = getStoredQueueConfig as Mock<
	Parameters<typeof getStoredQueueConfig>,
	ReturnType<typeof getStoredQueueConfig>
>;
const mockPushEntryToQueue = pushEntryToQueue as Mock<
	Parameters<typeof pushEntryToQueue>,
	ReturnType<typeof pushEntryToQueue>
>;

const mockDeleteInvocation = vi.fn();
const mockReplyPrivately = vi.fn();
const mockFollowUp = vi.fn();

const mockChannelSend = vi.fn<[string], Promise<unknown>>();

// ** Import the unit-under-test

import type { CommandContext } from "../../commands/CommandContext.js";
import type { MediaRequest } from "./processMediaRequest.js";
import { processMediaRequest } from "./processMediaRequest.js";
import { useTestLogger } from "../../../tests/testUtils/logger.js";

describe("Media request pipeline", () => {
	let config: QueueConfig;
	let context: CommandContext;
	let request: MediaRequest;
	let newEntry: QueueEntry;

	beforeEach(() => {
		// ** Reset mocks for each run

		config = {
			blacklistedUsers: [],
			submissionMaxQuantity: null
		};

		context = {
			type: "message",
			deleteInvocation: mockDeleteInvocation,
			replyPrivately: mockReplyPrivately,
			followUp: mockFollowUp,
			message: {
				id: "some-message-1234",
				content: "This is a message object. Trust me, bro"
			},
			user: {
				id: "the-user"
			}
		} as unknown as CommandContext;

		request = {
			context,
			logger: useTestLogger(),
			publicPreemptiveResponse: Promise.resolve(null),
			mediaUrl: new URL("https://localhost:9999/")
		};

		newEntry = {
			url: request.mediaUrl,
			theMovieDbId: "1234",
			title: "Sample",
			year: "2000",
			sentAt: new Date(),
			sentBy: context.user.id
		};

		mockDeleteMessage.mockResolvedValue(true);
		mockGetMediaDetails.mockResolvedValue(null);
		mockPushEntryToQueue.mockResolvedValue(newEntry);
		mockCountAllStoredEntriesFromSender.mockResolvedValue(0);
		mockGetStoredQueueConfig.mockResolvedValue(config);
		mockDeleteInvocation.mockResolvedValue(undefined);
		mockReplyPrivately.mockResolvedValue(undefined);
		mockFollowUp.mockResolvedValue(undefined);
		mockChannelSend.mockResolvedValue(undefined);
	});
});
