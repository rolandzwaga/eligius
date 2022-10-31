export interface ITimelineProvider {
  loop: boolean;
  init(): Promise<void>;
  start(): void;
  stop(): void;
  pause(): void;
  seek(position: number): void;
  playlistItem(uri: string): void;
  getPosition(): number;
  getDuration(): number;
  destroy(): void;
}
