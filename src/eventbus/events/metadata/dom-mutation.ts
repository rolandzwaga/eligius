import { type DomMutationEvent } from "../dom-mutation.ts";
import { type IEventMetadata } from "./types.ts";

export function domMutation(): IEventMetadata<DomMutationEvent['args']> {
  return {
    description: `Event: dom-mutation`,
    category: `Controller`,
    args: [
      {
        name: 'payload',
        type: 'any'
      }]
  };
}
