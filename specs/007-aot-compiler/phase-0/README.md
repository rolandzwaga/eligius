# Phase 0 scripts

Everything that produced [../measurements.md](../measurements.md), kept so the numbers can be reproduced. Results from the 2026-11-01 run are the `*.result.json` files. Run every script from this directory after `npm run build` in the repo root.

## Benchmark

`npm run bench` in the repo root runs `src/test/bench/action-overhead.bench.ts`.

## Eligian tour input

The tour is not checked in. Download it into `eligian/`:

```
mkdir eligian
curl -sL https://raw.githubusercontent.com/rolandzwaga/eligian/main/examples/eligian-tour/tour.json -o eligian/tour.json
curl -sL https://raw.githubusercontent.com/rolandzwaga/eligian/main/examples/eligian-tour/tour.css -o eligian/tour.css
```

## Bundle sizes and profile pages

```
node build-all.mjs
```

Prints one JSON line per deck and jQuery mode (also written to `sizes.json`), then builds the two profile pages into `out/`. The decks:

- `deck-full.js`: fluent `ConfigurationFactory` + `EligiusResourceImporter`
- `deck-json-full.js`: JSON configuration + `EligiusResourceImporter`
- `deck-minimal.js`: JSON configuration + a hand-written importer naming 15 exports

## Browser profile

```
node serve.mjs
node profile-cdp.mjs "C:/Program Files/Google/Chrome/Application/chrome.exe" http://127.0.0.1:4173/tour.html
node profile-cdp.mjs "C:/Program Files/Google/Chrome/Application/chrome.exe" http://127.0.0.1:4173/sample.html
```

`profile-lib.js` wraps `Action.prototype._runOperations` in the page and records wall time per run; `profile-cdp.mjs` drives headless Chrome over the DevTools protocol (Node 22+, no dependencies) and prints the summary the page stores in `window.__profile`.

## Corpus scans

```
node config-scan.js eligian/tour.json
node corpus-scan.js ../../../src/test ../../../README.md
```

`config-scan.js` walks a configuration's actions. `corpus-scan.js` is a regex scan over TypeScript and Markdown and is noisy by nature.

## Gate G1 re-run (2026-11-01)

The tour input came from the local Eligian checkout (`examples/eligian-tour/tour.json` at 86bb3c5) instead of GitHub; `eligian/`, `out/`, the copied `tour.*` and `sizes.json` are gitignored here. `profile-lib.js` now records `opMs` (inside the operation functions) and `interpMs` (inside `Action.executeOperation` but outside the operations) per run and per boundary, for the amended criterion (a). Results: `profile-tour.g1.result.json`, `profile-sample.g1.result.json`, `bench-g1.output.txt` (the bench with the new "ceiling + intrinsics" variant). Read them in [../measurements.md](../measurements.md) section 9.
