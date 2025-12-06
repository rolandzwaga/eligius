import {setGlobal} from '@operation/helper/set-global.ts';
import {TypedEventEmitter} from '@util/typed-event-emitter.ts';
import type {
  ILabel,
  ILanguageLabel,
  ILanguageManager,
  LanguageEvents,
  TLanguageCode,
} from './types.ts';

/**
 * Manages multi-language labels with explicit, testable API.
 *
 * This class manages the labels for an {@link IEligiusEngine} instance.
 * It provides a pure API for language management and emits events for language changes.
 *
 * Eventbus integration is handled by LanguageEventbusAdapter.
 */
export class LanguageManager implements ILanguageManager {
  private _labelLookup: Record<string, ILabel[]>;
  private _emitter = new TypedEventEmitter<LanguageEvents>();
  private _availableLanguages: string[] = [];

  // ─────────────────────────────────────────────────────────────────────────
  // STATE - ILanguageManager interface
  // ─────────────────────────────────────────────────────────────────────────

  /** Current language code (e.g., 'en-US', 'nl-NL') */
  get language(): string {
    return this._currentLanguage;
  }

  /** List of available language codes, derived from unique languages in label collections */
  get availableLanguages(): string[] {
    return this._availableLanguages;
  }

  constructor(
    private _currentLanguage: TLanguageCode,
    labels: ILanguageLabel[]
  ) {
    if (!_currentLanguage) {
      throw new Error('language ctor arg cannot have zero length');
    }
    setGlobal('defaultLanguage', _currentLanguage);
    this._labelLookup = this._createLabelLookup(labels);
    this._availableLanguages = this._extractAvailableLanguages(labels);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EVENTS - ILanguageManager interface
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Subscribe to language manager events
   * @param event - Event name
   * @param handler - Event handler
   * @returns Unsubscribe function
   */
  on<K extends keyof LanguageEvents>(
    event: K,
    handler: (...args: LanguageEvents[K]) => void
  ): () => void {
    return this._emitter.on(event, handler);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // COMMANDS - ILanguageManager interface
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Change the current language
   * @param language - New language code
   * @throws If language code is empty or null
   */
  setLanguage(language: TLanguageCode): void {
    if (!language || language.length === 0) {
      throw new Error('Language cannot be empty');
    }

    const previousLanguage = this._currentLanguage;
    this._currentLanguage = language;

    this._emitter.emit('change', language, previousLanguage);
  }

  /**
   * Get a label collection by ID
   * @param collectionId - Label collection ID
   * @returns Label array or undefined if not found
   */
  getLabelCollection(collectionId: string): ILabel[] | undefined {
    return this._labelLookup[collectionId];
  }

  /**
   * Get multiple label collections by IDs
   * @param collectionIds - Array of label collection IDs
   * @returns Array of label arrays (undefined for not found collections)
   */
  getLabelCollections(collectionIds: string[]): (ILabel[] | undefined)[] {
    return collectionIds.map(id => this._labelLookup[id]);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LIFECYCLE - ILanguageManager interface
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Clean up resources
   */
  destroy(): void {
    this._emitter.removeAllListeners();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────────────────

  private _createLabelLookup(labels: ILanguageLabel[]) {
    return labels.reduce<Record<string, ILabel[]>>((acc, label) => {
      acc[label.id] = label.labels;
      return acc;
    }, {});
  }

  private _extractAvailableLanguages(labels: ILanguageLabel[]): string[] {
    const languages = new Set<string>();
    for (const labelCollection of labels) {
      for (const label of labelCollection.labels) {
        languages.add(label.languageCode);
      }
    }
    return Array.from(languages);
  }
}
