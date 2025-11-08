import { type RequestTimelineCleanupEvent } from "../request-timeline-cleanup.ts";
import { type IEventMetadata } from "./types.ts";

export function requestTimelineCleanup(): IEventMetadata<RequestTimelineCleanupEvent['args']> {
  return {
    description: `Event: request-timeline-cleanup`,
    category: `Engine Request`,
    args: []
  };
}
