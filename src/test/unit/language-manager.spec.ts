import { expect } from 'chai';
import { IEventbus } from '../../eventbus';
import { LanguageManager } from '../../language-manager';
import { ILanguageLabel } from '../../types';

describe('LanguageManager', () => {
  let eventbus: IEventbus = {} as IEventbus;
  let language = 'nl-NL';
  let labels: ILanguageLabel[] = [];
  let subscriptions: any = [];

  function createEventbusStub(): IEventbus {
    subscriptions = [];
    return {
      on: (name: string, handler: () => void) => {
        subscriptions.push({ name, handler });
      },
      broadcast: (_name: string, _args: any[]) => {},
    } as IEventbus;
  }

  beforeEach(() => {
    eventbus = createEventbusStub();
  });

  it('should create an instance and add the needed event listeners', () => {
    const languageManager = new LanguageManager(language, labels, eventbus);
    expect(languageManager).to.be.not.undefined;
    expect(subscriptions.length).to.equal(4);
  });

  /*it('should return the current language', () => {
    const languageManager = new LanguageManager(language, labels, eventbus);
    languageManager._handleRequestCurrentLanguage((current) => {
      expect(current).to.equal(language);
    });
  });

  it('should return the requested label collection', () => {
    const labelId = 'testId';
    labels = [
      {
        id: labelId,
        labels: [],
      },
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
        labels: [],
      },
      {
        id: labelId2,
        labels: [],
      },
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
    const languageManager = new LanguageManager(language, labels, eventbus);

    // test
    try {
      languageManager._handleLanguageChange(null);
    } catch (e) {
      error = e;
    }

    // expect
    expect(error).to.not.equal(null);
  });

  it('should refuse an empty value for the given language', () => {
    // given
    let error = null;
    const languageManager = new LanguageManager(language, labels, eventbus);

    // test
    try {
      languageManager._handleLanguageChange('');
    } catch (e) {
      error = e;
    }

    // expect
    expect(error).to.not.equal(null);
  });
  */
});
