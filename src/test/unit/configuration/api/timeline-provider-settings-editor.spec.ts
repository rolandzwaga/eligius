import { expect } from 'chai';
import { TimelineProviderSettingsEditor } from '../../../../configuration/api/timeline-provider-settings-editor';

describe('TimelineProviderSettingsEditor', () => {
  let editor: any;
  let configuration: any;
  let factory: any;

  beforeEach(() => {
    configuration = {};
    factory = {};
    editor = {};
    editor = new TimelineProviderSettingsEditor(configuration, editor, factory);
  });

  it('should set the vendor', () => {
    // given
    const vendor = 'testVendor';

    // test
    editor.setVendor(vendor);

    // expect
    expect(configuration.vendor).to.equal(vendor);
  });

  it('should set the selector', () => {
    // given
    const selector = 'selector';

    // test
    editor.setSelector(selector);

    // expect
    expect(configuration.selector).to.equal(selector);
  });

  it('should set the systemName', () => {
    // given
    const systemName = 'RequestAnimationFrameTimelineProvider';

    // test
    editor.setSystemName(systemName);

    // expect
    expect(configuration.systemName).to.equal(systemName);
  });

  it('should throw an error when an unknown system name is given', () => {
    // given
    const systemName = 'UnknownTimelineProvider';
    let errorMessage = null;

    // test
    try {
      editor.setSystemName(systemName);
    } catch (e) {
      errorMessage = e.message;
    }

    // expect
    expect(errorMessage).to.equal('Unknown timeline provider system name: UnknownTimelineProvider');
  });

  it('should return the configuration factory', () => {
    // given
    // test
    const result = editor.next();

    // expect
    expect(result).to.eql(factory);
  });
});
