import { type RequestCurrentLanguageEvent } from "../request-current-language.ts";
import { type IEventMetadata } from "./types.ts";

export function requestCurrentLanguage(): IEventMetadata<RequestCurrentLanguageEvent['args']> {
  return {
    description: `Event: request-current-language`,
    category: `Engine Request`,
    args: [
      {
        name: 'callback',
        type: '(language: string) => void'
      }]
  };
}
