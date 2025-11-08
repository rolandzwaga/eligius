import {writeFileSync} from 'node:fs';
import {TimelineEventNames} from '../../timeline-event-names.ts';

// Parse the TimelineEventNames class to extract all event definitions
const eventEntries = Object.entries(TimelineEventNames).filter(
  ([key]) => key !== 'length' && key !== 'prototype' && key !== 'name'
);

for (const [constantName, eventName] of eventEntries) {
  if (typeof eventName !== 'string') continue;

  // Generate interface name from constant name
  const interfaceName = constantName
    .split('_')
    .map(part => part.charAt(0) + part.slice(1).toLowerCase())
    .join('') + 'Event';

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
    argsComment = '\n * @param callback - Callback that receives the container element';
  } else if (eventName === 'timeline-duration-request') {
    args = '[callback: (duration: number) => void]';
    argsComment = '\n * @param callback - Callback that receives the duration';
  } else if (eventName === 'request-current-language') {
    args = '[callback: (language: string) => void]';
    argsComment = '\n * @param callback - Callback that receives the current language';
  } else if (eventName === 'request-label-collection') {
    args = '[language: string, callback: (collection: any) => void]';
    argsComment = '\n * @param language - The language code\n * @param callback - Callback that receives the label collection';
  } else if (eventName === 'request-label-collections') {
    args = '[callback: (collections: any) => void]';
    argsComment = '\n * @param callback - Callback that receives all label collections';
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
  writeFileSync(
    `./src/eventbus/events/${fileName}.ts`,
    fileContent
  );
}

console.log(`Generated ${eventEntries.length} event interface files`);
