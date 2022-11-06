/**
 * These are the event names that are being braodcast and/or handled by Eligius.
 */
export class TimelineEventNames {
  // timeline requests
  /**
   * Broadcasting this event will start the current timeline when it is currently paused, or pauses when it is playing.
   */
  static PLAY_TOGGLE_REQUEST = 'timeline-play-toggle-request';
  /**
   * Broadcasting this event will start the current timeline.
   */
  static PLAY_REQUEST = 'timeline-play-request';
  /**
   * Broadcasting this event will stop the current timeline.
   */
  static STOP_REQUEST = 'timeline-stop-request';
  /**
   * Broadcasting this event will pause the current timeline.
   */
  static PAUSE_REQUEST = 'timeline-pause-request';
  /**
   * Broadcasting this event will seek the specified position in the current timeline.
   * This event takes one argument: A numeric value that represents the new position.
   */
  static SEEK_REQUEST = 'timeline-seek-request';
  /**
   * Broadcasting this event will tell the current {@link ITimelineProvider} to resize.
   */
  static RESIZE_REQUEST = 'timeline-resize-request';
  /**
   * Broadcasting this event will return the element in which the current timeline is being rendered.
   * This event takes one argument: The callback function that will return the specified element.
   */
  static CONTAINER_REQUEST = 'timeline-container-request';
  /**
   * Broadcasting this event will return the duration of the current timeline.
   * This event takes one argument: The callback function that will return the duration.
   */
  static DURATION_REQUEST = 'timeline-duration-request';
  /**
   * Broadcasting this event will return the uri of the current timeline.
   * This event takes one argument: The callback function that will return the uri.
   */
  static REQUEST_CURRENT_TIMELINE = 'timeline-request-current-timeline';

  // timeline announcements
  /**
   * This event is broadcast by {@link ITimelineProvider} instances to announce their duration.
   */
  static DURATION = 'timeline-duration';
  /**
   * This event is broadcast by {@link ITimelineProvider} instances to announce the current play position whenever it changes.
   */
  static TIME = 'timeline-time';
  /**
   * This event is broadcast by {@link ITimelineProvider} instances to announce the new play position and duration after a seek was executed.
   */
  static SEEKED = 'timeline-seeked';
  /**
   *
   */
  static COMPLETE = 'timeline-complete';
  static RESTART = 'timeline-restart';
  static PLAY = 'timeline-play';
  static STOP = 'timeline-stop';
  static PAUSE = 'timeline-pause';
  static SEEK = 'timeline-seek';
  static RESIZE = 'timeline-resize';
  static CURRENT_TIMELINE_CHANGE = 'timeline-current-timeline-change';
  static FIRST_FRAME = 'timeline-firstframe';

  // factory and engine events
  static REQUEST_INSTANCE = 'request-instance';
  static REQUEST_ACTION = 'request-action';
  static REQUEST_FUNCTION = 'request-function';
  static REQUEST_TIMELINE_URI = 'request-timeline-uri';
  static BEFORE_REQUEST_TIMELINE_URI = 'before-request-timeline-uri';
  static REQUEST_ENGINE_ROOT = 'request-engine-root';
  static REQUEST_CURRENT_TIMELINE_POSITION =
    'request-current-timeline-position';
  static REQUEST_TIMELINE_CLEANUP = 'request-timeline-cleanup';
  static EXECUTE_TIMELINEACTION = 'execute-timelineaction';
  static RESIZE_TIMELINEACTION = 'resize-timelineaction';

  //language manager events
  static REQUEST_LABEL_COLLECTION = 'request-label-collection';
  static REQUEST_LABEL_COLLECTIONS = 'request-label-collections';
  static REQUEST_CURRENT_LANGUAGE = 'request-current-language';
  static LANGUAGE_CHANGE = 'language-change';
}
