# Phase 2 scripts

Bundle measurement for `createImporter`, `eligius/runtime` and the `sideEffects` declaration; the numbers are in [../measurements.md](../measurements.md) section 7. Results from the 2026-11-01 run are the `*.result.json` files.

## Prerequisites

- `npm run build` in the repo root.
- A directory with esbuild and webpack installed (they are not devDependencies):

```
mkdir bundlers && cd bundlers && npm init -y && npm install esbuild webpack
```

## Run

```
node measure.mjs <bundlers-dir>          # sideEffects as declared in package.json
node measure.mjs <bundlers-dir> none     # as if package.json had no sideEffects field
node measure.mjs <bundlers-dir> false    # as if it declared false
```

`measure.mjs` copies `package.json` and `dist/` into `consumer/node_modules/eligius`, writes the decks next to it, bundles each deck with Vite 8 (rolldown), esbuild and webpack 5, prints one JSON line per bundler and deck, then bundles a fourth deck that uses `ConfigurationFactory.addStartOperationByType` and evaluates it in Node with jsdom (`run-in-jsdom.mjs`) to prove the operation registration survived. The decks:

- `resource-importer`: JSON configuration + `EligiusResourceImporter` from `eligius` (the Phase 0 baseline)
- `create-main`: JSON configuration + `createImporter` from `eligius`
- `create-runtime`: JSON configuration + `createImporter` from `eligius/runtime`
- `fluent-bytype`: behaviour check only, not a size row

The `consumer/` directory is removed afterwards.
