const engineConfig = require("EngineConfig");
import EngineFactory from "./factory";
import IvpEngine from "./engine";
import WebpackResourceImporter from "./importer/webpackresourceimporter";

const factory = new EngineFactory(new WebpackResourceImporter());
const engine = factory.createEngine(engineConfig, IvpEngine);
engine.init().then(()=> {
    console.log('ivp engine ready for business');
});
