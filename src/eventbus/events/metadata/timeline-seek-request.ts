import { type SeekRequestEvent } from "../timeline-seek-request.ts";
import { type IEventMetadata } from "./types.ts";

export function timelineSeekRequest(): IEventMetadata<SeekRequestEvent['args']> {
  return {
    description: `Event: timeline-seek-request`,
    category: `Timeline`,
    args: [
      {
        name: 'position',
        type: 'number'
      }]
  };
}
