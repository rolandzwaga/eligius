const generateImporter = require('./importer-generator');
const path = require('path');
const fs = require('fs');

const configPath = process.argv[2];

buildEnginePack(configPath);

function buildEnginePack(configPath) {
    const rawdata = fs.readFileSync(configPath, 'utf8').replace(/^\uFEFF/, '');  
    const config = JSON.parse(rawdata);  
    
    const importer = generateImporter(config, './');
}