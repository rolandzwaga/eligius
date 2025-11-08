import { type CurrentTimelineChangeEvent } from "../timeline-current-timeline-change.ts";
import { type IEventMetadata } from "./types.ts";

export function timelineCurrentTimelineChange(): IEventMetadata<CurrentTimelineChangeEvent['args']> {
  return {
    description: `Event: timeline-current-timeline-change`,
    category: `Timeline`,
    args: []
  };
}
