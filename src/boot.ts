const engineConfig = require('EngineConfig');
import { EngineFactory } from './engine-factory';
import { WebpackResourceImporter } from './importer/webpack-resource-importer';

const factory = new EngineFactory(new WebpackResourceImporter(), window);
const engine = factory.createEngine(engineConfig);
engine.init().then(() => {
  console.log('chrono trigger engine ready for business');
});
