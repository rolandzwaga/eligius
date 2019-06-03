import uuid from 'uuid';
import { ActionCreatorFactory } from './action-creator-factory';
import { ActionEditor } from './action-editor';
import { TimelineActionEditor, EndableActionEditor } from './action-editor';
import TimelineProviderSettingsEditor from './timeline-provider-settings-editor';
import deepcopy from '../../operation/helper/deepcopy';

class ConfigurationFactory {

    actionCreatorFactory = null;
    configuration = null;

    constructor(config = null) {
        this.configuration = config || {};
        this.actionCreatorFactory = new ActionCreatorFactory(this);
    }

    init(defaultLanguage) {
        this.configuration = {
            id: uuid(),
            engine: {
                systemName: 'ChronoTriggerEngine'
            },
            containerSelector: '#ct-container',
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

    setDefaultLanguage(defaultLanguage) {
        this.configuration.language = defaultLanguage;
        return this;
    }

    setContainerSelector(selector) {
        this.configuration.containerSelector = selector;
        return this;
    }

    editTimelineProviderSettings() {
        return new TimelineProviderSettingsEditor(this.configuration.timelineProviderSettings, this);
    }

    getConfiguration(callBack) {
        const copy = deepcopy(this.configuration);
        const newConfig = callBack.call(this, copy);
        if (newConfig) {
            this.configuration = newConfig;
        }
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
    }

    addInitAction(action) {
        this._internalAddAction('initActions', action)
    }

    addEventAction(action) {
        this._internalAddAction('eventActions', action)
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

    createAction(name) {
        return this.actionCreatorFactory.createAction(name);
    }

    createInitAction(name) {
        return this.actionCreatorFactory.createInitAction(name);
    }

    createEventAction(name) {
        return this.actionCreatorFactory.createEventAction(name);
    }

    createTimelineAction(uri, name) {
        return this.actionCreatorFactory.createTimelineAction(uri, name);
    }

    addTimeline(uri, type, duration, loop, selector) {
        const timelines = this._initializeCollection(this.configuration, 'timelines');
        const timeline = this.getTimeline(uri);
        if (timeline) {
            throw Error(`timeline for uri ${uri} already exists`);
        }
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
        let label = labels.find(l => l.id === id);
        if (!label) {
            labels.push({
                id: id,
                labels: []
            });
            label = labels[labels.length-1];
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

    editAction(id) {
        const actionConfig = this.configuration.actions.find(a => a.id === id);
        if (actionConfig) {
            return new ActionEditor(actionConfig, this);
        }
        throw new Error(`Action not found for id ${id}`);
    }

    editEventAction(id) {
        const actionConfig = this.configuration.eventActions.find(a => a.id === id);
        if (actionConfig) {
            return new ActionEditor(actionConfig, this);
        }
        throw new Error(`Event action not found for id ${id}`);
    }

    editInitAction(id) {
        const actionConfig = this.configuration.initActions.find(a => a.id === id);
        if (actionConfig) {
            return new EndableActionEditor(actionConfig, this);
        }
        throw new Error(`Init action not found for id ${id}`);
    }

    editTimelineAction(uri, id) {
        const timeline = this.getTimeline(uri);
        if (!timeline) {
            throw new Error(`Timeline not found for id ${id}`);
        }
        const actionConfig = timeline.timelineActions.find(a => a.id === id);
        if (actionConfig) {
            return new TimelineActionEditor(actionConfig, this);
        }
        throw new Error(`Timeline action not found for id ${id}`);
    }
}

export default ConfigurationFactory;
