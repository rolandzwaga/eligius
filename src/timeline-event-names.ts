export class TimelineEventNames {
  // timeline requests
  static PLAY_TOGGLE_REQUEST = 'timeline-play-toggle-request';
  static PLAY_REQUEST = 'timeline-play-request';
  static STOP_REQUEST = 'timeline-stop-request';
  static PAUSE_REQUEST = 'timeline-pause-request';
  static SEEK_REQUEST = 'timeline-seek-request';
  static RESIZE_REQUEST = 'timeline-resize-request';
  static CONTAINER_REQUEST = 'timeline-container-request';
  static DURATION_REQUEST = 'timeline-duration-request';
  static REQUEST_CURRENT_TIMELINE = 'timeline-request-current-timeline';

  // timeline announcements
  static DURATION = 'timeline-duration';
  static TIME = 'timeline-time';
  static SEEKED = 'timeline-seeked';
  static COMPLETE = 'timeline-complete';
  static RESTART = 'timeline-restart';
  static PLAY = 'timeline-play';
  static STOP = 'timeline-stop';
  static PAUSE = 'timeline-pause';
  static SEEK = 'timeline-seek';
  static RESIZE = 'timeline-resize';
  static POSITION_UPDATE = 'timeline-position-update';
  static TIME_UPDATE = 'timeline-time-update';
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
