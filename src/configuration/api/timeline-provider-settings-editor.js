import * as timelineProviders from '../../timelineproviders';

export default class TimelineProviderSettingsEditor {

    constructor(providerSettings, configurationFactory) {
        this.providerSettings = providerSettings;
        this.configurationFactory = configurationFactory;
    }

    setVendor(vendor) {
        this.providerSettings.vendor = vendor;
        return this;
    }

    setSelector(selector) {
        this.providerSettings.selector = selector;
        return this;
    }

    setSystemname(systemName) {
        if (!timelineProviders[systemName]) {
            throw new Error(`Unknown timelineprovider system name: ${systemName}`);
        }
        this.providerSettings.systemName = systemName;
        return this;
    }

    next() {
        return this.configurationFactory;
    }
}
