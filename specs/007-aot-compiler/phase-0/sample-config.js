// A small sample deck: one timeline, two timeline actions, 15 operations in
// total, including a when/otherwise block and a forEach loop.
let counter = 0;
const op = (systemName, operationData = {}) => ({
  id: `${systemName}-${++counter}`,
  systemName,
  operationData,
});
export const sampleConfig = {
  id: 'sample-deck',
  engine: {systemName: 'EligiusEngine'},
  containerSelector: '#app',
  language: 'en-US',
  layoutTemplate:
    '<div id="stage"><h1 class="title">Sample</h1><ul class="bullets"><li class="bullet">a</li><li class="bullet">b</li><li class="bullet">c</li></ul></div>',
  cssFiles: [],
  availableLanguages: [{id: 'en', languageCode: 'en-US', label: 'English'}],
  initActions: [],
  actions: [],
  eventActions: [],
  timelines: [
    {
      uri: 'main',
      type: 'animation',
      duration: 20,
      loop: false,
      selector: '#stage',
      timelineActions: [
        {
          id: 'a1',
          name: 'ShowTitle',
          duration: {start: 0, end: 5},
          startOperations: [
            op('selectElement', {selector: '.title'}),
            op('addClass', {className: 'visible'}),
            op('setElementContent', {template: 'Hello'}),
            op('setData', {properties: {'$operationdata.count': 3}}),
            op('when', {expression: '$operationdata.count>2'}),
            op('addClass', {className: 'many'}),
            op('otherwise'),
            op('removeClass', {className: 'many'}),
            op('endWhen'),
          ],
          endOperations: [
            op('selectElement', {selector: '.title'}),
            op('removeClass', {className: 'visible'}),
          ],
        },
        {
          id: 'a2',
          name: 'RevealBullets',
          duration: {start: 1, end: 10},
          startOperations: [
            op('selectElement', {selector: '.bullets'}),
            op('setOperationData', {properties: {items: ['a', 'b', 'c']}}),
            op('forEach', {collection: '$operationdata.items'}),
            op('selectElement', {selector: '.bullet'}),
            op('addClass', {className: 'in'}),
            op('endForEach'),
          ],
          endOperations: [
            op('selectElement', {selector: '.bullet'}),
            op('removeClass', {className: 'in'}),
          ],
        },
      ],
    },
  ],
  timelineProviderSettings: {
    animation: {positionSource: {systemName: 'RafPositionSource'}},
  },
};
