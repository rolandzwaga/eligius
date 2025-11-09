/**
 * Event: timeline-current-timeline-change
 * @param timelineUri - The URI of the new current timeline
 * @category Timeline
 */
export interface CurrentTimelineChangeEvent {
  name: 'timeline-current-timeline-change';
  args: [timelineUri: string];
}
