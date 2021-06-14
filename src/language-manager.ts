import $ from 'jquery';
import { IEventbus, TEventHandlerRemover } from './eventbus/types';
import { TimelineEventNames } from './timeline-event-names';
import { ILabel, ILanguageLabel, TResultCallback } from './types';

export class LanguageManager {
  private _labelLookup: Record<string, ILabel[]> = {};
  private _eventbusListeners: TEventHandlerRemover[] = [];

  constructor(
    private _currentLanguage: string,
    labels: ILanguageLabel[],
    private _eventbus: IEventbus
  ) {
    if (!_currentLanguage || !_currentLanguage.length) {
      throw new Error('language ctor arg cannot be null or have zero length');
    }
    if (!labels) {
      throw new Error('labels ctor arg cannot be null');
    }
    if (!_eventbus) {
      throw new Error('eventbus ctor arg cannot be null');
    }
    this._setRootElementLang(_currentLanguage);
    this._createLabelLookup(labels);
    this._addEventbusListeners(_eventbus);
  }

  _addEventbusListeners(eventbus: IEventbus) {
    this._eventbusListeners.push(
      eventbus.on(
        TimelineEventNames.REQUEST_LABEL_COLLECTION,
        this._handleRequestLabelCollection.bind(this)
      )
    );
    this._eventbusListeners.push(
      eventbus.on(
        TimelineEventNames.REQUEST_LABEL_COLLECTIONS,
        this._handleRequestLabelCollections.bind(this)
      )
    );
    this._eventbusListeners.push(
      eventbus.on(
        TimelineEventNames.REQUEST_CURRENT_LANGUAGE,
        this._handleRequestCurrentLanguage.bind(this)
      )
    );
    this._eventbusListeners.push(
      eventbus.on(
        TimelineEventNames.LANGUAGE_CHANGE,
        this._handleLanguageChange.bind(this)
      )
    );
  }

  _handleRequestCurrentLanguage(resultCallback: TResultCallback) {
    resultCallback(this._currentLanguage);
  }

  _handleRequestLabelCollection(
    labelId: string,
    resultCallback: TResultCallback
  ) {
    resultCallback(this._labelLookup[labelId]);
  }

  _handleRequestLabelCollections(
    labelIds: string[],
    resultCallback: TResultCallback
  ) {
    const labelCollections = labelIds.map(labelId => {
      return this._labelLookup[labelId];
    });
    resultCallback(labelCollections);
  }

  _handleLanguageChange(language: string) {
    if (language && language.length) {
      this._currentLanguage = language;
      this._setRootElementLang(this._currentLanguage);
    } else {
      console.error('Language cannot be changed to null or empty string');
    }
  }

  _setRootElementLang(language: string) {
    const callBack = (rootSelector: string) => {
      const lang = this._extractLanguageFromCulture(language);
      $(rootSelector).attr('lang', lang);
    };
    this._eventbus.broadcast(TimelineEventNames.REQUEST_ENGINE_ROOT, [
      callBack,
    ]);
  }

  _extractLanguageFromCulture(culture: string) {
    if (culture.indexOf('-') > -1) {
      return culture.split('-').shift() as string;
    }
    return culture;
  }

  _createLabelLookup(labels: ILanguageLabel[]) {
    labels.forEach(label => {
      this._labelLookup[label.id] = label.labels;
    });
  }
}
