import { expect } from 'chai';
import TimelineProviderSettingsEditor from '../../../configuration/api/timeline-provider-settings-editor';

describe('TimelineProviderSettingsEditor', () => {
  let editor;
  let configuration;
  let factory;

  beforeEach(() => {
    configuration = {};
    factory = {};
    editor = new TimelineProviderSettingsEditor(configuration, factory);
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
    editor.setSystemname(systemName);

    // expect
    expect(configuration.systemName).to.equal(systemName);
  });

  it('should throw an error when an unknown system name is given', () => {
    // given
    const systemName = 'UnknownTimelineProvider';
    let errorMessage = null;

    // test
    try {
      editor.setSystemname(systemName);
    } catch (e) {
      errorMessage = e.message;
    }

    // expect
    expect(errorMessage).to.equal('Unknown timelineprovider system name: UnknownTimelineProvider');
  });

  it('should return the configuration factory', () => {
    // given
    // test
    const result = editor.next();

    // expect
    expect(result).to.equal(factory);
  });
});
