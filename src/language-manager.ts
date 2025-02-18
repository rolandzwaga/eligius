import $ from 'jquery';
import type { IEventbus, TEventbusRemover } from './eventbus/types.ts';
import { setGlobal } from './operation/helper/set-global.ts';
import { TimelineEventNames } from './timeline-event-names.ts';
import type { ILabel, ILanguageLabel, TResultCallback } from './types.ts';

/**
 * This class manages the labels for an {@link IEligiusEngine} instance.
 * 
 * It handles the {@link TimelineEventNames.REQUEST_LABEL_COLLECTION}, {@link TimelineEventNames.REQUEST_LABEL_COLLECTIONS}, {@link TimelineEventNames.REQUEST_CURRENT_LANGUAGE} and {@link TimelineEventNames.LANGUAGE_CHANGE} events.
 * 
 */
export class LanguageManager {
  private _labelLookup: Record<string, ILabel[]>;
  private _eventbusRemovers: TEventbusRemover[] = [];

  constructor(
    private _currentLanguage: string,
    labels: ILanguageLabel[],
    private _eventbus: IEventbus
  ) {
    if (!_currentLanguage) {
      throw new Error('language ctor arg cannot have zero length');
    }
    setGlobal('defaultLanguage', _currentLanguage);
    this._setRootElementLang(_currentLanguage);
    this._labelLookup = this._createLabelLookup(labels);
    this._addEventbusListeners(_eventbus);
  }

  destroy() {
    this._eventbusRemovers.forEach((x) => x());
  }

  _addEventbusListeners(eventbus: IEventbus) {
    this._eventbusRemovers.push(
      eventbus.on(
        TimelineEventNames.REQUEST_LABEL_COLLECTION,
        this._handleRequestLabelCollection.bind(this)
      )
    );
    this._eventbusRemovers.push(
      eventbus.on(
        TimelineEventNames.REQUEST_LABEL_COLLECTIONS,
        this._handleRequestLabelCollections.bind(this)
      )
    );
    this._eventbusRemovers.push(
      eventbus.on(
        TimelineEventNames.REQUEST_CURRENT_LANGUAGE,
        this._handleRequestCurrentLanguage.bind(this)
      )
    );
    this._eventbusRemovers.push(
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
    const labelCollections = labelIds.map((labelId) => {
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
    return labels.reduce<Record<string, ILabel[]>>((acc, label) => {
      acc[label.id] = label.labels;
      return acc;
    }, {});
  }
}
