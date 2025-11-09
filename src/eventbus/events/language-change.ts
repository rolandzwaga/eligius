import type {TLanguageCode} from '../../types.ts';

/**
 * Event: language-change
 * @param language - The new language code
 * @category Language Manager
 */
export interface LanguageChangeEvent {
  name: 'language-change';
  args: [language: TLanguageCode];
}
