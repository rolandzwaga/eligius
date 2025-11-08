import { type BeforeRequestTimelineUriEvent } from "../before-request-timeline-uri.ts";
import { type IEventMetadata } from "./types.ts";

export function beforeRequestTimelineUri(): IEventMetadata<BeforeRequestTimelineUriEvent['args']> {
  return {
    description: `Event: before-request-timeline-uri`,
    category: `Timeline`,
    args: []
  };
}
