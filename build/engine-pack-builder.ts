import fs from 'fs-extra';
import path from 'path';
import generateBootSourceCode from './helper/boot-generator';
import generateImporterSourceCode from './helper/importer-generator';

const configPath = process.argv[2];

buildEnginePack(configPath);

function buildEnginePack(configurationPath: string) {
  const relativeImportPath = createRelativeImportPath(configurationPath);
  const destinationPath = createDestinationDirectory(configurationPath);
  const config = loadConfiguration(configurationPath);

  const importerSource = generateImporterSourceCode(
    config,
    path.dirname(configurationPath)
  );
  saveSource(
    importerSource,
    path.join(destinationPath, 'webpack-resource-importer.ts')
  );

  copyAssets(
    path.dirname(configurationPath),
    path.join(destinationPath, 'dist')
  );

  const bootSource = generateBootSourceCode(
    config,
    relativeImportPath,
    configurationPath
  );
  saveSource(bootSource, path.join(destinationPath, 'boot.ts'));
}

function copyAssets(basePath: string, destinationPath: string) {
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

function createRelativeImportPath(configurationPath: string) {
  const parts = configurationPath.split('/');
  parts.pop();
  return path.join(parts.map(() => '..').join('/'), 'src');
}

function createDestinationDirectory(configurationPath: string) {
  const basePath = path.dirname(configurationPath);
  const destinationPath = path.join(basePath, 'build');
  if (fs.existsSync(destinationPath)) {
    wipeDirectoryContents(destinationPath);
  }
  if (!fs.existsSync(destinationPath)) {
    fs.mkdirSync(destinationPath);
  }
  return destinationPath;
}

function wipeDirectoryContents(dir: string) {
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

function loadConfiguration(configurationPath: string) {
  const rawdata = fs
    .readFileSync(configurationPath, 'utf8')
    .replace(/^\uFEFF/, '');
  const config = JSON.parse(rawdata);
  return config;
}

function saveSource(sourceContent: string, destinationPath: string) {
  fs.writeFileSync(destinationPath, sourceContent, {
    encoding: 'utf8',
  });
}
