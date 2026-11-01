/**
 * DOM-free configuration linter (`eligius/lint`).
 *
 * `lintConfiguration` runs the real `ConfigurationResolver` with stand-ins
 * for the operations, controllers and timeline providers, so every error the
 * engine would throw at `createEngine` time is found at build time, with the
 * same message and JSON path. It then checks every operation list for
 * control-flow blocks that do not nest, missing required properties, invalid
 * `when` expressions, forbidden property chains, unknown `requestAction`
 * names and data that nothing provides.
 *
 * This entry never imports the operation or controller implementations, so
 * it works in plain Node without jquery or lottie-web: build steps, editors
 * and the Eligian compiler can run it.
 */

export type * from '@configuration/types.ts';
export {lintConfiguration} from '@lint/lint-configuration.ts';
export type {
  ILintDiagnostic,
  ILintOptions,
  TLintSeverity,
} from '@lint/types.ts';
export {
  findFlowControlProblems,
  type IFlowControlProblem,
} from '@operation/helper/flow-control-structure.ts';
export type {
  IConfigurationResolverOptions,
  IConfigurationWarning,
  TimelineTypes,
  TLanguageCode,
} from './types.ts';
