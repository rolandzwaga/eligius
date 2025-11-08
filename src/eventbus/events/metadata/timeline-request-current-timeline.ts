import { type RequestCurrentTimelineEvent } from "../timeline-request-current-timeline.ts";
import { type IEventMetadata } from "./types.ts";

export function timelineRequestCurrentTimeline(): IEventMetadata<RequestCurrentTimelineEvent['args']> {
  return {
    description: `Event: timeline-request-current-timeline`,
    category: `Engine Request`,
    args: []
  };
}
