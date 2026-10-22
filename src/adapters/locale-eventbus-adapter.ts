/**
 * LocaleEventbusAdapter - Bridges LocaleManager to/from the eventbus
 * Feature: 005-rosetta-locale-manager
 *
 * This adapter:
 * - Forwards LocaleManager events to eventbus broadcasts
 * - Forwards eventbus language commands to LocaleManager methods
 * - Handles eventbus state queries by reading LocaleManager properties
 * - Updates DOM lang attribute when locale changes
 */

import type {IAdapter} from '@adapters/types.ts';
import type {EventName, IEventbus, TEventbusRemover} from '@eventbus/types.ts';
import type {
  ILocaleManager,
  LocaleEvents,
  TLanguageCode,
} from '@locale/types.ts';
import type {IEligiusEngine} from '@/types.ts';

/**
 * Bridges LocaleManager to/from the eventbus.
 *
 * Note: Requires engine reference to update DOM lang attribute on locale change.
 */
export class LocaleEventbusAdapter implements IAdapter {
  private _localeEventRemovers: Array<() => void> = [];
  private _eventbusRemovers: TEventbusRemover[] = [];
  /**
   * True while this adapter is broadcasting a LocaleManager change to the
   * eventbus. The eventbus handler ignores that broadcast, otherwise it would
   * call setLocale again and the two would feed each other forever.
   */
  private _forwardingToEventbus = false;
  /**
   * True while this adapter is applying an eventbus `language-change` command
   * to the LocaleManager. The resulting manager change is not rebroadcast,
   * because every eventbus listener already received the original command.
   */
  private _handlingEventbusCommand = false;
  private _connected = false;

  constructor(
    private _localeManager: ILocaleManager,
    private _eventbus: IEventbus,
    private _engine: IEligiusEngine
  ) {}

  /**
   * Connect adapter - start listening and forwarding. Calling it again while
   * connected does nothing.
   */
  connect(): void {
    if (this._connected) {
      return;
    }
    this._connected = true;
    this._subscribeToLocaleManagerEvents();
    this._subscribeToEventbusEvents();
  }

  /**
   * Disconnect adapter - stop all listeners
   */
  disconnect(): void {
    this._connected = false;
    this._localeEventRemovers.forEach(remove => remove());
    this._localeEventRemovers = [];

    this._eventbusRemovers.forEach(remove => remove());
    this._eventbusRemovers = [];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LocaleManager Events → Eventbus Broadcasts
  // ─────────────────────────────────────────────────────────────────────────

  private _subscribeToLocaleManagerEvents(): void {
    this._onLocaleEvent(
      'change',
      (newLocale: TLanguageCode, _oldLocale: TLanguageCode) => {
        this._setRootElementLang(newLocale);

        if (this._handlingEventbusCommand) {
          // Change originated from the eventbus; listeners already have it.
          return;
        }

        this._forwardingToEventbus = true;
        try {
          this._eventbus.broadcast('language-change', [newLocale]);
        } finally {
          this._forwardingToEventbus = false;
        }
      }
    );
  }

  private _onLocaleEvent<K extends keyof LocaleEvents>(
    event: K,
    handler: (...args: LocaleEvents[K]) => void
  ): void {
    const remover = this._localeManager.on(event, handler);
    this._localeEventRemovers.push(remover);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Eventbus Commands → LocaleManager Methods
  // ─────────────────────────────────────────────────────────────────────────

  private _subscribeToEventbusEvents(): void {
    // Language change command
    this._onEventbusEvent('language-change', (language: TLanguageCode) => {
      if (this._forwardingToEventbus) {
        // This is our own rebroadcast of a LocaleManager change.
        return;
      }

      // Check if locale is available before switching
      if (!this._localeManager.availableLocales.includes(language)) {
        console.warn(
          `[LocaleEventbusAdapter] Locale '${language}' is not available. Available locales: ${this._localeManager.availableLocales.join(', ')}`
        );
        return;
      }

      this._handlingEventbusCommand = true;
      try {
        this._localeManager.setLocale(language);
      } finally {
        this._handlingEventbusCommand = false;
      }
      this._setRootElementLang(language);
    });

    // State queries - using onRequest for synchronous responses
    this._registerRequest('request-current-language', () => {
      return this._localeManager.locale;
    });

    // Translation request - exposes t() method via eventbus
    this._registerRequest(
      'request-translation',
      (key: string | string[], params?: Record<string, unknown>) => {
        return this._localeManager.t(key, params);
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

  private _setRootElementLang(locale: TLanguageCode): void {
    const lang = this._extractPrimaryLanguage(locale);
    this._engine.engineRoot.attr('lang', lang);
  }

  private _extractPrimaryLanguage(locale: TLanguageCode): string {
    return locale.split('-').shift() as string;
  }
}
