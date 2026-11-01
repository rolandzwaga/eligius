/**
 * Checks that the published declaration files type-check in consumer projects.
 *
 * For each scenario this creates a throwaway consumer project in the OS temp
 * directory, installs the built package into its `node_modules/eligius` (a copy
 * of `package.json` and `dist/`), adds only the dependencies the scenario
 * allows, and runs `tsc --noEmit` with `skipLibCheck: false`, so the
 * `.d.mts` files themselves are checked.
 *
 * - `metadata` and `configuration-api` must work WITHOUT lottie-web, jquery and
 *   `@types/jquery`.
 * - The main entry must work with `@types/jquery` and WITHOUT lottie-web.
 * - All three entries together, with `@types/jquery`, must not conflict.
 *
 * Each scenario runs once with `moduleResolution: NodeNext` and once with
 * `moduleResolution: Bundler`. The consumers set `types: []`, so a global type
 * is only visible when the declarations reference it explicitly.
 *
 * Usage: `npm run build && npm run check:types` (add `-- --keep` to keep the
 * fixture projects for inspection).
 */
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import os from 'node:os';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..', '..', '..');
const distDir = path.join(repoRoot, 'dist');
const require = createRequire(path.join(repoRoot, 'package.json'));
const tscPath = require.resolve('typescript/lib/tsc.js');

/** Resolves to `true` only when T is `any`. */
const IS_ANY = 'type IsAny<T> = 0 extends 1 & T ? true : false;';

const metadataConsumer = `
import {
  ctrlmetadata,
  eventmetadata,
  metadata,
  PARAMETER_TYPES,
} from 'eligius/metadata';
import type {
  IControllerMetadata,
  IEventMetadata,
  IOperationMetadata,
  TParameterTypes,
} from 'eligius/metadata';

${IS_ANY}
type DataOf<M> = M extends IOperationMetadata<infer T> ? T : never;
type CtrlDataOf<M> = M extends IControllerMetadata<infer T> ? T : never;

const addClass = metadata.addClass();
const category: string = addClass.category;
const lottie = ctrlmetadata.LottieController();
const event: IEventMetadata = eventmetadata.timelineSeekRequest();
const parameterType: TParameterTypes = 'ParameterType:className';
const parameterTypes: readonly TParameterTypes[] = PARAMETER_TYPES;

// The jQuery and lottie typed members must keep a real type, not collapse to any
type Selected = DataOf<typeof addClass>['selectedElement'];
type Renderer = CtrlDataOf<typeof lottie>['renderer'];
const selectedIsTyped: IsAny<Selected> = false;
const rendererIsTyped: IsAny<Renderer> = false;

export {
  category,
  event,
  parameterType,
  parameterTypes,
  selectedIsTyped,
  rendererIsTyped,
};
`;

const configurationApiConsumer = `
import {ConfigurationFactory} from 'eligius/configuration-api';
import type {IEngineConfiguration} from 'eligius/configuration-api';

const factory = new ConfigurationFactory();
factory
  .init('en-US')
  .setContainerSelector('#app')
  .addTimeline('main', 'animation', 60, false, '#timeline');
factory
  .createTimelineAction('main', 'ShowTitle')
  .addDuration(0.5, 3)
  .addStartOperation('selectElement', {selector: '#title'})
  .next()
  .end();

const config: IEngineConfiguration = factory.getConfiguration();

export {config};
`;

const mainConsumer = `
import {
  EligiusResourceImporter,
  EngineFactory,
  LottieController,
  VideoPositionSource,
} from 'eligius';
import type {
  IAddClassOperationData,
  ILottieControllerMetadata,
  VideoPositionSourceConfig,
} from 'eligius';

${IS_ANY}

declare const element: JQuery<HTMLElement>;
const data: IAddClassOperationData = {selectedElement: element, className: 'a'};

const factory = new EngineFactory(new EligiusResourceImporter(), window);
const controller = new LottieController();
controller.animationItem?.play();
controller.animationItem?.goToAndStop(10, true);

// The jQuery and lottie typed members must keep a real type, not collapse to any
const selectedIsTyped: IsAny<IAddClassOperationData['selectedElement']> = false;
const itemIsTyped: IsAny<LottieController['animationItem']> = false;
const rendererIsTyped: IsAny<ILottieControllerMetadata['renderer']> = false;
const renderer: ILottieControllerMetadata['renderer'] = {
  preserveAspectRatio: 'xMidYMid meet',
  progressiveLoad: true,
};

// VideoPositionSource type-checks without any media player library, and 'options'
// is gone from its configuration (4.0.0)
const videoConfig: VideoPositionSourceConfig = {selector: '#video', sources: [{src: '/a.mp4', type: 'video/mp4'}], poster: '/p.jpg'};
const video = new VideoPositionSource(videoConfig);
// @ts-expect-error 'options' was removed in 4.0.0
const withOptions: VideoPositionSourceConfig = {selector: '#video', sources: [], options: {}};

export {data, factory, selectedIsTyped, itemIsTyped, rendererIsTyped, renderer, video, withOptions};
`;

const allEntriesConsumer = `
import {LottieController} from 'eligius';
import {ConfigurationFactory} from 'eligius/configuration-api';
import {ctrlmetadata, metadata, type IOperationMetadata} from 'eligius/metadata';

type DataOf<M> = M extends IOperationMetadata<infer T> ? T : never;

// A real jQuery object fits the structural jQuery type of the DOM-free entries
declare const element: JQuery<HTMLElement>;
const fromMetadata: DataOf<ReturnType<typeof metadata.addClass>> = {
  selectedElement: element,
  className: 'a',
};

export {LottieController, ConfigurationFactory, ctrlmetadata, fromMetadata};
`;

type TScenario = {
  name: string;
  source: string;
  lib: string[];
  /** Packages copied from the repo's node_modules into the fixture */
  packages: string[];
};

const scenarios: TScenario[] = [
  {
    name: 'metadata, no jquery, no lottie-web',
    source: metadataConsumer,
    lib: ['ES2022', 'DOM'],
    packages: [],
  },
  {
    name: 'configuration-api, no jquery, no lottie-web',
    source: configurationApiConsumer,
    lib: ['ES2022', 'DOM'],
    packages: [],
  },
  {
    name: 'main, @types/jquery, no lottie-web',
    source: mainConsumer,
    lib: ['ES2022', 'DOM', 'DOM.Iterable'],
    packages: ['@types/jquery'],
  },
  {
    name: 'all entries, @types/jquery, no lottie-web',
    source: allEntriesConsumer,
    lib: ['ES2022', 'DOM', 'DOM.Iterable'],
    packages: ['@types/jquery'],
  },
];

const moduleResolutions = [
  {module: 'NodeNext', moduleResolution: 'NodeNext'},
  {module: 'ESNext', moduleResolution: 'Bundler'},
  // Older consumers: resolves subpaths through package.json typesVersions
  {module: 'ESNext', moduleResolution: 'Node10'},
];

function installEligius(nodeModules: string) {
  const target = path.join(nodeModules, 'eligius');
  fs.mkdirSync(target, {recursive: true});
  fs.copyFileSync(
    path.join(repoRoot, 'package.json'),
    path.join(target, 'package.json')
  );
  fs.cpSync(distDir, path.join(target, 'dist'), {
    recursive: true,
    filter: source => !source.endsWith('.map'),
  });
}

function createFixture(
  root: string,
  scenario: TScenario,
  resolution: (typeof moduleResolutions)[number]
): string {
  const dir = fs.mkdtempSync(path.join(root, 'consumer-'));
  const nodeModules = path.join(dir, 'node_modules');
  installEligius(nodeModules);
  for (const pkg of scenario.packages) {
    fs.cpSync(
      path.join(repoRoot, 'node_modules', pkg),
      path.join(nodeModules, pkg),
      {recursive: true}
    );
  }
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({name: 'consumer', private: true, type: 'module'}, null, 2)
  );
  fs.writeFileSync(
    path.join(dir, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          ...resolution,
          target: 'ES2022',
          lib: scenario.lib,
          strict: true,
          noEmit: true,
          skipLibCheck: false,
          types: [],
        },
        files: ['index.ts'],
      },
      null,
      2
    )
  );
  fs.writeFileSync(path.join(dir, 'index.ts'), scenario.source);
  return dir;
}

function main(): number {
  const missing = ['index', 'metadata', 'configuration-api'].filter(
    entry => !fs.existsSync(path.join(distDir, `${entry}.d.mts`))
  );
  if (missing.length) {
    console.error(
      `Missing declarations for ${missing.join(', ')} in dist/. Run 'npm run build' first.`
    );
    return 1;
  }

  const keep = process.argv.includes('--keep');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eligius-dist-types-'));
  let failures = 0;

  try {
    for (const scenario of scenarios) {
      for (const resolution of moduleResolutions) {
        const label = `${scenario.name} [${resolution.moduleResolution}]`;
        const dir = createFixture(root, scenario, resolution);
        const result = spawnSync(
          process.execPath,
          [tscPath, '-p', dir, '--pretty', 'false'],
          {encoding: 'utf8'}
        );
        if (result.status === 0) {
          console.log(`PASS  ${label}`);
        } else {
          failures++;
          console.error(`FAIL  ${label}`);
          console.error(`${result.stdout}${result.stderr}`.trim());
        }
      }
    }
  } finally {
    if (keep) {
      console.log(`Fixtures kept in ${root}`);
    } else {
      fs.rmSync(root, {recursive: true, force: true});
    }
  }

  return failures ? 1 : 0;
}

process.exitCode = main();
