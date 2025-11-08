/**
 * Metadata for an event in the EventBus system.
 *
 * This interface describes the structure of event metadata generated from
 * event interface definitions. Metadata is used for documentation, tooling,
 * and runtime validation.
 *
 * @template TArgs - The tuple type of event arguments
 *
 * @example
 * ```typescript
 * const seekMetadata: IEventMetadata<[position: number]> = {
 *   description: 'Event: timeline-seek-request',
 *   category: 'Timeline',
 *   args: [
 *     { name: 'position', type: 'number', description: 'Timeline position to seek to' }
 *   ]
 * };
 * ```
 */
export interface IEventMetadata<_TArgs extends any[] = any[]> {
  /** Human-readable description of the event, typically "Event: {event-name}" */
  description: string;

  /** Category grouping for the event (e.g., "Timeline", "Language", "Engine") */
  category: string;

  /** Metadata for each argument in the event's args tuple */
  args: Array<{
    /** Name of the argument (from labeled tuple element) */
    name: string;

    /** TypeScript type of the argument as a string (e.g., "number", "string") */
    type: string;

    /** Optional description of the argument from JSDoc @param tag */
    description?: string;
  }>;
}
