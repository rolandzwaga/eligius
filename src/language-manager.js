import TimelineEventNames from "./timeline-event-names";

class LanguageManager {

    constructor(language, labels, eventbus) {
        if (!language || !language.length) {
            throw new Error('language ctor arg cannot be null or have zero length');
        }
        if (!labels) {
            throw new Error('labels ctor arg cannot be null');
        }
        if (!eventbus) {
            throw new Error('eventbus ctor arg cannot be null');
        }
        this._labelLookup = {};
        this._currentLanguage = language;
        this._eventbusListeners = [];
        this._createLabelLookup(labels);
        this._addEventbusListeners(eventbus);
    }

    _addEventbusListeners(eventbus) {
        this._eventbusListeners.push(eventbus.on(TimelineEventNames.REQUEST_LABEL_COLLECTION, this._handleRequestLabelCollection.bind(this)));
        this._eventbusListeners.push(eventbus.on(TimelineEventNames.REQUEST_LABEL_COLLECTIONS, this._handleRequestLabelCollections.bind(this)));
        this._eventbusListeners.push(eventbus.on(TimelineEventNames.REQUEST_CURRENT_LANGUAGE, this._handleRequestCurrentLanguage.bind(this)));
        this._eventbusListeners.push(eventbus.on(TimelineEventNames.LANGUAGE_CHANGE, this._handleLanguageChange.bind(this)));
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
        } else {
            console.error('Language cannot be changed to null or empty string');
        }
    }

    _createLabelLookup(labels) {
        labels.forEach((label) => {
            this._labelLookup[label.id] = label.labels;
        });
    }
}

export default LanguageManager;
