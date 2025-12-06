import type {TResultCallback} from '../../types.ts';

/**
 * Event: request-current-timeline-position
 * @param callback - Callback that receives the current timeline position
 * @category Engine Request
 */
export interface RequestCurrentTimelinePositionEvent {
  name: 'request-current-timeline-position';
  args: [callback: TResultCallback<number>];
}
