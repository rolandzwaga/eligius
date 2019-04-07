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
        this.eventbusListeners = [];
        this.createLabelLookup(labels);
        this.addEventbusListeners(eventbus);
    }

    addEventbusListeners(eventbus) {
        this.eventbusListeners.push(eventbus.on(TimelineEventNames.REQUEST_LABEL_COLLECTION, this.handleRequestLabelCollection.bind(this)));
        this.eventbusListeners.push(eventbus.on(TimelineEventNames.REQUEST_LABEL_COLLECTIONS, this.handleRequestLabelCollections.bind(this)));
        this.eventbusListeners.push(eventbus.on(TimelineEventNames.REQUEST_CURRENT_LANGUAGE, this.handleRequestCurrentLanguage.bind(this)));
        this.eventbusListeners.push(eventbus.on(TimelineEventNames.LANGUAGE_CHANGE, this.handleLanguageChange.bind(this)));
    }

    handleRequestCurrentLanguage(resultCallback) {
        resultCallback(this._currentLanguage);
    }

    handleRequestLabelCollection(labelId, resultCallback) {
        resultCallback(this._labelLookup[labelId]);
    }

    handleRequestLabelCollections(labelIds, resultCallback) {
        const labelCollections = labelIds.map((labelId) => {
            return this._labelLookup[labelId];
        });
        resultCallback(labelCollections);
    }

    handleLanguageChange(language) {
        if (language && language.length) {
            this._currentLanguage = language;
        } else {
            console.error('Language cannot be changed to null or empty string');
        }
    }

    createLabelLookup(labels) {
        labels.forEach((label) => {
            this._labelLookup[label.id] = label.labels;
        });
    }
}

export default LanguageManager;
