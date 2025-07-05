import type { TimelineTypes, TLanguageCode } from "types.ts";
import type { IEngineConfiguration, TTimelineProviderSettings } from "../../../configuration/types.ts";
import { ConfigurationFactory } from "../configuration-factory.ts";
import { ActionWeaver } from "./action-weaver.ts";

export class StoryWeaver {
    private _factory: ConfigurationFactory;
    private _timelineProvidersWeaver: TimelineProvidersWeaver;
    constructor(configuration: IEngineConfiguration = ({} as any)) {
        this._factory = new ConfigurationFactory(configuration);
        this._timelineProvidersWeaver = new TimelineProvidersWeaver(this._factory);
    }

    initialize(defaultLanguage: TLanguageCode, containerSelector?:string, layoutTemplate?: string, engine?: string) {
        this._factory.init(defaultLanguage);
        if (containerSelector !== undefined) {
            this._factory.setContainerSelector(containerSelector);
        }
        if (layoutTemplate !== undefined) {
            this._factory.setLayoutTemplate(layoutTemplate);
        }
        if (engine !== undefined) {
            this._factory.setEngine(engine);
        }
        return this._timelineProvidersWeaver;
    }
}

class TimelineProvidersWeaver {
    private _languageWeaver: LanguageWeaver;
    constructor(private factory: ConfigurationFactory) {
        this._languageWeaver = new LanguageWeaver(this.factory);
    }

    addTimelineProviders(settings: TTimelineProviderSettings) {
        Object.entries(settings).forEach(([key, value]) => {
            this.factory.editTimelineProviderSettings()
                .addProvider(key as TimelineTypes)
                .setSelector(value.selector ?? '')
                .setSystemName(value.systemName)
                .setVendor(value.vendor);
        });
        return this._languageWeaver;
    }
}

class LanguageWeaver {
    private _labelWeaver: LabelWeaver<any>;
    constructor(private factory: ConfigurationFactory) {
        this._labelWeaver = new LabelWeaver(factory);
    }

    addLanguages<T extends TLanguageCode>(languages: Record<T, string>): LabelWeaver<T> {
        Object.entries(languages).forEach(([code, value]) => {
            this.factory.addLanguage(code as TLanguageCode, value as string);
        });
        return this._labelWeaver;
    }

}

class LabelWeaver<T extends TLanguageCode> {

    private _actionWeaver: ActionWeaver;

    constructor(private factory: ConfigurationFactory) {
        this._actionWeaver = new ActionWeaver(factory);
    }

    addLabels(id: string, translations: Record<T, string>) {
        this.factory.addLabels(id, translations);
        return this;
    }
}
