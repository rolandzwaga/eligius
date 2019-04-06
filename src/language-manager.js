class LanguageManager {
    constructor(language, labels, eventbus) {
        this._labelLookup = {};
        this._currentLanguage = language;
        this.eventbusListeners = [];
        this.createLabelLookup(labels);
        this.addEventbusListeners(eventbus);
    }

    addEventbusListeners(eventbus) {
        this.eventbusListeners.push(eventbus.on("request-label-collection", this.handleRequestTextData.bind(this)));
        this.eventbusListeners.push(eventbus.on("request-label-collections", this.handleRequestTextDatas.bind(this)));
        this.eventbusListeners.push(eventbus.on("request-current-language", this.handleRequestCurrentLanguage.bind(this)));
        this.eventbusListeners.push(eventbus.on("language-change", this.handleLanguageChange.bind(this)));
    }

    handleRequestCurrentLanguage(resultCallback) {
        resultCallback(this._currentLanguage);
    }

    handleRequestTextData(labelId, resultCallback) {
        resultCallback(this._labelLookup[labelId]);
    }

    handleRequestTextDatas(labelIds, resultCallback) {
        const labelCollections = [];
        labelIds.forEach((labelId) => {
            labelCollections.push(this._labelLookup[labelId]);
        });
        resultCallback(labelCollections);
    }

    handleLanguageChange(language) {
        if (language) {
            this._currentLanguage = language;
        }
    }

    createLabelLookup(labels) {
        labels.forEach((label) => {
            this._labelLookup[label.id] = label.labels;
        });
    }
}

export default LanguageManager;
