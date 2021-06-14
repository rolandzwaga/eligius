import css_test from '../css/test.css';
import { IEngineConfiguration } from '../../../src';
import * as engineConfig from './../config-data.json';
import { EngineFactory } from '../../../src/engine-factory';
import WebpackResourceImporter from './webpack-resource-importer';
const factory = new EngineFactory(new WebpackResourceImporter(), window);
const engine = factory.createEngine((engineConfig as any) as IEngineConfiguration);
engine.init().then(()=> {console.log('chrono trigger engine ready for business');});