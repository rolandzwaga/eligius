class TimelineEventNames {
    // timeline requests
    static PLAY_REQUEST = 'timeline-play-request';
    static STOP_REQUEST = 'timeline-stop-request';
    static PAUSE_REQUEST = 'timeline-pause-request';
    static SEEK_REQUEST = 'timeline-seek-request';
    static RESIZE_REQUEST = 'timeline-resize-request';
    static CONTAINER_REQUEST = 'timeline-container-request';
    static DURATION_REQUEST = 'timeline-duration-request';

    // timeline announcements
    static DURATION = 'timeline-duration';
    static TIME = 'timeline-time';
    static SEEKED = 'timeline-seeked';
    static COMPLETE = 'timeline-complete';
    static PLAY = 'timeline-play';
    static STOP = 'timeline-stop';
    static PAUSE = 'timeline-pause';
    static SEEK = 'timeline-seek';
    static RESIZE = 'timeline-resize';

    // factory events
    static REQUEST_INSTANCE = 'request-instance';
    static REQUEST_ACTION = 'request-action';
    static REQUEST_FUNCTION = 'request-function';
    static REQUEST_VIDEO_URL = 'request-video-url';
}

export default TimelineEventNames;
