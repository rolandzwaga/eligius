// (ii) JSON configuration + a hand-written importer that names only what the
// deck uses. Whether the bundler can drop the other ~80 operations is what
// this build measures.
import {
  addClass,
  DomContainerProvider,
  EligiusEngine,
  EngineFactory,
  endForEach,
  endWhen,
  forEach,
  otherwise,
  RafPositionSource,
  removeClass,
  SimplePlaylist,
  selectElement,
  setData,
  setElementContent,
  setOperationData,
  when,
} from 'eligius';
import {sampleConfig} from './sample-config.js';

const table = {
  addClass,
  DomContainerProvider,
  EligiusEngine,
  endForEach,
  endWhen,
  forEach,
  otherwise,
  RafPositionSource,
  removeClass,
  selectElement,
  setData,
  setElementContent,
  setOperationData,
  SimplePlaylist,
  when,
};
const importer = {
  import(name) {
    if (!(name in table)) {
      throw new Error(`unknown resource ${name}`);
    }
    return {[name]: table[name]};
  },
};

const engineFactory = new EngineFactory(importer, window);
const {engine} = engineFactory.createEngine(sampleConfig);
engine.init().then(() => engine.start());
