// (i) the documented way: fluent ConfigurationFactory + EligiusResourceImporter
import {
  ConfigurationFactory,
  EligiusResourceImporter,
  EngineFactory,
} from 'eligius';

const factory = new ConfigurationFactory();
factory
  .init('en-US')
  .setContainerSelector('#app')
  .addTimeline('main', 'animation', 20, false, '#stage');
factory
  .editTimelineProviderSettings()
  .addProvider('animation')
  .setContainer('#stage');

const a1 = factory.createTimelineAction('main', 'ShowTitle').addDuration(0, 5);
a1.addStartOperation('selectElement', {selector: '.title'})
  .next()
  .addStartOperation('addClass', {className: 'visible'})
  .next()
  .addStartOperation('setElementContent', {template: 'Hello'})
  .next()
  .addStartOperation('setData', {properties: {'$operationdata.count': 3}})
  .next()
  .addStartOperation('when', {expression: '$operationdata.count>2'})
  .next()
  .addStartOperation('addClass', {className: 'many'})
  .next()
  .addStartOperation('otherwise', {})
  .next()
  .addStartOperation('removeClass', {className: 'many'})
  .next()
  .addStartOperation('endWhen', {})
  .next()
  .addEndOperation('selectElement', {selector: '.title'})
  .next()
  .addEndOperation('removeClass', {className: 'visible'})
  .next();

const a2 = factory
  .createTimelineAction('main', 'RevealBullets')
  .addDuration(1, 10);
a2.addStartOperation('selectElement', {selector: '.bullets'})
  .next()
  .addStartOperation('setOperationData', {properties: {items: ['a', 'b', 'c']}})
  .next()
  .addStartOperation('forEach', {collection: '$operationdata.items'})
  .next()
  .addStartOperation('selectElement', {selector: '.bullet'})
  .next()
  .addStartOperation('addClass', {className: 'in'})
  .next()
  .addStartOperation('endForEach', {})
  .next()
  .addEndOperation('selectElement', {selector: '.bullet'})
  .next()
  .addEndOperation('removeClass', {className: 'in'})
  .next();

const engineFactory = new EngineFactory(new EligiusResourceImporter(), window);
const {engine} = engineFactory.createEngine(factory.getConfiguration());
engine.init().then(() => engine.start());
