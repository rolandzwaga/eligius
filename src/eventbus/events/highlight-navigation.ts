/**
 * Event: highlight-navigation
 * @param videoUrlIndex - The index of the video URL to highlight
 * @category Navigation
 */
export interface HighlightNavigationEvent {
  name: 'highlight-navigation';
  args: [videoUrlIndex: number];
}
