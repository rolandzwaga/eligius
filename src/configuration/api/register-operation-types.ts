import * as operations from '@operation/index.ts';
import {registerOperationTypes} from './operation-lookup.ts';

/**
 * Side-effect module: registers the operation implementations so the
 * `...ByType` methods of the fluent API can map an operation function to its
 * system name. It imports every operation (and with them jQuery), so only the
 * browser entry point loads it, through `@configuration/api/index.ts`.
 */
registerOperationTypes(operations);
