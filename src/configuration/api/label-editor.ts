import type {ConfigurationFactory} from '@configuration/api/configuration-factory.ts';
import type {ILanguageLabel, TLanguageCode} from '../../types.ts';

/**
 * Factory that assists with editing a label
 */
export class LabelEditor {
  constructor(
    private configurationFactory: ConfigurationFactory,
    private languageLabel: ILanguageLabel
  ) {}

  private _internalGetLabel(languageCode: string) {
    return this.languageLabel.labels.find(x => x.languageCode === languageCode);
  }

  /**
   *
   * Set the translation associated with the given language code
   *
   * @param languageCode
   * @param translation
   * @returns
   */
  setLabel(languageCode: TLanguageCode, translation: string) {
    const label = this._internalGetLabel(languageCode);
    if (label) {
      label.label === translation;
    } else {
      throw new Error(`No label found for language code '${languageCode}'`);
    }
    return this;
  }

  /**
   *
   * Remove all of the translations for the given language code
   *
   * @param languageCode
   * @returns
   */
  removeLabel(languageCode: TLanguageCode) {
    const idx = this.languageLabel.labels.findIndex(
      x => x.languageCode === languageCode
    );
    if (idx > -1) {
      this.languageLabel.labels.splice(idx, 1);
    } else {
      throw new Error(`No label found for language code '${languageCode}'`);
    }
    return this;
  }

  /**
   *
   * Returns the fluent scope back to the `ConfigurationFactory`
   *
   * @returns
   */
  end() {
    return this.configurationFactory;
  }
}
