import { selectElement } from '../../../src/operation/select-element';
import { getControllerInstance } from '../../../src/operation/get-controller-instance';
import { addControllerToElement } from '../../../src/operation/add-controller-to-element';
import { removeControllerFromElement } from '../../../src/operation/remove-controller-from-element';
import { createElement } from '../../../src/operation/create-element';
import { setElementContent } from '../../../src/operation/set-element-content';
import { startLoop } from '../../../src/operation/start-loop';
import { endLoop } from '../../../src/operation/end-loop';
import { broadcastEvent } from '../../../src/operation/broadcast-event';
import { addClass } from '../../../src/operation/add-class';
import { removeElement } from '../../../src/operation/remove-element';
import { clearElement } from '../../../src/operation/clear-element';
import layoutTemplate from '../template/layout-template.html';
import testSubtitles from '../json/test-subtitles.json';
import { LabelController } from '../../../src/controllers/label-controller';
import { ProgressbarController } from '../../../src/controllers/progressbar-controller';
import { EventListenerController } from '../../../src/controllers/event-listener-controller';
import { SubtitlesController } from '../../../src/controllers/subtitles-controller';
import { RequestAnimationFrameTimelineProvider } from '../../../src/timelineproviders/request-animation-frame-timeline-provider';
import { ChronoTriggerEngine } from '../../../src/chrono-trigger-engine';
import { ISimpleResourceImporter } from '../../../src';
class WebpackResourceImporter implements ISimpleResourceImporter
{
  import(name: string): Record<string, any>
  {
    switch (true) {
      case name === 'selectElement': return { [name]: selectElement };
      case name === 'getControllerInstance': return { [name]: getControllerInstance };
      case name === 'addControllerToElement': return { [name]: addControllerToElement };
      case name === 'removeControllerFromElement': return { [name]: removeControllerFromElement };
      case name === 'createElement': return { [name]: createElement };
      case name === 'setElementContent': return { [name]: setElementContent };
      case name === 'startLoop': return { [name]: startLoop };
      case name === 'endLoop': return { [name]: endLoop };
      case name === 'broadcastEvent': return { [name]: broadcastEvent };
      case name === 'addClass': return { [name]: addClass };
      case name === 'removeElement': return { [name]: removeElement };
      case name === 'clearElement': return { [name]: clearElement };
      case name === 'layoutTemplate': return { [name]: layoutTemplate };
      case name === 'testSubtitles': return { [name]: testSubtitles };
      case name === 'LabelController': return { [name]: LabelController };
      case name === 'ProgressbarController': return { [name]: ProgressbarController };
      case name === 'EventListenerController': return { [name]: EventListenerController };
      case name === 'SubtitlesController': return { [name]: SubtitlesController };
      case name === 'RequestAnimationFrameTimelineProvider': return { [name]: RequestAnimationFrameTimelineProvider };
      case name === 'ChronoTriggerEngine': return { [name]: ChronoTriggerEngine };
      default: throw Error("Unknown systemName: " + name);
    }
  }
}
export default WebpackResourceImporter;
