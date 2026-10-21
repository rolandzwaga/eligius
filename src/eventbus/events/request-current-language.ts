import type {TLanguageCode} from '../../types.ts';

/**
 * Request: request-current-language
 * Answered through `eventbus.request('request-current-language')` by
 * LocaleEventbusAdapter with the active locale.
 * @returns The current language code
 * @category Engine Request
 */
export interface RequestCurrentLanguageEvent {
  name: 'request-current-language';
  args: [];
  returns: TLanguageCode;
}
