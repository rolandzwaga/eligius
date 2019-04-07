const engineConfig = require('EngineConfig');
import EngineFactory from './factory';
import ChronoTriggerEngine from './chrono-trigger-engine';
import WebpackResourceImporter from './importer/webpack-resource-importer';

const factory = new EngineFactory(new WebpackResourceImporter());
const engine = factory.createEngine(engineConfig, ChronoTriggerEngine);
engine.init().then(()=> {
    console.log('chrono trigger engine ready for business');
});
