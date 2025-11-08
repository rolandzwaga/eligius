import { type DurationEvent } from "../timeline-duration.ts";
import { type IEventMetadata } from "./types.ts";

export function timelineDuration(): IEventMetadata<DurationEvent['args']> {
  return {
    description: `Event: timeline-duration`,
    category: `Timeline`,
    args: []
  };
}
