const generateImporterSourceCode = require('./helper/importer-generator');
const generateBootSourceCode = require('./helper/boot-generator');
const path = require('path');
const fs = require('fs-extra');

const configPath = process.argv[2];

buildEnginePack(configPath);

function buildEnginePack(configPath) {
  const relativeImportPath = createRelativeImportPath(configPath);
  const destinationPath = createDestinationDirectory(configPath);
  const config = loadConfiguration(configPath);

  const importerSource = generateImporterSourceCode(config, relativeImportPath, path.dirname(configPath));
  saveSource(importerSource, path.join(destinationPath, 'webpack-resource-importer.ts'));

  copyAssets(path.dirname(configPath), path.join(destinationPath, 'dist'));

  const bootSource = generateBootSourceCode(config, relativeImportPath, configPath);
  saveSource(bootSource, path.join(destinationPath, 'boot.ts'));
}

function copyAssets(basePath, destinationPath) {
  const videoPath = path.join(basePath, 'video');
  const videoDestPath = path.join(destinationPath, 'video');

  if (!fs.pathExistsSync(videoPath)) {
    return;
  }

  fs.ensureDirSync(videoDestPath);
  const entries = fs.readdirSync(videoPath);
  for (const entry of entries) {
    const fullEntry = path.join(videoPath, entry);
    var isDir = fs.statSync(fullEntry).isDirectory();
    if (!isDir) {
      fs.copyFileSync(fullEntry, path.join(videoDestPath, entry));
    } else {
      fs.ensureDirSync(fullEntry);
    }
  }
}

function createRelativeImportPath(configPath) {
  const parts = configPath.split('/');
  return path.join(parts.map(() => '..').join('/'), 'src');
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
      // fs.rmdirSync(fullEntry);
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
    encoding: 'utf8',
  });
}
