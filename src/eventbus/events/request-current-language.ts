/**
 * Event: request-current-language
 * @param callback - Callback that receives the current language
 * @category Engine Request
 */
export interface RequestCurrentLanguageEvent {
  name: 'request-current-language';
  args: [callback: (language: string) => void];
}
