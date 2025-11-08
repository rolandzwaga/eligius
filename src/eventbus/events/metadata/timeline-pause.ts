import { type PauseEvent } from "../timeline-pause.ts";
import { type IEventMetadata } from "./types.ts";

export function timelinePause(): IEventMetadata<PauseEvent['args']> {
  return {
    description: `Event: timeline-pause`,
    category: `Timeline`,
    args: []
  };
}
