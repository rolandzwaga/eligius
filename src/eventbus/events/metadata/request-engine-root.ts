import { type RequestEngineRootEvent } from "../request-engine-root.ts";
import { type IEventMetadata } from "./types.ts";

export function requestEngineRoot(): IEventMetadata<RequestEngineRootEvent['args']> {
  return {
    description: `Event: request-engine-root`,
    category: `Engine Request`,
    args: []
  };
}
