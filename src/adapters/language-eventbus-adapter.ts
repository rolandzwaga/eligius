import type {EventName, IEventbus, TEventbusRemover} from '@eventbus/types.ts';
import type {
  IEligiusEngine,
  ILabel,
  ILanguageManager,
  LanguageEvents,
  TLanguageCode,
} from '../types.ts';
import type {IAdapter} from './types.ts';

/**
 * Bridges LanguageManager to/from the eventbus.
 *
 * This adapter:
 * - Forwards language manager events to eventbus broadcasts
 * - Forwards eventbus language commands to language manager methods
 * - Handles eventbus state queries by reading language manager properties
 * - Updates DOM lang attribute when language changes
 *
 * Note: Requires engine reference to update DOM lang attribute on language change
 */
export class LanguageEventbusAdapter implements IAdapter {
  private _languageEventRemovers: Array<() => void> = [];
  private _eventbusRemovers: TEventbusRemover[] = [];

  constructor(
    private _languageManager: ILanguageManager,
    private _eventbus: IEventbus,
    private _engine: IEligiusEngine
  ) {}

  /**
   * Connect adapter - start listening and forwarding
   */
  connect(): void {
    this._subscribeToLanguageManagerEvents();
    this._subscribeToEventbusEvents();
  }

  /**
   * Disconnect adapter - stop all listeners
   */
  disconnect(): void {
    this._languageEventRemovers.forEach(remove => remove());
    this._languageEventRemovers = [];

    this._eventbusRemovers.forEach(remove => remove());
    this._eventbusRemovers = [];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LanguageManager Events → Eventbus Broadcasts
  // ─────────────────────────────────────────────────────────────────────────

  private _subscribeToLanguageManagerEvents(): void {
    this._onLanguageEvent(
      'change',
      (language: TLanguageCode, _previousLanguage: TLanguageCode) => {
        this._setRootElementLang(language);
        this._eventbus.broadcast('language-change', [language]);
      }
    );
  }

  private _onLanguageEvent<K extends keyof LanguageEvents>(
    event: K,
    handler: (...args: LanguageEvents[K]) => void
  ): void {
    const remover = this._languageManager.on(event, handler);
    this._languageEventRemovers.push(remover);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Eventbus Commands → LanguageManager Methods
  // ─────────────────────────────────────────────────────────────────────────

  private _subscribeToEventbusEvents(): void {
    // Language change command
    this._onEventbusEvent('language-change', (language: TLanguageCode) => {
      this._languageManager.setLanguage(language);
      this._setRootElementLang(language);
    });

    // State queries - using onRequest for synchronous responses
    this._registerRequest('request-current-language', () => {
      return this._languageManager.language;
    });

    this._registerRequest(
      'request-label-collection',
      (labelId: string): ILabel[] | undefined => {
        return this._languageManager.getLabelCollection(labelId);
      }
    );

    this._registerRequest(
      'request-label-collections',
      (labelIds: string[]): (ILabel[] | undefined)[] => {
        return this._languageManager.getLabelCollections(labelIds);
      }
    );
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

  // ─────────────────────────────────────────────────────────────────────────
  // DOM Updates
  // ─────────────────────────────────────────────────────────────────────────

  private _setRootElementLang(language: TLanguageCode): void {
    const lang = this._extractPrimaryLanguage(language);
    this._engine.engineRoot.attr('lang', lang);
  }

  private _extractPrimaryLanguage(culture: TLanguageCode): string {
    return culture.split('-').shift() as string;
  }
}
