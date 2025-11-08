import $ from 'jquery';
import type {IEventbus, TEventbusRemover} from './eventbus/types.ts';
import {setGlobal} from './operation/helper/set-global.ts';
import type {
  ILabel,
  ILanguageLabel,
  TLanguageCode,
  TResultCallback,
} from './types.ts';

/**
 * This class manages the labels for an {@link IEligiusEngine} instance.
 *
 * It handles the request-label-collection, request-label-collections, request-current-language and language-change events.
 *
 */
export class LanguageManager {
  private _labelLookup: Record<string, ILabel[]>;
  private _eventbusRemovers: TEventbusRemover[] = [];

  constructor(
    private _currentLanguage: TLanguageCode,
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
    this._eventbusRemovers.forEach(x => x());
  }

  _addEventbusListeners(eventbus: IEventbus) {
    this._eventbusRemovers.push(
      eventbus.on(
        'request-label-collection',
        this._handleRequestLabelCollection.bind(this)
      )
    );
    this._eventbusRemovers.push(
      eventbus.on(
        'request-label-collections',
        this._handleRequestLabelCollections.bind(this)
      )
    );
    this._eventbusRemovers.push(
      eventbus.on(
        'request-current-language',
        this._handleRequestCurrentLanguage.bind(this)
      )
    );
    this._eventbusRemovers.push(
      eventbus.on('language-change', this._handleLanguageChange.bind(this))
    );
  }

  _handleRequestCurrentLanguage(
    resultCallback: TResultCallback<TLanguageCode>
  ) {
    resultCallback(this._currentLanguage);
  }

  _handleRequestLabelCollection(
    labelId: string,
    resultCallback: TResultCallback<ILabel[]>
  ) {
    resultCallback(this._labelLookup[labelId]);
  }

  _handleRequestLabelCollections(
    labelIds: string[],
    resultCallback: TResultCallback<ILabel[][]>
  ) {
    const labelCollections = labelIds.map(labelId => {
      return this._labelLookup[labelId];
    });
    resultCallback(labelCollections);
  }

  _handleLanguageChange(language: TLanguageCode) {
    this._currentLanguage = language;
    this._setRootElementLang(this._currentLanguage);
  }

  _setRootElementLang(language: TLanguageCode) {
    const callBack = (rootSelector: string) => {
      const lang = this._extractPrimaryLanguage(language);
      $(rootSelector).attr('lang', lang);
    };
    this._eventbus.broadcast('request-engine-root', [callBack]);
  }

  _extractPrimaryLanguage(culture: TLanguageCode) {
    return culture.split('-').shift() as string;
  }

  _createLabelLookup(labels: ILanguageLabel[]) {
    return labels.reduce<Record<string, ILabel[]>>((acc, label) => {
      acc[label.id] = label.labels;
      return acc;
    }, {});
  }
}
