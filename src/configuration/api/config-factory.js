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
        if (!this.configuration.availableLanguages) {
            this.configuration.availableLanguages = [];
        }

        this.configuration.availableLanguages.push({
            code: code,
            label: languageLabel
        });
        return this;
    }
}

export default ConfigFactory;
