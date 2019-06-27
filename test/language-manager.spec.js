import { LanguageManager } from '../src';
import { expect } from 'chai';

describe('LanguageManager', () => {

    let eventbus = null;
    let language = "nl-NL";
    let labels = [];

    function createEventbusStub() {
        return {
            on: (name, handler)=> {},
            broadcast: (name, args)=> {}
        };
    }

    beforeEach(() => {
        eventbus = createEventbusStub();
    });

    it('should create an instance and set correct init properties', () => {
        const languageManager = new LanguageManager(language, labels, eventbus);
        expect(languageManager._currentLanguage).to.equal(language);
        expect(languageManager._eventbusListeners).to.not.equal(null);
        expect(languageManager._eventbusListeners.length).to.equal(4);
    });

    it('should return the current language', () => {
        const languageManager = new LanguageManager(language, labels, eventbus);
        languageManager._handleRequestCurrentLanguage((current)=> {
            expect(current).to.equal(language);
        });
    });

    it('should return the requested label collection', () => {
        const labelId = 'testId';
        labels = [
            {
                id: labelId,
                labels: []
            }
        ];
        const languageManager = new LanguageManager(language, labels, eventbus);
        languageManager._handleRequestLabelCollection(labelId, (labelCollection) => {
            expect(labelCollection).to.equal(labels[0].labels);
        });
    });

    it('should return the requested label collections', () => {
        const labelId1 = 'testId1';
        const labelId2 = 'testId2';
        labels = [
            {
                id: labelId1,
                labels: []
            },
            {
                id: labelId2,
                labels: []
            }
        ];
        const languageManager = new LanguageManager(language, labels, eventbus);
        languageManager._handleRequestLabelCollections([labelId1, labelId2], (labelCollections) => {
            expect(labelCollections[0]).to.equal(labels[0].labels);
            expect(labelCollections[1]).to.equal(labels[1].labels);
        });
    });

    it('should set the given language', () => {
        // given
        const languageManager = new LanguageManager(language, labels, eventbus);
        const newLanguage = 'en';

        // test
        languageManager._handleLanguageChange(newLanguage);

        // expect
        expect(languageManager._currentLanguage).to.equal(newLanguage);
    });

    it('should refuse a null value for the given language', () => {
        // given
        let error = null;

        // test
        try {
            languageManager.handleLanguageChange(null);
        } catch(e) {
            error = e;
        }

        // expect
        expect(error).to.not.equal(null);
    });

    it('should refuse an empty value for the given language', () => {
        // given
        let error = null;

        // test
        try {
            languageManager.handleLanguageChange('');
        } catch(e) {
            error = e;
        }

        // expect
        expect(error).to.not.equal(null);
    });

});
