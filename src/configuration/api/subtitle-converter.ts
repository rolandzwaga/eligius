import type {IStrictDuration, ISubtitle} from '../../types.ts';

/**
 * This class converts an AVID subtitle file to an `ISubtitle` array.
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
    if (lines[0] === '') {
      lines.splice(0, 1);
    }
    while (lines[lines.length - 1] === '') {
      lines.pop();
    }
    let caption: Partial<ISubtitle> | null = null;
    lines.forEach((line: string) => {
      if (line.length === 0 || !caption) {
        caption = {text: ''};
        if (line.length) {
          //this happens for first caption only
          caption.duration = this.convertDuration(line);
        }
        result.push(caption as ISubtitle);
      } else {
        if (!Object.hasOwn(caption, 'duration')) {
          caption.duration = this.convertDuration(line);
        } else {
          caption.text += line;
        }
      }
    });
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
