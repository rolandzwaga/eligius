declare module '*.css' {
  interface IClassNames {
    [className: string]: string;
  }
  const classNames: IClassNames;
  export = classNames;
}

declare module mediaelementjs {
  class MediaElementPlayer {
    currentTime: number;
    duration: number;
    paused: boolean;
    loop: boolean;
    play(): void;
    stop(): void;
    pause(): void;
    remove(): void;
    setCurrentTime(position: number): void;
  }
}
