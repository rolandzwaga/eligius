/**
 * Adapter interface for connecting components to the eventbus
 */
export interface IAdapter {
  /** Connect adapter - start listening and forwarding */
  connect(): void;

  /** Disconnect adapter - stop all listeners */
  disconnect(): void;
}
