/**
 * DOM-free entry point for the fluent configuration API
 * (`eligius/configuration-api`).
 *
 * Build tools (code generators, the Eligian DSL compiler) run in plain Node,
 * where importing the main `eligius` entry fails: it evaluates jquery@4, which
 * throws `jQuery requires a window with a document`. This entry exports the
 * `ConfigurationFactory` and its editors and the configuration types, and
 * validates operation names against the generated metadata. It never imports
 * the operation or controller implementations, so it stays free of jquery
 * and lottie-web.
 *
 * The `...ByType` methods (for example `addStartOperationByType`) need the
 * operation implementations to map a function to its name, so they only work
 * through the main `eligius` entry. Here they throw; use the name based methods
 * (`addStartOperation('selectElement', ...)`) instead.
 */
export * from '@configuration/api/action-creator-factory.ts';
export * from '@configuration/api/action-editor.ts';
export * from '@configuration/api/configuration-factory.ts';
export * from '@configuration/api/name-providers.ts';
export * from '@configuration/api/subtitle-converter.ts';
export * from '@configuration/api/subtitle-editor.ts';
export * from '@configuration/api/timeline-provider-settings-editor.ts';
export type * from '@configuration/types.ts';
export type {TimelineTypes, TLanguageCode} from './types.ts';
