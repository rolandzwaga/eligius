export type TPlayState = 'stopped' | 'running';

export interface ITimelineProvider {
  playState: TPlayState;
  loop: boolean;
  init(): Promise<void>;
  start(): void;
  stop(): void;
  pause(): void;
  seek(position: number): Promise<number>;
  playlistItem(uri: string): void;
  getPosition(): number;
  getDuration(): number;
  getContainer(): JQuery<HTMLElement> | undefined;
  destroy(): void;
  onTime(callback: (position: number) => void): void;
  onComplete(callback: () => void): void;
  onRestart(callback: () => void): void;
  onFirstFrame(callback: () => void): void;
}
