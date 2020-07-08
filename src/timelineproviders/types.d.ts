import { TEventHandler } from '../eventbus/types';

interface ITimelineProvider {
  loop: boolean;
  init(): Promise<any>;
  start(): void;
  stop(): void;
  pause(): void;
  seek(position: number): void;
  playlistItem(uri: string): void;
  getPosition(): number;
  getDuration(): number;
  destroy(): void;
}
