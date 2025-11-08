import {writeFileSync} from 'node:fs';

// Event name mappings (previously from TimelineEventNames class)
const eventEntries = [
  ['PLAY_TOGGLE_REQUEST', 'timeline-play-toggle-request'],
  ['PLAY_REQUEST', 'timeline-play-request'],
  ['STOP_REQUEST', 'timeline-stop-request'],
  ['PAUSE_REQUEST', 'timeline-pause-request'],
  ['SEEK_REQUEST', 'timeline-seek-request'],
  ['RESIZE_REQUEST', 'timeline-resize-request'],
  ['CONTAINER_REQUEST', 'timeline-container-request'],
  ['DURATION_REQUEST', 'timeline-duration-request'],
  ['REQUEST_CURRENT_TIMELINE', 'timeline-request-current-timeline'],
  ['DURATION', 'timeline-duration'],
  ['TIME', 'timeline-time'],
  ['SEEKED', 'timeline-seeked'],
  ['COMPLETE', 'timeline-complete'],
  ['RESTART', 'timeline-restart'],
  ['PLAY', 'timeline-play'],
  ['STOP', 'timeline-stop'],
  ['PAUSE', 'timeline-pause'],
  ['SEEK', 'timeline-seek'],
  ['RESIZE', 'timeline-resize'],
  ['CURRENT_TIMELINE_CHANGE', 'timeline-current-timeline-change'],
  ['FIRST_FRAME', 'timeline-firstframe'],
  ['REQUEST_INSTANCE', 'request-instance'],
  ['REQUEST_ACTION', 'request-action'],
  ['REQUEST_FUNCTION', 'request-function'],
  ['REQUEST_TIMELINE_URI', 'request-timeline-uri'],
  ['BEFORE_REQUEST_TIMELINE_URI', 'before-request-timeline-uri'],
  ['REQUEST_ENGINE_ROOT', 'request-engine-root'],
  ['REQUEST_CURRENT_TIMELINE_POSITION', 'request-current-timeline-position'],
  ['REQUEST_TIMELINE_CLEANUP', 'request-timeline-cleanup'],
  ['REQUEST_LABEL_COLLECTION', 'request-label-collection'],
  ['REQUEST_LABEL_COLLECTIONS', 'request-label-collections'],
  ['REQUEST_CURRENT_LANGUAGE', 'request-current-language'],
  ['LANGUAGE_CHANGE', 'language-change'],
  ['DOM_MUTATION', 'dom-mutation'],
];

for (const [constantName, eventName] of eventEntries) {
  if (typeof eventName !== 'string') continue;

  // Generate interface name from constant name
  const interfaceName = `${constantName
    .split('_')
    .map(part => part.charAt(0) + part.slice(1).toLowerCase())
    .join('')}Event`;

  // Determine category from constant name prefix
  let category = 'Timeline';
  if (constantName.startsWith('REQUEST_')) {
    category = 'Engine Request';
  } else if (constantName.includes('LANGUAGE')) {
    category = 'Language Manager';
  } else if (constantName === 'DOM_MUTATION') {
    category = 'Controller';
  }

  // Determine args based on known event patterns
  let args = '[]';
  let argsComment = '';

  if (eventName === 'timeline-seek-request') {
    args = '[position: number]';
    argsComment = '\n * @param position - The timeline position to seek to';
  } else if (eventName === 'timeline-container-request') {
    args = '[callback: (element: HTMLElement) => void]';
    argsComment =
      '\n * @param callback - Callback that receives the container element';
  } else if (eventName === 'timeline-duration-request') {
    args = '[callback: (duration: number) => void]';
    argsComment = '\n * @param callback - Callback that receives the duration';
  } else if (eventName === 'request-current-language') {
    args = '[callback: (language: string) => void]';
    argsComment =
      '\n * @param callback - Callback that receives the current language';
  } else if (eventName === 'request-label-collection') {
    args = '[language: string, callback: (collection: any) => void]';
    argsComment =
      '\n * @param language - The language code\n * @param callback - Callback that receives the label collection';
  } else if (eventName === 'request-label-collections') {
    args = '[callback: (collections: any) => void]';
    argsComment =
      '\n * @param callback - Callback that receives all label collections';
  } else if (eventName === 'dom-mutation') {
    args = '[payload: any]';
    argsComment = '\n * @param payload - Mutation observer payload';
  }

  // Get description from JSDoc in original file (for now, use placeholder)
  const description = `Event: ${eventName}`;

  const fileContent = `/**
 * ${description}${argsComment}
 * @category ${category}
 */
export interface ${interfaceName} {
  name: '${eventName}';
  args: ${args};
}
`;

  const fileName = eventName.replace(/-/g, '-');
  writeFileSync(`./src/eventbus/events/${fileName}.ts`, fileContent);
}

console.log(`Generated ${eventEntries.length} event interface files`);
