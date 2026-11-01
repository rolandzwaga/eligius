import {EligiusResourceImporter, EngineFactory} from 'eligius';
import {sleep, summarize} from './profile-lib.js';
import {sampleConfig} from './sample-config.js';

const engineFactory = new EngineFactory(new EligiusResourceImporter(), window);
const {engine} = engineFactory.createEngine(sampleConfig);
window.__engine = engine;

(async () => {
  await engine.init();
  await engine.start();
  await sleep(400);
  for (let i = 0; i < 20; i++) {
    await engine.seek(0.05);
    await sleep(150);
    await engine.seek(1.05);
    await sleep(150);
    await engine.seek(6);
    await sleep(150);
    await engine.seek(12);
    await sleep(150);
  }
  engine.pause();
  summarize('sample-deck');
})().catch(e => console.log('PROFILE-ERROR ' + ((e && e.stack) || e)));
