import { type RequestCurrentTimelinePositionEvent } from "../request-current-timeline-position.ts";
import { type IEventMetadata } from "./types.ts";

export function requestCurrentTimelinePosition(): IEventMetadata<RequestCurrentTimelinePositionEvent['args']> {
  return {
    description: `Event: request-current-timeline-position`,
    category: `Engine Request`,
    args: []
  };
}
