const generateImporterSourceCode = require('./helper/importer-generator');
const generateBootSourceCode = require('./helper/boot-generator');
const path = require('path');
const fs = require('fs');

const configPath = process.argv[2];

buildEnginePack(configPath);

function buildEnginePack(configPath) {

    const relativeImportPath = createRelativeImportPath(configPath);
    const destinationPath = createDestinationDirectory(configPath);
    const config = loadConfiguration(configPath);

    const importerSource = generateImporterSourceCode(config, relativeImportPath);
    saveSource(importerSource, path.join(destinationPath, 'webpack-resource-importer.js'));

    const bootSource = generateBootSourceCode(config, relativeImportPath, configPath);
    saveSource(bootSource, path.join(destinationPath, 'boot.js'));

}

function createRelativeImportPath(configPath) {
    const parts = configPath.split('/');
    return parts.map(() => '..').join('/') + '/src/';
}

function createDestinationDirectory(configPath) {
    const basePath = path.dirname(configPath);
    const destinationPath = path.join(basePath, 'build');
    if (fs.existsSync(destinationPath)) {
        wipeDirectoryContents(destinationPath);
    }
    if (!fs.existsSync(destinationPath)) {
        fs.mkdirSync(destinationPath);
    }
    return destinationPath;
}

function wipeDirectoryContents(dir) {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
        const fullEntry = path.join(dir, entry);
        var isDir = fs.statSync(fullEntry).isDirectory();
        if (!isDir) {
            fs.unlinkSync(fullEntry);
        } else {
            wipeDirectoryContents(fullEntry);
            fs.rmdirSync(fullEntry);
        }
    }
}

function loadConfiguration() {
    const rawdata = fs.readFileSync(configPath, 'utf8').replace(/^\uFEFF/, '');
    const config = JSON.parse(rawdata);
    return config;
}

function saveSource(sourceContent, destinationPath) {
    fs.writeFileSync(destinationPath, sourceContent, {
        encoding: 'utf8'
    });
}