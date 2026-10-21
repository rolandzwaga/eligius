import type {IController} from '@controllers/types.js';
import type {
  EventMap,
  EventName,
  IEventbus,
  TEventbusRemover,
} from '@eventbus/types.js';
import type {TOperationData} from '@operation/types.js';

/**
 * Abstract base class for controllers providing standardized event listener management
 *
 * Benefits:
 * - Eliminates boilerplate event listener tracking code
 * - Automatic binding of event handlers to controller instance
 * - Handler arguments are type checked against the event's argument tuple
 * - Centralized cleanup preventing memory leaks
 * - An attached-state guard, so a second attach never duplicates listeners
 *
 * @example
 * ```typescript
 * class MyController extends BaseController<IMyOperationData> {
 *   name = 'MyController';
 *
 *   init(operationData: IMyOperationData): void {
 *     this.operationData = operationData;
 *   }
 *
 *   attach(eventbus: IEventbus): void {
 *     this.beginAttach(eventbus);
 *     this.addListener(eventbus, 'timeline-time', this.handleTime);
 *     // Handler automatically bound, cleanup tracked
 *   }
 *
 *   private handleTime(position: number): void {
 *     // 'this' context preserved
 *   }
 * }
 * ```
 */
export abstract class BaseController<T extends TOperationData>
  implements IController<T>
{
  // Public properties (required by IController)
  public operationData: T | null = null;
  public abstract name: string;

  // Protected state
  protected eventListeners: TEventbusRemover[] = [];
  /** True between {@link BaseController.beginAttach} and the next detach. */
  protected isAttached = false;

  /**
   * Register event listener with automatic binding and cleanup tracking
   *
   * @param eventbus - The eventbus to register with
   * @param eventName - Name of the event to listen for
   * @param handler - Event handler function (will be bound to this controller).
   * Its parameters must match the event's argument tuple.
   */
  protected addListener<E extends EventName>(
    eventbus: IEventbus,
    eventName: E,
    handler: (this: this, ...args: EventMap[E]) => void
  ): void {
    const boundHandler = handler.bind(this) as (...args: EventMap[E]) => void;
    const remover = eventbus.on(eventName, boundHandler);
    this.eventListeners.push(remover);
  }

  /**
   * Call at the start of `attach`. When the controller is still attached, it
   * is detached first, so attaching twice replaces the previous attachment
   * instead of registering every listener (and any DOM it builds) twice.
   *
   * @param eventbus - The eventbus passed to `attach`
   */
  protected beginAttach(eventbus: IEventbus): void {
    if (this.isAttached) {
      this.detach(eventbus);
    }
    this.isAttached = true;
  }

  /**
   * Clean up all tracked event listeners
   * Prevents memory leaks by removing all registered handlers
   *
   * @param _eventbus - The eventbus (ignored, included for IController compatibility)
   */
  public detach(_eventbus: IEventbus): void {
    this.eventListeners.forEach(remover => remover());
    this.eventListeners = [];
    this.isAttached = false;
  }

  // Abstract methods (must be implemented by subclasses)
  public abstract init(operationData: T): void;
  public abstract attach(eventbus: IEventbus): Promise<any> | void;
}
