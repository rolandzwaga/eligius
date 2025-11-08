import type {LanguageChangeEvent} from '../language-change.ts';
import type {IEventMetadata} from './types.ts';

export function languageChange(): IEventMetadata<LanguageChangeEvent['args']> {
  return {
    description: `Event: language-change`,
    category: `Language Manager`,
    args: [],
  };
}
