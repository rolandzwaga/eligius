import type {IEngineActionError} from '../../types.ts';

/**
 * Event: engine-error
 * Broadcast when a timeline action that the engine started or ended on its
 * own fails. The error names the action, the phase (start or end) and, when
 * known, the failing operation.
 * @param error - The error, with the original error as its `cause`
 * @category Engine
 */
export interface EngineErrorEvent {
  name: 'engine-error';
  args: [error: IEngineActionError];
}
