import { v4 as uuidv4 } from 'uuid';
import { ISubtitle, ISubtitleCollection } from '../../types';

/**
 * Used to edit and add to an {@link ISubtitleCollection}.
 */
export class SubtitleEditor {
  constructor(private collection: ISubtitleCollection[] = []) {}

  private _getLanguage(languageCode: string) {
    return this.collection.find((x) => x.languageCode === languageCode);
  }

  addLanguage(languageCode: string) {
    const language = this._getLanguage(languageCode);
    if (language) {
      throw new Error(`Language ${languageCode} already exists.`);
    }
    const newLanguage: ISubtitleCollection = this.collection.length
      ? {
          ...this.collection[0],
          titles: this.collection[0].titles.map((x) => ({
            id: uuidv4(),
            duration: { ...x.duration },
            text: '',
          })),
        }
      : {
          languageCode,
          titles: [],
        };
    this.collection.push(newLanguage);
    return this;
  }

  addSubtitle(languageCode: string, subtitle: ISubtitle) {
    const language = this._getLanguage(languageCode);
    if (!language) {
      throw new Error(`Language ${languageCode} does not exist.`);
    }
    language.titles.push(subtitle);
    return this;
  }

  addSubtitles(subtitles: Record<string, ISubtitle>) {
    Object.entries(subtitles).forEach(([languageCode, subtitle]) =>
      this.addSubtitle(languageCode, subtitle)
    );
    return this;
  }

  setSubtitle(languageCode: string, subtitle: ISubtitle) {
    const language = this._getLanguage(languageCode);
    if (!language) {
      throw new Error(`Language ${languageCode} does not exist.`);
    }

    const titleIdx = language.titles.findIndex((x) => x.id === subtitle.id);
    if (titleIdx < 0) {
      throw new Error(
        `Subtitle with id '${subtitle.id}' was not found in language with code ${languageCode}.`
      );
    }

    language.titles[titleIdx] = {
      ...subtitle,
      duration: { ...subtitle.duration },
    };
    return this;
  }

  export() {
    return this.collection;
  }
}
