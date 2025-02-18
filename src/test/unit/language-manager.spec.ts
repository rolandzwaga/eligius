import { expect } from 'chai';
import { beforeEach, describe, test, type TestContext } from 'vitest';
import type { IEventbus } from '../../eventbus/index.ts';
import { LanguageManager } from '../../language-manager.ts';
import type { ILanguageLabel } from '../../types.ts';

type LanguageManagerSuiteContext = {
  eventbus: IEventbus;
  language: string;
  labels: ILanguageLabel[];
  subscriptions: any[];
} & TestContext;
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
function withContext<T>(ctx: unknown): asserts ctx is T { }
describe<LanguageManagerSuiteContext>('LanguageManager', () => {
  beforeEach((context) => {
    withContext<LanguageManagerSuiteContext>(context);

    context.language = 'nl-NL';
    context.labels = [];
    context.subscriptions = [];

    context.eventbus = {
      on: (name: string, handler: () => void) => {
        context.subscriptions.push({ name, handler });
      },
      broadcast: (_name: string, _args: any[]) => { },
    } as IEventbus;
  });
  test<LanguageManagerSuiteContext>('should create an instance and add the needed event listeners', (context) => {
    const { language, labels, eventbus, subscriptions } = context;
    const languageManager = new LanguageManager(language, labels, eventbus);
    expect(languageManager).to.be.not.undefined;
    expect(subscriptions.length).to.equal(4);
  });
});
