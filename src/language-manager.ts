import TimelineEventNames from './timeline-event-names';
import $ from 'jquery';
import { IEventbus, TEventHandlerRemover } from './eventbus/types';
import { ILanguageLabel, ILabel, TResultCallback } from './types';

class LanguageManager {
  #labelLookup: Record<string, ILabel[]> = {};
  #eventbusListeners: TEventHandlerRemover[] = [];

  constructor(private currentLanguage: string, labels: ILanguageLabel[], private eventbus: IEventbus) {
    if (!currentLanguage || !currentLanguage.length) {
      throw new Error('language ctor arg cannot be null or have zero length');
    }
    if (!labels) {
      throw new Error('labels ctor arg cannot be null');
    }
    if (!eventbus) {
      throw new Error('eventbus ctor arg cannot be null');
    }
    this._setRootElementLang(currentLanguage);
    this._createLabelLookup(labels);
    this._addEventbusListeners(eventbus);
  }

  _addEventbusListeners(eventbus: IEventbus) {
    this.#eventbusListeners.push(
      eventbus.on(TimelineEventNames.REQUEST_LABEL_COLLECTION, this._handleRequestLabelCollection.bind(this))
    );
    this.#eventbusListeners.push(
      eventbus.on(TimelineEventNames.REQUEST_LABEL_COLLECTIONS, this._handleRequestLabelCollections.bind(this))
    );
    this.#eventbusListeners.push(
      eventbus.on(TimelineEventNames.REQUEST_CURRENT_LANGUAGE, this._handleRequestCurrentLanguage.bind(this))
    );
    this.#eventbusListeners.push(
      eventbus.on(TimelineEventNames.LANGUAGE_CHANGE, this._handleLanguageChange.bind(this))
    );
  }

  _handleRequestCurrentLanguage(resultCallback: TResultCallback) {
    resultCallback(this.currentLanguage);
  }

  _handleRequestLabelCollection(labelId: string, resultCallback: TResultCallback) {
    resultCallback(this.#labelLookup[labelId]);
  }

  _handleRequestLabelCollections(labelIds: string[], resultCallback: TResultCallback) {
    const labelCollections = labelIds.map((labelId) => {
      return this.#labelLookup[labelId];
    });
    resultCallback(labelCollections);
  }

  _handleLanguageChange(language: string) {
    if (language && language.length) {
      this.currentLanguage = language;
      this._setRootElementLang(this.currentLanguage);
    } else {
      console.error('Language cannot be changed to null or empty string');
    }
  }

  _setRootElementLang(language: string) {
    const callBack = (rootSelector: string) => {
      const lang = this._extractLanguageFromCulture(language);
      $(rootSelector).attr('lang', lang);
    };
    this.eventbus.broadcast(TimelineEventNames.REQUEST_ENGINE_ROOT, [callBack]);
  }

  _extractLanguageFromCulture(culture: string) {
    if (culture.indexOf('-') > -1) {
      return culture.split('-').shift() as string;
    }
    return culture;
  }

  _createLabelLookup(labels: ILanguageLabel[]) {
    labels.forEach((label) => {
      this.#labelLookup[label.id] = label.labels;
    });
  }
}

export default LanguageManager;
