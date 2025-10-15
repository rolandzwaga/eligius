import {expect} from 'chai';
import {beforeEach, describe, type TestContext, test} from 'vitest';
import {TimelineProviderSettingsEditor} from '../../../../configuration/api/timeline-provider-settings-editor.ts';

type TimelineProviderSettingsEditorSuiteContext = {
  editor: TimelineProviderSettingsEditor;
  configuration: any;
  factory: any;
} & TestContext;

function withContext<T>(ctx: unknown): asserts ctx is T {}
describe.concurrent<TimelineProviderSettingsEditorSuiteContext>(
  'TimelineProviderSettingsEditor',
  () => {
    beforeEach(context => {
      withContext<TimelineProviderSettingsEditorSuiteContext>(context);

      context.configuration = {};
      context.factory = {};
      context.editor = new TimelineProviderSettingsEditor(
        context.configuration,
        {} as any,
        context.factory
      );
    });
    test<TimelineProviderSettingsEditorSuiteContext>('should set the vendor', context => {
      // given
      const {editor, configuration} = context;
      const vendor = 'testVendor';

      // test
      editor.setVendor(vendor);

      // expect
      expect(configuration.vendor).to.equal(vendor);
    });
    test<TimelineProviderSettingsEditorSuiteContext>('should set the selector', context => {
      // given
      const {editor, configuration} = context;
      const selector = 'selector';

      // test
      editor.setSelector(selector);

      // expect
      expect(configuration.selector).to.equal(selector);
    });
    test<TimelineProviderSettingsEditorSuiteContext>('should set the systemName', context => {
      // given
      const {editor, configuration} = context;
      const systemName = 'RequestAnimationFrameTimelineProvider';

      // test
      editor.setSystemName(systemName);

      // expect
      expect(configuration.systemName).to.equal(systemName);
    });
    test<TimelineProviderSettingsEditorSuiteContext>('should throw an error when an unknown system name is given', context => {
      // given
      const {editor} = context;
      const systemName = 'UnknownTimelineProvider';

      // expect
      expect(() => editor.setSystemName(systemName)).throws(
        'Unknown timeline provider system name: UnknownTimelineProvider'
      );
    });
    test<TimelineProviderSettingsEditorSuiteContext>('should return the configuration factory', context => {
      // given
      const {editor, factory} = context;

      // test
      const result = editor.next();

      // expect
      expect(result).to.eql(factory);
    });
  }
);
