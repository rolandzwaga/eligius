import { ILanguageLabel } from '../../types';
import { ConfigurationFactory } from './configuration-factory';

export class LabelEditor {
  constructor(
    private factory: ConfigurationFactory,
    private languageLabel: ILanguageLabel
  ) {}

  private _internalGetLabel(languageCode: string) {
    return this.languageLabel.labels.find(
      (x) => x.languageCode === languageCode
    );
  }

  setLabel(languageCode: string, translation: string) {
    const label = this._internalGetLabel(languageCode);
    if (label) {
      label.label === translation;
    } else {
      throw new Error(`No label found for language code '${languageCode}'`);
    }
    return this;
  }

  removeLabel(languageCode: string) {
    const idx = this.languageLabel.labels.findIndex(
      (x) => x.languageCode === languageCode
    );
    if (idx > -1) {
      this.languageLabel.labels.splice(idx, 1);
    } else {
      throw new Error(`No label found for language code '${languageCode}'`);
    }
    return this;
  }

  end() {
    return this.factory;
  }
}
