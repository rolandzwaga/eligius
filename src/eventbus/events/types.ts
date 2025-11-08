import type {BeforeRequestTimelineUriEvent} from './before-request-timeline-uri.ts';
import type {DomMutationEvent} from './dom-mutation.ts';
import type {LanguageChangeEvent} from './language-change.ts';
import type {RequestActionEvent} from './request-action.ts';
import type {RequestCurrentLanguageEvent} from './request-current-language.ts';
import type {RequestCurrentTimelinePositionEvent} from './request-current-timeline-position.ts';
import type {RequestEngineRootEvent} from './request-engine-root.ts';
import type {RequestFunctionEvent} from './request-function.ts';
import type {RequestInstanceEvent} from './request-instance.ts';
import type {RequestLabelCollectionEvent} from './request-label-collection.ts';
import type {RequestLabelCollectionsEvent} from './request-label-collections.ts';
import type {RequestTimelineCleanupEvent} from './request-timeline-cleanup.ts';
import type {RequestTimelineUriEvent} from './request-timeline-uri.ts';
import type {CompleteEvent} from './timeline-complete.ts';
import type {ContainerRequestEvent} from './timeline-container-request.ts';
import type {CurrentTimelineChangeEvent} from './timeline-current-timeline-change.ts';
import type {DurationEvent} from './timeline-duration.ts';
import type {DurationRequestEvent} from './timeline-duration-request.ts';
import type {FirstFrameEvent} from './timeline-firstframe.ts';
import type {PauseEvent} from './timeline-pause.ts';
import type {PauseRequestEvent} from './timeline-pause-request.ts';
import type {PlayEvent} from './timeline-play.ts';
import type {PlayRequestEvent} from './timeline-play-request.ts';
import type {PlayToggleRequestEvent} from './timeline-play-toggle-request.ts';
import type {RequestCurrentTimelineEvent} from './timeline-request-current-timeline.ts';
import type {ResizeEvent} from './timeline-resize.ts';
import type {ResizeRequestEvent} from './timeline-resize-request.ts';
import type {RestartEvent} from './timeline-restart.ts';
import type {SeekEvent} from './timeline-seek.ts';
import type {SeekRequestEvent} from './timeline-seek-request.ts';
import type {SeekedEvent} from './timeline-seeked.ts';
import type {StopEvent} from './timeline-stop.ts';
import type {StopRequestEvent} from './timeline-stop-request.ts';
import type {TimeEvent} from './timeline-time.ts';

/**
 * Union type of all event interfaces in the EventBus system.
 *
 * This type is automatically generated from all event interface files in
 * the `src/eventbus/events/` directory. Each event interface has a `name`
 * and `args` property that define the event's identity and argument types.
 *
 * @example
 * ```typescript
 * // Each event interface contributes to the union:
 * type Example = SeekRequestEvent | PlayRequestEvent | ...;
 * ```
 */
export type AllEvents =
  | BeforeRequestTimelineUriEvent
  | DomMutationEvent
  | LanguageChangeEvent
  | RequestActionEvent
  | RequestCurrentLanguageEvent
  | RequestCurrentTimelinePositionEvent
  | RequestEngineRootEvent
  | RequestFunctionEvent
  | RequestInstanceEvent
  | RequestLabelCollectionEvent
  | RequestLabelCollectionsEvent
  | RequestTimelineCleanupEvent
  | RequestTimelineUriEvent
  | CompleteEvent
  | ContainerRequestEvent
  | CurrentTimelineChangeEvent
  | DurationRequestEvent
  | DurationEvent
  | FirstFrameEvent
  | PauseRequestEvent
  | PauseEvent
  | PlayRequestEvent
  | PlayToggleRequestEvent
  | PlayEvent
  | RequestCurrentTimelineEvent
  | ResizeRequestEvent
  | ResizeEvent
  | RestartEvent
  | SeekRequestEvent
  | SeekEvent
  | SeekedEvent
  | StopRequestEvent
  | StopEvent
  | TimeEvent;

/**
 * Mapped type that associates event names with their argument types.
 *
 * This type provides the core type safety for the EventBus system by mapping
 * each event's string literal name to its tuple of typed arguments.
 *
 * @example
 * ```typescript
 * // EventMap maps event names to argument tuples:
 * type Example = EventMap['timeline-seek-request']; // [position: number]
 * type Example2 = EventMap['timeline-play-request']; // []
 *
 * // Used in generic constraints for type-safe broadcasting:
 * function broadcast<E extends EventName>(name: E, args: EventMap[E]) {
 *   // TypeScript enforces correct args for the given name
 * }
 * ```
 */
export type EventMap = {[K in AllEvents as K['name']]: K['args']};

/**
 * Union of all valid event name strings.
 *
 * This type provides autocomplete for event names and ensures only valid
 * event names are used in EventBus methods.
 *
 * @example
 * ```typescript
 * // EventName is a union of all event name strings:
 * type Example = EventName; // 'timeline-seek-request' | 'timeline-play-request' | ...
 *
 * // Enables autocomplete and type checking:
 * const eventName: EventName = 'timeline-seek-request'; // ✓ Valid
 * const invalid: EventName = 'invalid-event'; // ✗ Type error
 *
 * // Used in EventBus method signatures:
 * eventbus.broadcast<EventName>('timeline-play-request', []); // ✓ Autocomplete works
 * ```
 */
export type EventName = keyof EventMap;
