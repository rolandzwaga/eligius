import { type RequestFunctionEvent } from "../request-function.ts";
import { type IEventMetadata } from "./types.ts";

export function requestFunction(): IEventMetadata<RequestFunctionEvent['args']> {
  return {
    description: `Event: request-function`,
    category: `Engine Request`,
    args: []
  };
}
