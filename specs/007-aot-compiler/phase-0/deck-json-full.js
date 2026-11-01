// (i-b) JSON configuration + EligiusResourceImporter (no fluent API)
import {EligiusResourceImporter, EngineFactory} from 'eligius';
import {sampleConfig} from './sample-config.js';

const engineFactory = new EngineFactory(new EligiusResourceImporter(), window);
const {engine} = engineFactory.createEngine(sampleConfig);
engine.init().then(() => engine.start());
