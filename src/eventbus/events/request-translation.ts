/**
 * Request: request-translation
 * Answered through `eventbus.request('request-translation', key, params)` by
 * LocaleEventbusAdapter with the translation for the key in the active
 * locale, see `ILocaleManager.t`.
 * @param key - Dot-notation translation key, or its segments
 * @param params - Optional values for the placeholders in the translation
 * @returns The translated text
 * @category Engine Request
 */
export interface RequestTranslationEvent {
  name: 'request-translation';
  args: [key: string | string[], params?: Record<string, unknown>];
  returns: string;
}
