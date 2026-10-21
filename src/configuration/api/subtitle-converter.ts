import {v4 as uuidv4} from 'uuid';
import type {IStrictDuration, ISubtitle} from '../../types.ts';

/**
 * This class converts an AVID subtitle file to an `ISubtitle` array.
 *
 * Every subtitle gets a unique `id`. The lines of a multi-line caption are
 * joined with a newline (`\n`), never with HTML.
 */
export class SubtitleImporter {
  importSubtitles(rawLines: string[]): ISubtitle[] {
    const result: ISubtitle[] = [];
    const lines: string[] = [];
    for (let i: number = 0, l: number = rawLines.length; i < l; i++) {
      const rawLine: string = this.stripNewlineChars(rawLines[i].toString());
      if (this.isValidLine(rawLine)) {
        lines.push(rawLine);
      }
    }

    // A caption is a duration line followed by its text lines, blank lines
    // separate the captions.
    let duration: IStrictDuration | undefined;
    let textLines: string[] = [];
    const flush = () => {
      if (duration) {
        result.push({id: uuidv4(), duration, text: textLines.join('\n')});
      }
      duration = undefined;
      textLines = [];
    };
    lines.forEach((line: string) => {
      if (line.length === 0) {
        flush();
      } else if (!duration) {
        duration = this.convertDuration(line);
      } else {
        textLines.push(line);
      }
    });
    flush();

    return result;
  }

  stripNewlineChars(str: string): string {
    let res: string = '';
    for (let i: number = 0, l: number = str.length; i < l; i++) {
      if (str.charCodeAt(i) !== 13 && str.charCodeAt(i) !== 0) {
        res += str.charAt(i);
      }
    }
    return res;
  }

  isValidLine(line: string): boolean {
    return (
      !line.startsWith('@') &&
      !line.startsWith('<begin subtitles>') &&
      !line.startsWith('<end subtitles>')
    );
  }

  convertDuration(time: string): IStrictDuration {
    const times: string[] = time.split(' ');
    return {
      start: this.convertTimeToSeconds(times[0]),
      end: this.convertTimeToSeconds(times[1]),
    };
  }

  convertTimeToSeconds(time: string): number {
    const parts: string[] = time.split(':');
    return (
      parseInt(parts[0], 10) * 3600 +
      parseInt(parts[1], 10) * 60 +
      parseInt(parts[2], 10)
    );
  }
}
