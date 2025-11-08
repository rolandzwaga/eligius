import type {
  EventName,
  IEventbus,
  TEventbusRemover,
} from '../eventbus/types.js';
import type {TOperationData} from '../operation/types.js';
import type {IController} from './types.js';

/**
 * Abstract base class for controllers providing standardized event listener management
 *
 * Benefits:
 * - Eliminates boilerplate event listener tracking code
 * - Automatic binding of event handlers to controller instance
 * - Centralized cleanup preventing memory leaks
 * - Consistent event management pattern across all controllers
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
 *     this.addListener(eventbus, 'my-event', this.handleMyEvent);
 *     // Handler automatically bound, cleanup tracked
 *   }
 *
 *   private handleMyEvent(): void {
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

  /**
   * Register event listener with automatic binding and cleanup tracking
   *
   * @param eventbus - The eventbus to register with
   * @param eventName - Name of the event to listen for
   * @param handler - Event handler function (will be bound to this controller)
   */
  protected addListener(
    eventbus: IEventbus,
    eventName: EventName,
    handler: (...args: any[]) => void
  ): void {
    const boundHandler = handler.bind(this);
    const remover = eventbus.on(eventName, boundHandler as any);
    this.eventListeners.push(remover);
  }

  /**
   * Register multiple event listeners at once
   *
   * @param eventbus - The eventbus to register with
   * @param listeners - Array of {eventName, handler} pairs
   */
  protected attachMultiple(
    eventbus: IEventbus,
    listeners: Array<{eventName: string; handler: (...args: any[]) => void}>
  ): void {
    listeners.forEach(({eventName, handler}) => {
      this.addListener(eventbus, eventName as EventName, handler);
    });
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
  }

  // Abstract methods (must be implemented by subclasses)
  public abstract init(operationData: T): void;
  public abstract attach(eventbus: IEventbus): Promise<any> | void;
}
