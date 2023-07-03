import "../../../tests/testUtils/leakedHandles.js";

jest.mock("../../actions/messages/index.js");
jest.mock("../getVideoDetails.js");
jest.mock("../../useQueueStorage.js");

// ** Gather mockable actions

import { deleteMessage } from "../../actions/messages/index.js";
const mockDeleteMessage = deleteMessage as jest.Mock<Promise<boolean>>;

import type { MediaDetails } from "../getMediaDetails.js";
import { getMediaDetails } from "../getMediaDetails.js";
const mockGetMediaDetails = getMediaDetails as jest.Mock<Promise<MediaDetails | null>>;

import {
	countAllStoredEntriesFromSender,
	getStoredQueueConfig,
	pushEntryToQueue
} from "../../useQueueStorage.js";
import type { QueueConfig, QueueEntry, UnsentQueueEntry } from "../../useQueueStorage.js";
const mockCountAllStoredEntriesFromSender = countAllStoredEntriesFromSender as jest.Mock<
	Promise<number>
>;
const mockGetStoredQueueConfig = getStoredQueueConfig as jest.Mock<Promise<QueueConfig>>;
const mockPushEntryToQueue = pushEntryToQueue as jest.Mock<Promise<QueueEntry>, [UnsentQueueEntry]>;

const mockDeleteInvocation = jest.fn();
const mockReplyPrivately = jest.fn();
const mockFollowUp = jest.fn();

const mockChannelSend = jest.fn() as jest.Mock<Promise<unknown>, [string]>;

// ** Import the unit-under-test

import type { CommandContext } from "../../commands/CommandContext.js";
import type { MediaRequest } from "./processMediaRequest.js";
import { processMediaRequest } from "./processMediaRequest.js";
import { URL } from "node:url";
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
