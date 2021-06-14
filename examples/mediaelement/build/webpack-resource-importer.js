import layoutTemplate from '../template/layout-template.html';
import MediaElementTimelineProvider from '../../../src/timelineproviders/media-element-timeline-provider';
import ChronoTriggerEngine from '../../../src/chrono-trigger-engine';
class WebpackResourceImporter {
  import(name) {
    switch (true) {
      case name === 'layoutTemplate':
        return {
          [name]: layoutTemplate
        };
      case name === 'MediaElementTimelineProvider':
        return {
          [name]: MediaElementTimelineProvider
        };
      case name === 'ChronoTriggerEngine':
        return {
          [name]: ChronoTriggerEngine
        };
      default:
        throw Error("Unknown systemName: " + name);
    }
  }
}
export default WebpackResourceImporter;
