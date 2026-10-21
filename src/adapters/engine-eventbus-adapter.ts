import type {EventName, IEventbus, TEventbusRemover} from '@eventbus/types.ts';
import type {EngineEvents, IEligiusEngine} from '../types.ts';
import type {IAdapter} from './types.ts';

/**
 * Bridges EligiusEngine to/from the eventbus.
 *
 * This adapter:
 * - Forwards engine events to eventbus broadcasts (the engine `error` event
 *   becomes `engine-error`)
 * - Forwards eventbus commands to engine methods
 * - Handles eventbus state queries by reading engine properties
 */
export class EngineEventbusAdapter implements IAdapter {
  private _engineEventRemovers: Array<() => void> = [];
  private _eventbusRemovers: TEventbusRemover[] = [];

  constructor(
    private _engine: IEligiusEngine,
    private _eventbus: IEventbus
  ) {}

  /**
   * Connect adapter - start listening and forwarding
   */
  connect(): void {
    this._subscribeToEngineEvents();
    this._subscribeToEventbusEvents();
  }

  /**
   * Disconnect adapter - stop all listeners
   */
  disconnect(): void {
    this._engineEventRemovers.forEach(remove => remove());
    this._engineEventRemovers = [];

    this._eventbusRemovers.forEach(remove => remove());
    this._eventbusRemovers = [];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Engine Events → Eventbus Broadcasts
  // ─────────────────────────────────────────────────────────────────────────

  private _subscribeToEngineEvents(): void {
    this._onEngineEvent('start', () => {
      this._eventbus.broadcast('timeline-play', []);
    });

    this._onEngineEvent('pause', () => {
      this._eventbus.broadcast('timeline-pause', []);
    });

    this._onEngineEvent('stop', () => {
      this._eventbus.broadcast('timeline-stop', []);
    });

    this._onEngineEvent('time', (position: number) => {
      this._eventbus.broadcast('timeline-time', [position]);
    });

    this._onEngineEvent('duration', (duration: number) => {
      this._eventbus.broadcast('timeline-duration', [() => duration]);
    });

    this._onEngineEvent(
      'seekStart',
      (target: number, current: number, duration: number) => {
        this._eventbus.broadcast('timeline-seek', [target, current, duration]);
      }
    );

    this._onEngineEvent(
      'seekComplete',
      (position: number, duration: number) => {
        this._eventbus.broadcast('timeline-seeked', [position, duration]);
      }
    );

    this._onEngineEvent('timelineChange', (uri: string) => {
      this._eventbus.broadcast('timeline-current-timeline-change', [uri]);
    });

    this._onEngineEvent('timelineComplete', () => {
      this._eventbus.broadcast('timeline-complete', []);
    });

    this._onEngineEvent('timelineFirstFrame', () => {
      this._eventbus.broadcast('timeline-firstframe', []);
    });

    this._onEngineEvent('timelineRestart', () => {
      this._eventbus.broadcast('timeline-restart', []);
    });

    this._onEngineEvent('error', error => {
      this._eventbus.broadcast('engine-error', [error]);
    });
  }

  private _onEngineEvent<K extends keyof EngineEvents>(
    event: K,
    handler: (...args: EngineEvents[K]) => void
  ): void {
    const remover = this._engine.on(event, handler);
    this._engineEventRemovers.push(remover);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Eventbus Commands → Engine Methods
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * This adapter is the only place where eventbus commands reach the engine;
   * the engine itself does not subscribe to them.
   */
  private _subscribeToEventbusEvents(): void {
    // Playback commands
    this._onEventbusEvent('timeline-play-request', () => {
      this._handleRejection('start', this._engine.start());
    });

    this._onEventbusEvent('timeline-pause-request', () => {
      this._engine.pause();
    });

    this._onEventbusEvent('timeline-stop-request', () => {
      this._handleRejection('stop', this._engine.stop());
    });

    this._onEventbusEvent('timeline-seek-request', (position: number) => {
      this._handleRejection('seek', this._engine.seek(position));
    });

    this._onEventbusEvent('timeline-play-toggle-request', () => {
      if (this._engine.playState === 'playing') {
        this._engine.pause();
      } else {
        this._handleRejection('start', this._engine.start());
      }
    });

    // Timeline management
    this._onEventbusEvent(
      'request-timeline-uri',
      (uri: string, position: number = 0) => {
        this._handleRejection(
          'switchTimeline',
          this._engine.switchTimeline(uri, position)
        );
      }
    );

    // State queries - using onRequest for synchronous responses
    this._registerRequest('request-current-timeline-position', () => {
      return this._engine.position;
    });

    this._registerRequest('timeline-duration-request', () => {
      return this._engine.duration;
    });

    this._registerRequest('timeline-container-request', () => {
      return this._engine.container;
    });

    this._registerRequest('request-engine-root', () => {
      return this._engine.engineRoot;
    });

    this._registerRequest('timeline-request-current-timeline', () => {
      return this._engine.currentTimelineUri;
    });
  }

  /**
   * Eventbus handlers cannot return the engine's promises to anyone, so
   * report a rejection here instead of leaving it unhandled.
   */
  private _handleRejection(command: string, result: unknown): void {
    if (result instanceof Promise) {
      result.catch(error => {
        console.error(
          `[EngineEventbusAdapter] engine.${command}() failed`,
          error
        );
      });
    }
  }

  private _onEventbusEvent(
    eventName: EventName,
    handler: (...args: any[]) => void
  ): void {
    const remover = this._eventbus.on(eventName, handler);
    this._eventbusRemovers.push(remover);
  }

  private _registerRequest<T>(
    eventName: string,
    responder: (...args: any[]) => T
  ): void {
    const remover = this._eventbus.onRequest(eventName, responder);
    this._eventbusRemovers.push(remover);
  }
}
