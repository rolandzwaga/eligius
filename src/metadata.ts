/**
 * Metadata-only entry point (`eligius/metadata`).
 *
 * This re-exports ONLY the operation / controller / event metadata namespaces
 * and their types. The metadata is pure data — each descriptor file imports the
 * operation's data interface as a `type` (erased at build), never the operation
 * implementation — so this entry is bundled into its own chunk that does NOT
 * import jquery / lottie-web / video.js.
 *
 * Importing from the main `eligius` entry evaluates the full engine bundle,
 * which pulls in jquery@4 — and jquery@4 throws `jQuery requires a window with a
 * document` the instant it is evaluated in a DOM-less Node context. Tooling that
 * only needs metadata (code generators, completion providers, DSL compilers)
 * should import from `eligius/metadata` so it works in plain Node without a DOM.
 */
export * as ctrlmetadata from '@controllers/metadata/index.ts';
export * from '@controllers/metadata/types.ts';
export * as eventmetadata from '@eventbus/events/metadata/index.ts';
export * from '@eventbus/events/metadata/types.ts';
export * as metadata from '@operation/metadata/index.ts';
export * from '@operation/metadata/types.ts';
