declare module '*.css' {
  interface IClassNames {
    [className: string]: string;
  }
  const classNames: IClassNames;
  export = classNames;
}

declare module '*.json' {
  const value: any;
  export default value;
}
declare module '*.html';

declare namespace mediaelementjs {
  declare class MediaElementPlayer {
    duration: number;
    paused: boolean;
    loop: boolean;
    controlsAreVisible: boolean;
    controlsEnabled: boolean;
    remainingTime: number;

    autoplay: boolean; //Set or return whether the audio/video should start playing as soon as it is loaded	X	X
    buffered: TimeRanges; //Return a TimeRanges object representing the buffered parts of the audio/video	X
    controls: boolean; //Set or return whether the audio/video should display controls (like play/pause etc.)	X	X
    currentSrc: string; //Return the URL of the current audio/video	X
    currentTime: number; //Set or return the current playback position in the audio/video (in seconds)	X	X
    ended: boolean; //Return whether the playback of the audio/video has ended or not	X
    error: MediaError | undefined; //Return a MediaError object representing the error state of the audio/video	X
    muted: boolean; //Set or returns whether the audio/video is muted or not	X	X
    readyState: number; //Return the current ready state of the audio/video	X
    seeking: boolean; //Return whether the user is currently seeking in the audio/video	X
    src: string; //Set or return the current source of the audio/video element	X	X
    volume: number;

    play(): void;
    stop(): void;
    pause(): void;
    remove(): void;
    canPlayType(type: string): boolean; //Determine whether current player can/cannot play a specific media type; type is MIME type and each renderer has a whitelist of them
    setPlayerSize(width: number, height: number): void; //Set player's width and height also considering the stretching configuration
    setPoster(url: string): void; //Add a image tag with the poster's url inside the player's layer; you can pass an empty string to clear the poster
    setMuted(muted: boolean): void; //Mute/unmute the player; muted is a boolean value
    setCurrentTime(position: number): void;
    getCurrentTime(): number; //Retrieve the current time of the media being played
    setVolume(volume: number): void; //Set a volume level for the player; volume is a number between 0 and 1
    getVolume(): number; //Retrieve the current volume level of the media being played
    setSrc(src: string): void; //Set a new URL/path for the player; each renderer has a different mechanism to set it
    getSrc(): string;

    addEventListener(eventName: string, eventHandler: (...args) => void);
    removeEventListener(eventName: string, eventHandler: (...args) => void);
  }

  declare interface IMediaElementPlayerConfiguration {
    poster?: string;
    // When the video is ended, show the poster.
    showPosterWhenEnded?: boolean;
    // When the video is paused, show the poster.
    showPosterWhenPaused?: boolean;
    // Default if the <video width> is not specified
    defaultVideoWidth?: number;
    // Default if the <video height> is not specified
    defaultVideoHeight?: number;
    // If set, overrides <video width>
    videoWidth?: number;
    // If set, overrides <video height>
    videoHeight?: number;
    // Default if the user doesn't specify
    defaultAudioWidth?: number;
    // Default if the user doesn't specify
    defaultAudioHeight?: number;
    // Default amount to move back when back key is pressed
    defaultSeekBackwardInterval?: (media: any) => number;
    // Default amount to move forward when forward key is pressed
    defaultSeekForwardInterval?: (media: any) => number;
    // Set dimensions via JS instead of CSS
    setDimensions?: boolean;
    // Width of audio player
    audioWidth?: number;
    // Height of audio player
    audioHeight?: number;
    // Useful for <audio> player loops
    loop?: boolean;
    // Rewind to beginning when media ends
    autoRewind?: boolean;
    // Resize to media dimensions
    enableAutosize?: boolean;
    /*
     * Time format to use. Default: 'mm:ss'
     * Supported units:
     *   h: hour
     *   m: minute
     *   s: second
     *   f: frame count
     * When using 'hh', 'mm', 'ss' or 'ff' we always display 2 digits.
     * If you use 'h', 'm', 's' or 'f' we display 1 digit if possible.
     *
     * Example to display 75 seconds:
     * Format 'mm:ss': 01:15
     * Format 'm:ss': 1:15
     * Format 'm:s': 1:15
     */
    timeFormat?: string;
    // Force the hour marker (##:00:00)
    alwaysShowHours?: boolean;
    // Show framecount in timecode (##:00:00:00)
    showTimecodeFrameCount?: boolean;
    // Used when showTimecodeFrameCount is set to true
    framesPerSecond?: number;
    // Hide controls when playing and mouse is not over the video
    alwaysShowControls?: boolean;
    // Display the video control when media is loading
    hideVideoControlsOnLoad?: boolean;
    // Display the video controls when media is paused
    hideVideoControlsOnPause?: boolean;
    // Enable click video element to toggle play/pause
    clickToPlayPause?: boolean;
    // Time in ms to hide controls
    controlsTimeoutDefault?: number;
    // Time in ms to trigger the timer when mouse moves
    controlsTimeoutMouseEnter?: number;
    // Time in ms to trigger the timer when mouse leaves
    controlsTimeoutMouseLeave?: number;
    // Force iPad's native controls
    iPadUseNativeControls?: boolean;
    // Force iPhone's native controls
    iPhoneUseNativeControls?: boolean;
    // Force Android's native controls
    AndroidUseNativeControls?: boolean;
    // Features to show
    features?: TPlayerFeature[];
    // If set to `true`, all the default control elements listed in features above will be used, and the features will add other features
    useDefaultControls?: boolean;
    // Only for dynamic
    isVideo?: boolean;
    // Stretching modes (auto, fill, responsive, none)
    stretching?: TStretchSetting;
    // Prefix class names on elements
    classPrefix?: string;
    // Turn keyboard support on and off for this instance
    enableKeyboard?: boolean;
    // When this player starts, it will pause other players
    pauseOtherPlayers?: boolean;
    // Number of decimal places to show if frames are shown
    secondsDecimalLength?: number;
    // If error happens, set up HTML message via string or function
    customError?: any;
    // Array of keyboard actions such as play/pause
    keyActions?: Function[];
    // Hide WAI-ARIA video player title so it can be added externally on the website
    hideScreenReaderTitle?: boolean;
  }

  declare type TPlayerFeature =
    | 'playpause'
    | 'current'
    | 'progress'
    | 'duration'
    | 'tracks'
    | 'volume'
    | 'fullscreen';

  declare type TStretchSetting = 'auto' | 'fill' | 'responsive' | 'none';
}
