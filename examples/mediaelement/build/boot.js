import css_test from '../css/test.css';
const engineConfig = require('../config-data.json');
import EngineFactory from '../../../src/engine-factory';
import WebpackResourceImporter from './webpack-resource-importer';
const factory = new EngineFactory(new WebpackResourceImporter(), window);
const engine = factory.createEngine(engineConfig);
engine.init().then(() => {
  console.log('chrono trigger engine ready for business');
});
