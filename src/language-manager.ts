import TimelineEventNames from './timeline-event-names';
import $ from 'jquery';
import { IEventbus } from './eventbus/types';

class LanguageManager {
  constructor(private language: string, private labels, private eventbus: IEventbus) {
    if (!language || !language.length) {
      throw new Error('language ctor arg cannot be null or have zero length');
    }
    if (!labels) {
      throw new Error('labels ctor arg cannot be null');
    }
    if (!eventbus) {
      throw new Error('eventbus ctor arg cannot be null');
    }
    this.eventbus = eventbus;
    this._labelLookup = {};
    this._currentLanguage = language;
    this._setRootElementLang(language);
    this._eventbusListeners = [];
    this._createLabelLookup(labels);
    this._addEventbusListeners(eventbus);
  }

  _addEventbusListeners(eventbus) {
    this._eventbusListeners.push(
      eventbus.on(TimelineEventNames.REQUEST_LABEL_COLLECTION, this._handleRequestLabelCollection.bind(this))
    );
    this._eventbusListeners.push(
      eventbus.on(TimelineEventNames.REQUEST_LABEL_COLLECTIONS, this._handleRequestLabelCollections.bind(this))
    );
    this._eventbusListeners.push(
      eventbus.on(TimelineEventNames.REQUEST_CURRENT_LANGUAGE, this._handleRequestCurrentLanguage.bind(this))
    );
    this._eventbusListeners.push(
      eventbus.on(TimelineEventNames.LANGUAGE_CHANGE, this._handleLanguageChange.bind(this))
    );
  }

  _handleRequestCurrentLanguage(resultCallback) {
    resultCallback(this._currentLanguage);
  }

  _handleRequestLabelCollection(labelId, resultCallback) {
    resultCallback(this._labelLookup[labelId]);
  }

  _handleRequestLabelCollections(labelIds, resultCallback) {
    const labelCollections = labelIds.map((labelId) => {
      return this._labelLookup[labelId];
    });
    resultCallback(labelCollections);
  }

  _handleLanguageChange(language) {
    if (language && language.length) {
      this._currentLanguage = language;
      this._setRootElementLang(this._currentLanguage);
    } else {
      console.error('Language cannot be changed to null or empty string');
    }
  }

  _setRootElementLang(language) {
    const callBack = (rootSelector) => {
      const lang = this._extractLanguageFromCulture(language);
      $(rootSelector).attr('lang', lang);
    };
    this.eventbus.broadcast(TimelineEventNames.REQUEST_ENGINE_ROOT, [callBack]);
  }

  _extractLanguageFromCulture(culture) {
    if (culture.indexOf('-') > -1) {
      return culture.split('-').shift();
    }
    return culture;
  }

  _createLabelLookup(labels) {
    labels.forEach((label) => {
      this._labelLookup[label.id] = label.labels;
    });
  }
}

export default LanguageManager;
