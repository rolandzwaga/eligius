import type {TResultCallback} from '../../types.ts';

/**
 * Event: timeline-request-current-timeline
 * @param callback - Callback that receives the current timeline URI
 * @category Engine Request
 */
export interface RequestCurrentTimelineEvent {
  name: 'timeline-request-current-timeline';
  args: [callback: TResultCallback<string>];
}
