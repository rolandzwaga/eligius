import { type ResizeEvent } from "../timeline-resize.ts";
import { type IEventMetadata } from "./types.ts";

export function timelineResize(): IEventMetadata<ResizeEvent['args']> {
  return {
    description: `Event: timeline-resize`,
    category: `Timeline`,
    args: []
  };
}
