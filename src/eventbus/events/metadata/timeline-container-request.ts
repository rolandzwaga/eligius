import { type ContainerRequestEvent } from "../timeline-container-request.ts";
import { type IEventMetadata } from "./types.ts";

export function timelineContainerRequest(): IEventMetadata<ContainerRequestEvent['args']> {
  return {
    description: `Event: timeline-container-request`,
    category: `Timeline`,
    args: [
      {
        name: 'callback',
        type: '(element: HTMLElement) => void'
      }]
  };
}
