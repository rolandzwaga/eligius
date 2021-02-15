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
declare module mediaelementjs {
  class MediaElementPlayer {
    duration: number;
    paused: boolean;
    loop: boolean;
    controlsAreVisible: boolean;
    controlsEnabled: boolean;

    autoplay: boolean; //Set or return whether the audio/video should start playing as soon as it is loaded	X	X
    buffered: TimeRanges; //Return a TimeRanges object representing the buffered parts of the audio/video	X
    controls: boolean; //Set or return whether the audio/video should display controls (like play/pause etc.)	X	X
    currentSrc: string; //Return the URL of the current audio/video	X
    currentTime: number; //Set or return the current playback position in the audio/video (in seconds)	X	X
    ended: boolean; //Return whether the playback of the audio/video has ended or not	X
    error: MediaError | undefined; //Return a MediaError object representing the error state of the audio/video	X
    muted: boolean; //Set or returns whether the audio/video is muted or not	X	X
    readyState: any; //Return the current ready state of the audio/video	X
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
  }
}
