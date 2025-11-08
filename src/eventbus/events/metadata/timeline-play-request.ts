import { type PlayRequestEvent } from "../timeline-play-request.ts";
import { type IEventMetadata } from "./types.ts";

export function timelinePlayRequest(): IEventMetadata<PlayRequestEvent['args']> {
  return {
    description: `Event: timeline-play-request`,
    category: `Timeline`,
    args: []
  };
}
