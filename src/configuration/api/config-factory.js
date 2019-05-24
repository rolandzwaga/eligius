import uuid from 'uuid';
import * as timelineProvider from '../../timelineproviders';

class ConfigFactory {

    configuration = null;

    constructor(config=null) {
        this.configuration = config;
    }

    init(defaultLanguage) {
        this.configuration = {
            id: uuid(),
            engine: {
                systemName: "ChronoTriggerEngine"
            },
            containerSelector: "#ct-container",
            timelineProviderSettings: {
                vendor: null,
                selector: null,
                systemName: null
            },
            language: defaultLanguage,
            availableLanguages: []
        };
        return this;
    }

    addTimelineSettings(selector, systemName) {
        if (!this.configuration.timelineProviderSettings) {
            this.configuration.timelineProviderSettings = {};
        }
        this.configuration.timelineProviderSettings.selector = selector;
        if (!timelineProvider[systemName]) {
            throw new Error(`Unknown timelineprovider system name: ${systemName}`);
        }
        this.configuration.timelineProviderSettings.systemName = systemName;
        return this;
    }

    addLanguage(code, languageLabel) {
        const languages = this._initializeCollection(this.configuration, 'availableLanguages');
        languages.push({
            code: code,
            label: languageLabel
        });
        return this;
    }

    _internalAddAction(collectionName, action) {
        const actions = this._initializeCollection(this.configuration, collectionName);
        actions.push(action);
    }

    _initializeCollection(parent, name) {
        if (!parent[name]) {
            parent[name] = [];
        }
        return parent[name];
    }

    addAction(action) {
        this._internalAddAction('actions', action)
        return this;
    }

    addInitAction(initAction) {
        this._internalAddAction('initActions', initAction)
        return this;
    }

    addEventAction(eventAction) {
        this._internalAddAction('eventActions', eventAction)
        return this;
    }

    addTimelineAction(uri, action) {
        const timeline = this.getTimeline(uri);
        if (timeline) {
            const timelineActions = this._initializeCollection(timeline, 'timelineActions');
            timelineActions.push(action);
        } else {
            throw Error(`No timeline found for uri '${uri}'`);
        }
    }

    addTimeline(type, duration, uri, loop, selector) {
        const timelines = this._initializeCollection(this.configuration, 'timelines');
        const timelineConfig = {
            type: type,
            uri: uri,
            duration: duration,
            loop: loop,
            selector: selector,
            timelineActions: []
        }
        timelines.push(timelineConfig);
        return this;
    }

    getTimeline(uri) {
        return this.configuration.timelines ? this.configuration.timelines.find((t => t.uri === uri)) : null;
    }

    removeTimeline(uri) {
        if (!this.configuration.timelines) {
            return;
        }
        const timelineConfig = this.getTimeline(uri);
        if (timelineConfig) {
            const idx = this.configuration.timelines.indexOf(timelineConfig);
            if (idx > -1) {
                this.configuration.timelines.splice(idx, 1);
            }
        }
        return this;
    }

    _initializeLabel(id, labels) {
        const label = labels.find(l => l.id === id);
        if (!label) {
            labels.push({
                id: id,
                labels: []
            });
        }
        return label;
    }

    _getLabelTranslation(labelTranslations, languageCode) {
        let translation = labelTranslations.find(l => l.code === languageCode);
        if (!translation) {
            translation = {
                code: languageCode
            };
            labelTranslations.push(translation);
        }
        return translation;
    }

    addLabel(id, code, translation) {
        const labels = this._initializeCollection(this.configuration, 'labels');
        const labelConfig = this._initializeLabel(id, labels);
        const labelTranslation = this._getLabelTranslation(labelConfig.labels, code);
        labelTranslation.label = translation;
        return this;
    }
}

export default ConfigFactory;
