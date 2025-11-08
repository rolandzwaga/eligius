import { type FirstFrameEvent } from "../timeline-firstframe.ts";
import { type IEventMetadata } from "./types.ts";

export function timelineFirstframe(): IEventMetadata<FirstFrameEvent['args']> {
  return {
    description: `Event: timeline-firstframe`,
    category: `Timeline`,
    args: []
  };
}
