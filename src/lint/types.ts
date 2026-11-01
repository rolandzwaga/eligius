/**
 * `error` for a configuration that fails at runtime for certain, `warning`
 * for one that is likely wrong.
 */
export type TLintSeverity = 'error' | 'warning';

/**
 * One problem found by `lintConfiguration`.
 */
export interface ILintDiagnostic {
  /**
   * The rule, `E...` for errors and `W...` for warnings. `E001` is an error
   * the `ConfigurationResolver` throws, with its message unchanged.
   */
  code: string;
  severity: TLintSeverity;
  /**
   * JSON path of the offending value, in the resolver's notation, for example
   * `timelines[0].timelineActions[2].startOperations[1].operationData.selector`.
   * Empty when the problem concerns the whole configuration.
   */
  path: string;
  /** What is wrong and, where known, what to do instead */
  message: string;
}

/**
 * Tells `lintConfiguration` about the resources the host registers with its
 * resource importer, so that their names are accepted and misspellings are
 * reported against the complete lists.
 */
export interface ILintOptions {
  /** System names of custom operations (registered or passed to `createImporter`) */
  customOperations?: readonly string[];
  /** Class names of custom controllers */
  customControllers?: readonly string[];
  /** Class names of custom position sources, container providers and playlists */
  customProviders?: readonly string[];
  /** Names of custom functions (`customFunction` targets) */
  customFunctions?: readonly string[];
  /**
   * The templates `template:` placeholders may name, as a map of name to
   * template or as a list of names. When left out, every `template:` name is
   * accepted.
   */
  templates?: Readonly<Record<string, string>> | readonly string[];
  /**
   * The JSON values `json:` placeholders may name, as a map of name to value
   * or as a list of names. When left out, every `json:` name is accepted.
   */
  json?: Readonly<Record<string, unknown>> | readonly string[];
}
