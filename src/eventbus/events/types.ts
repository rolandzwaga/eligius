import { type BeforeRequestTimelineUriEvent } from "./before-request-timeline-uri.ts";
import { type DomMutationEvent } from "./dom-mutation.ts";
import { type LanguageChangeEvent } from "./language-change.ts";
import { type RequestActionEvent } from "./request-action.ts";
import { type RequestCurrentLanguageEvent } from "./request-current-language.ts";
import { type RequestCurrentTimelinePositionEvent } from "./request-current-timeline-position.ts";
import { type RequestEngineRootEvent } from "./request-engine-root.ts";
import { type RequestFunctionEvent } from "./request-function.ts";
import { type RequestInstanceEvent } from "./request-instance.ts";
import { type RequestLabelCollectionEvent } from "./request-label-collection.ts";
import { type RequestLabelCollectionsEvent } from "./request-label-collections.ts";
import { type RequestTimelineCleanupEvent } from "./request-timeline-cleanup.ts";
import { type RequestTimelineUriEvent } from "./request-timeline-uri.ts";
import { type CompleteEvent } from "./timeline-complete.ts";
import { type ContainerRequestEvent } from "./timeline-container-request.ts";
import { type CurrentTimelineChangeEvent } from "./timeline-current-timeline-change.ts";
import { type DurationRequestEvent } from "./timeline-duration-request.ts";
import { type DurationEvent } from "./timeline-duration.ts";
import { type FirstFrameEvent } from "./timeline-firstframe.ts";
import { type PauseRequestEvent } from "./timeline-pause-request.ts";
import { type PauseEvent } from "./timeline-pause.ts";
import { type PlayRequestEvent } from "./timeline-play-request.ts";
import { type PlayToggleRequestEvent } from "./timeline-play-toggle-request.ts";
import { type PlayEvent } from "./timeline-play.ts";
import { type RequestCurrentTimelineEvent } from "./timeline-request-current-timeline.ts";
import { type ResizeRequestEvent } from "./timeline-resize-request.ts";
import { type ResizeEvent } from "./timeline-resize.ts";
import { type RestartEvent } from "./timeline-restart.ts";
import { type SeekRequestEvent } from "./timeline-seek-request.ts";
import { type SeekEvent } from "./timeline-seek.ts";
import { type SeekedEvent } from "./timeline-seeked.ts";
import { type StopRequestEvent } from "./timeline-stop-request.ts";
import { type StopEvent } from "./timeline-stop.ts";
import { type TimeEvent } from "./timeline-time.ts";

export type AllEvents = BeforeRequestTimelineUriEvent
  | DomMutationEvent
  | LanguageChangeEvent
  | RequestActionEvent
  | RequestCurrentLanguageEvent
  | RequestCurrentTimelinePositionEvent
  | RequestEngineRootEvent
  | RequestFunctionEvent
  | RequestInstanceEvent
  | RequestLabelCollectionEvent
  | RequestLabelCollectionsEvent
  | RequestTimelineCleanupEvent
  | RequestTimelineUriEvent
  | CompleteEvent
  | ContainerRequestEvent
  | CurrentTimelineChangeEvent
  | DurationRequestEvent
  | DurationEvent
  | FirstFrameEvent
  | PauseRequestEvent
  | PauseEvent
  | PlayRequestEvent
  | PlayToggleRequestEvent
  | PlayEvent
  | RequestCurrentTimelineEvent
  | ResizeRequestEvent
  | ResizeEvent
  | RestartEvent
  | SeekRequestEvent
  | SeekEvent
  | SeekedEvent
  | StopRequestEvent
  | StopEvent
  | TimeEvent
  ;
export type EventMap = { [K in AllEvents as K['name']]: K['args'] };
export type EventName = keyof EventMap;
