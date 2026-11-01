import * as controllerMetadata from '@controllers/metadata/index.ts';
import * as operationMetadata from '@operation/metadata/index.ts';

/**
 * The names `EligiusResourceImporter` lists, without importing the
 * implementations: the linter must stay free of jquery and lottie-web.
 *
 * Operation and controller names come from the generated metadata. The
 * timeline provider exports have no metadata, so they are listed here, in
 * the order of `src/timelineproviders/index.ts`; the conformance test in
 * `src/test/unit/lint/built-in-names.spec.ts` keeps the three lists equal to
 * what the runtime importer returns.
 */
export const builtInOperationNames: readonly string[] =
  Object.keys(operationMetadata);

export const builtInControllerNames: readonly string[] =
  Object.keys(controllerMetadata);

export const builtInProviderNames: readonly string[] = [
  'isSeekable',
  'BasePositionSource',
  'KeyboardStepSource',
  'RafPositionSource',
  'ScrollPositionSource',
  'VideoPositionSource',
  'DomContainerProvider',
  'SimplePlaylist',
];
