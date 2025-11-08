import { type PlayEvent } from "../timeline-play.ts";
import { type IEventMetadata } from "./types.ts";

export function timelinePlay(): IEventMetadata<PlayEvent['args']> {
  return {
    description: `Event: timeline-play`,
    category: `Timeline`,
    args: []
  };
}
