import {EligiusResourceImporter, EngineFactory} from 'eligius';
import {sleep, summarize} from './profile-lib.js';
import tour from './tour.json';

const engineFactory = new EngineFactory(new EligiusResourceImporter(), window);
const {engine} = engineFactory.createEngine(tour);
window.__engine = engine;

(async () => {
  await engine.init();
  await engine.start();
  await sleep(500);
  for (const timeline of tour.timelines) {
    await engine.switchTimeline(timeline.uri, 0);
    await sleep(400);
    const positions = [
      ...new Set(timeline.timelineActions.map(a => a.duration.start)),
    ].sort((a, b) => a - b);
    for (const p of positions) {
      await engine.seek(p + 0.05);
      await sleep(250);
    }
    await engine.seek(timeline.duration - 0.5);
    await sleep(250);
  }
  engine.pause();
  summarize('eligian-tour');
})().catch(e => console.log('PROFILE-ERROR ' + ((e && e.stack) || e)));
