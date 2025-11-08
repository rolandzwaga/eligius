/**
 * Contract: Event Interface Definition
 *
 * Defines the structure every event interface MUST follow.
 * This contract is enforced at compile-time by TypeScript.
 */

/**
 * Base structure for all event definitions.
 *
 * Every event interface MUST:
 * - Have a `name` property with a string literal type
 * - Have an `args` property with a tuple type
 * - Export the interface
 * - Have JSDoc documentation
 * - Optionally include @category tag
 * - Optionally include @private tag to exclude from metadata
 *
 * @example
 * ```typescript
 * // Event with arguments
 * /**
 *  * Request to seek to a specific position in the timeline
 *  * @category Timeline Control
 *  *\/
 * export interface TimelineSeekRequestEvent {
 *   name: 'timeline-seek-request';
 *   args: [position: number];
 * }
 *
 * // Event without arguments
 * /**
 *  * Request to play the timeline
 *  * @category Timeline Control
 *  *\/
 * export interface TimelinePlayRequestEvent {
 *   name: 'timeline-play-request';
 *   args: [];
 * }
 *
 * // Private event (excluded from metadata)
 * /**
 *  * Internal engine event
 *  * @private
 *  * @category Internal
 *  *\/
 * export interface InternalDebugEvent {
 *   name: 'internal-debug';
 *   args: [data: unknown];
 * }
 * ```
 */
export interface EventInterface<
  TName extends string,
  TArgs extends readonly any[],
> {
  /**
   * Unique event name as string literal type.
   * MUST be kebab-case for consistency.
   * MUST be unique across all events.
   */
  name: TName;

  /**
   * Event arguments as tuple type.
   * Use [] for events with no arguments.
   * Tuple elements SHOULD have descriptive names.
   */
  args: TArgs;
}

/**
 * Contract constraints (enforced by TypeScript and metadata generator):
 *
 * 1. FILE ORGANIZATION:
 *    - One event interface per file
 *    - File name matches event name in kebab-case
 *    - Located in src/eventbus/events/
 *
 * 2. NAMING:
 *    - Interface name: PascalCase ending with "Event" (e.g., TimelineSeekRequestEvent)
 *    - Event name: kebab-case string literal (e.g., 'timeline-seek-request')
 *    - File name: matches event name (e.g., timeline-seek-request.ts)
 *
 * 3. TYPE STRUCTURE:
 *    - name MUST be string literal type (not generic string)
 *    - args MUST be tuple type (not array or any[])
 *    - args tuple elements SHOULD have names (e.g., [position: number])
 *
 * 4. DOCUMENTATION:
 *    - Interface MUST have JSDoc comment
 *    - Description SHOULD explain when event is broadcast/handled
 *    - @category tag RECOMMENDED for grouping (defaults to 'unknown')
 *    - @private tag OPTIONAL to exclude from public metadata
 *
 * 5. EXPORTS:
 *    - Interface MUST be exported
 *    - No other exports in event definition files
 *
 * 6. VALIDATION:
 *    - Duplicate event names cause TypeScript error (duplicate keys in EventMap)
 *    - Invalid args type causes metadata generator error
 *    - Missing JSDoc causes metadata generator warning
 */

/**
 * Example violations and their consequences:
 *
 * VIOLATION: Non-literal name type
 * ```typescript
 * export interface BadEvent {
 *   name: string; // ❌ Must be string literal
 *   args: [];
 * }
 * ```
 * CONSEQUENCE: EventMap will not correctly map event name
 *
 * VIOLATION: Array instead of tuple
 * ```typescript
 * export interface BadEvent {
 *   name: 'bad-event';
 *   args: number[]; // ❌ Must be tuple
 * }
 * ```
 * CONSEQUENCE: Handler args will not be correctly typed
 *
 * VIOLATION: Missing export
 * ```typescript
 * interface BadEvent { // ❌ Must be exported
 *   name: 'bad-event';
 *   args: [];
 * }
 * ```
 * CONSEQUENCE: Event will not be included in EventMap
 *
 * VIOLATION: Duplicate event name
 * ```typescript
 * // File: event-one.ts
 * export interface EventOne {
 *   name: 'my-event';
 *   args: [];
 * }
 *
 * // File: event-two.ts
 * export interface EventTwo {
 *   name: 'my-event'; // ❌ Duplicate name
 *   args: [data: string];
 * }
 * ```
 * CONSEQUENCE: TypeScript error - duplicate object key in EventMap
 */
