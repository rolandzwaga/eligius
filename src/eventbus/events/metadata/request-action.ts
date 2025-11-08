import { type RequestActionEvent } from "../request-action.ts";
import { type IEventMetadata } from "./types.ts";

export function requestAction(): IEventMetadata<RequestActionEvent['args']> {
  return {
    description: `Event: request-action`,
    category: `Engine Request`,
    args: []
  };
}
