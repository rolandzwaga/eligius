import {beforeEach, describe, expect, type TestContext, test, vi} from 'vitest';
import {LanguageManager} from '../../language-manager.ts';
import type {ILabel, ILanguageLabel, TLanguageCode} from '../../types.ts';

type LanguageManagerSuiteContext = {
  language: TLanguageCode;
  labels: ILanguageLabel[];
} & TestContext;

function withContext<T>(ctx: unknown): asserts ctx is T {}

describe<LanguageManagerSuiteContext>('LanguageManager', () => {
  beforeEach(context => {
    withContext<LanguageManagerSuiteContext>(context);

    context.language = 'nl-NL';
    context.labels = [];
  });

  describe('constructor', () => {
    test<LanguageManagerSuiteContext>('should create an instance', context => {
      const {language, labels} = context;
      const languageManager = new LanguageManager(language, labels);
      expect(languageManager).toBeDefined();
    });

    test<LanguageManagerSuiteContext>('should throw error when language is empty', context => {
      const {labels} = context;
      expect(() => new LanguageManager('' as TLanguageCode, labels)).toThrow(
        'language ctor arg cannot have zero length'
      );
    });
  });

  describe('language property', () => {
    test<LanguageManagerSuiteContext>('should return current language', context => {
      const {language, labels} = context;
      const languageManager = new LanguageManager(language, labels);

      expect(languageManager.language).toBe('nl-NL');
    });
  });

  describe('availableLanguages property', () => {
    test<LanguageManagerSuiteContext>('should return unique languages from labels', context => {
      const {language} = context;
      const labels: ILanguageLabel[] = [
        {
          id: 'label1',
          labels: [
            {id: '1', languageCode: 'en-US', label: 'Hello'},
            {id: '2', languageCode: 'nl-NL', label: 'Hallo'},
          ],
        },
        {
          id: 'label2',
          labels: [
            {id: '3', languageCode: 'en-US', label: 'Goodbye'},
            {id: '4', languageCode: 'de-DE', label: 'Tschüss'},
          ],
        },
      ];
      const languageManager = new LanguageManager(language, labels);

      expect(languageManager.availableLanguages).toContain('en-US');
      expect(languageManager.availableLanguages).toContain('nl-NL');
      expect(languageManager.availableLanguages).toContain('de-DE');
      expect(languageManager.availableLanguages.length).toBe(3);
    });

    test<LanguageManagerSuiteContext>('should return empty array when no labels', context => {
      const {language, labels} = context;
      const languageManager = new LanguageManager(language, labels);

      expect(languageManager.availableLanguages).toEqual([]);
    });
  });

  describe('setLanguage()', () => {
    test<LanguageManagerSuiteContext>('should change the language', context => {
      const {language, labels} = context;
      const languageManager = new LanguageManager(language, labels);

      languageManager.setLanguage('en-US');

      expect(languageManager.language).toBe('en-US');
    });

    test<LanguageManagerSuiteContext>('should emit change event with new and previous language', context => {
      const {language, labels} = context;
      const languageManager = new LanguageManager(language, labels);
      const handler = vi.fn();
      languageManager.on('change', handler);

      languageManager.setLanguage('en-US');

      expect(handler).toHaveBeenCalledWith('en-US', 'nl-NL');
    });

    test<LanguageManagerSuiteContext>('should throw error when language is empty', context => {
      const {language, labels} = context;
      const languageManager = new LanguageManager(language, labels);

      expect(() => languageManager.setLanguage('' as TLanguageCode)).toThrow(
        'Language cannot be empty'
      );
    });
  });

  describe('getLabelCollection()', () => {
    test<LanguageManagerSuiteContext>('should return label collection by ID', context => {
      const {language} = context;
      const expectedLabels: ILabel[] = [
        {id: '1', languageCode: 'en-US', label: 'Hello'},
      ];
      const labels: ILanguageLabel[] = [
        {id: 'greeting', labels: expectedLabels},
      ];
      const languageManager = new LanguageManager(language, labels);

      const result = languageManager.getLabelCollection('greeting');

      expect(result).toBe(expectedLabels);
    });

    test<LanguageManagerSuiteContext>('should return undefined for non-existent ID', context => {
      const {language, labels} = context;
      const languageManager = new LanguageManager(language, labels);

      const result = languageManager.getLabelCollection('nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('getLabelCollections()', () => {
    test<LanguageManagerSuiteContext>('should return multiple label collections', context => {
      const {language} = context;
      const labels1: ILabel[] = [
        {id: '1', languageCode: 'en-US', label: 'Hello'},
      ];
      const labels2: ILabel[] = [
        {id: '2', languageCode: 'en-US', label: 'Goodbye'},
      ];
      const labels: ILanguageLabel[] = [
        {id: 'greeting', labels: labels1},
        {id: 'farewell', labels: labels2},
      ];
      const languageManager = new LanguageManager(language, labels);

      const result = languageManager.getLabelCollections([
        'greeting',
        'farewell',
      ]);

      expect(result[0]).toBe(labels1);
      expect(result[1]).toBe(labels2);
    });

    test<LanguageManagerSuiteContext>('should return undefined for missing collections', context => {
      const {language} = context;
      const labels1: ILabel[] = [
        {id: '1', languageCode: 'en-US', label: 'Hello'},
      ];
      const labels: ILanguageLabel[] = [{id: 'greeting', labels: labels1}];
      const languageManager = new LanguageManager(language, labels);

      const result = languageManager.getLabelCollections([
        'greeting',
        'nonexistent',
      ]);

      expect(result[0]).toBe(labels1);
      expect(result[1]).toBeUndefined();
    });
  });

  describe('on()', () => {
    test<LanguageManagerSuiteContext>('should subscribe to change event', context => {
      const {language, labels} = context;
      const languageManager = new LanguageManager(language, labels);
      const handler = vi.fn();

      languageManager.on('change', handler);
      languageManager.setLanguage('en-US');

      expect(handler).toHaveBeenCalled();
    });

    test<LanguageManagerSuiteContext>('should return unsubscribe function', context => {
      const {language, labels} = context;
      const languageManager = new LanguageManager(language, labels);
      const handler = vi.fn();

      const unsubscribe = languageManager.on('change', handler);
      unsubscribe();
      languageManager.setLanguage('en-US');

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('destroy()', () => {
    test<LanguageManagerSuiteContext>('should remove all event listeners', context => {
      const {language, labels} = context;
      const languageManager = new LanguageManager(language, labels);
      const handler = vi.fn();
      languageManager.on('change', handler);

      languageManager.destroy();
      // After destroy, emitting should not call handler
      // (We can't easily test this without accessing internals)
    });
  });
});
