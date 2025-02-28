import { v4 as uuidv4 } from 'uuid';
import type {
  IStrictDuration,
  ISubtitle,
  ISubtitleCollection,
  TLanguageCode,
} from '../../types.ts';

/**
 * Used to edit and add to an {@link ISubtitleCollection}.
 */
export class SubtitleEditor {
  constructor(private collection: ISubtitleCollection[] = []) {}

  private _getLanguage(languageCode: string) {
    return this.collection.find((x) => x.languageCode === languageCode);
  }

  /**
   * Adds a new {@link ISubtitleCollection} for the given `languageCode`.
   *
   * If collections already exist for existing language codes then a duplicate
   * of these collections is created with the same duration info but all of the
   * text is left empty.
   *
   * @param languageCode
   * @returns
   */
  addLanguage(languageCode: TLanguageCode) {
    const language = this._getLanguage(languageCode);
    if (language) {
      throw new Error(`Language ${languageCode} already exists.`);
    }
    const newLanguage: ISubtitleCollection = this.collection.length
      ? {
          ...this.collection[0],
          languageCode,
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

  /**
   * 
   * Add a single subtitle line that is associated with the given `languageCode`
   * 
   * @param languageCode 
   * @param subtitle 
   * @returns 
   */
  addSubtitle(languageCode: TLanguageCode, subtitle: ISubtitle) {
    const language = this._getLanguage(languageCode);
    if (!language) {
      throw new Error(`Language ${languageCode} does not exist.`);
    }
    language.titles.push(subtitle);
    return this;
  }

  addSubtitles(
    duration: IStrictDuration,
    subtitles: Record<TLanguageCode, string>
  ) {
    Object.entries(subtitles).forEach(([languageCode, subtitle]) =>
      this.addSubtitle(languageCode as TLanguageCode, {
        id: uuidv4(),
        duration: { ...duration },
        text: subtitle,
      })
    );
    return this;
  }

  setSubtitle(languageCode: TLanguageCode, subtitle: ISubtitle) {
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
