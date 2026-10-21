import {BaseController} from '@controllers/base-controller.ts';
import {
  buildNavigationData,
  requestNavigation,
} from '@controllers/helper/navigation-data.ts';
import type {IEventbus} from '@eventbus/types.ts';

export interface IRoutingControllerOperationData {
  /**
   * The navigation json, in the same format as NavigationController's. Give
   * an entry a `timelineUri` to let the engine switch to that timeline on
   * back/forward navigation.
   *
   * @required
   */
  json: any;
}

/**
 * Seconds subtracted from the current position when the current entry is
 * saved, so going back resumes slightly before the point where the user left.
 */
const REWIND_SECONDS = 3;

/**
 * Keeps the browser history in sync with the navigation entries: each entry
 * gets a `#/<id>/<position>` URL, and back/forward navigation requests the
 * entry in the URL.
 *
 * Requests go to the engine as `request-timeline-uri` for entries with a
 * `timelineUri`, and as the legacy `request-video-url` otherwise. Before the
 * engine switches timelines (`before-request-timeline-uri`, or the legacy
 * `before-request-video-url`), the current entry is saved with its position.
 *
 * This is a work in progress, do not use this yet please....
 */
export class RoutingController extends BaseController<IRoutingControllerOperationData> {
  name = 'RoutingController';
  navLookup: Record<string, any> = {};
  navVidIdLookup: Record<string, any> = {};
  navigation: any = null;
  eventbus: IEventbus | null = null;
  private _popstateHandler: ((event: PopStateEvent) => void) | null = null;
  /** True while this controller requests an entry from the history */
  private _isHistoryRequest = false;

  /**
   * @throws when the json has no navigationData array or names an unknown
   * navigation id in roots, nextId or children
   */
  init(operationData: IRoutingControllerOperationData) {
    this.operationData = operationData;
    const {roots, navLookup, navVidIdLookup} = buildNavigationData(
      operationData.json,
      this.name
    );
    this.navigation = roots;
    this.navLookup = navLookup;
    this.navVidIdLookup = navVidIdLookup;
  }

  attach(eventbus: IEventbus) {
    this.beginAttach(eventbus);
    this.addListener(
      eventbus,
      'before-request-video-url',
      this._handleBeforeRequestVideoUrl
    );
    this.addListener(
      eventbus,
      'before-request-timeline-uri',
      this._handleBeforeRequestTimelineUri
    );
    this.addListener(
      eventbus,
      'push-history-state',
      this._handlePushHistoryState
    );
    this.eventbus = eventbus;
    // Add a listener instead of assigning window.onpopstate, so a handler
    // installed by the host page (or another controller) is never replaced.
    if (this._popstateHandler) {
      window.removeEventListener('popstate', this._popstateHandler);
    }
    this._popstateHandler = this._handlePopstate.bind(this);
    window.addEventListener('popstate', this._popstateHandler);

    const navId = this._getQueryVariable(0);
    if (navId) {
      const nav = this._findNavigation(navId);
      if (nav) {
        this._requestFromHistory(
          nav,
          this._parsePosition(this._getQueryVariable(1))
        );
      }
    } else if (this.navigation?.length) {
      // Tag the current entry instead of adding one, so the first Back press
      // leaves the page.
      window.history.replaceState(
        {navigationId: this.navigation[0].id},
        '',
        `#/${this.navigation[0].id}`
      );
    }
  }

  /**
   * Requests the entry in the URL. A null state comes from a hash change (an
   * in-page link, an edited URL, or the entry before this controller added
   * state), so the URL is read. A state object without a navigation id belongs
   * to the host page and is ignored.
   */
  private _handlePopstate(event: PopStateEvent) {
    const state = event.state;
    let navId: unknown;
    let rawPosition: unknown;
    if (state === null || state === undefined) {
      navId = this._getQueryVariable(0) || undefined;
      rawPosition = this._getQueryVariable(1);
    } else if (typeof state?.navigationId === 'string') {
      navId = state.navigationId;
      rawPosition = state.position;
    } else {
      return;
    }

    const nav = this._findNavigation(navId);
    if (!nav) {
      return;
    }
    this.eventbus?.broadcast('highlight-navigation', [nav.videoUrlIndex]);
    this._requestFromHistory(nav, this._parsePosition(rawPosition));
  }

  /**
   * Requests an entry without saving the current one: the history already
   * has it.
   */
  private _requestFromHistory(nav: any, position: number) {
    if (!this.eventbus) {
      return;
    }
    this._isHistoryRequest = true;
    try {
      requestNavigation(this.eventbus, nav, position, true);
    } finally {
      this._isHistoryRequest = false;
    }
  }

  /**
   * Looks up a navigation entry by id (own properties only), falling back to
   * the first navigation entry for a missing or unknown id.
   */
  private _findNavigation(navId: unknown): any | undefined {
    if (typeof navId === 'string' && Object.hasOwn(this.navLookup, navId)) {
      return this.navLookup[navId];
    }
    return this.navigation?.[0];
  }

  /**
   * @returns the position as a finite, non-negative number, or 0
   */
  private _parsePosition(value: unknown): number {
    const position = Number.parseFloat(String(value));
    return Number.isFinite(position) && position >= 0 ? position : 0;
  }

  detach(eventbus: IEventbus) {
    super.detach(eventbus);
    if (this._popstateHandler) {
      window.removeEventListener('popstate', this._popstateHandler);
    }
    this._popstateHandler = null;
    this.eventbus = null;
  }

  private _handleBeforeRequestVideoUrl(
    _index: number,
    _requestedVideoPosition: number = 0,
    isHistoryRequest: boolean = false
  ) {
    if (!isHistoryRequest) {
      this._saveCurrentNavigation();
    }
  }

  /**
   * The interceptor passes on the `request-timeline-uri` arguments, which
   * have no history flag; requests this controller makes itself are skipped
   * through `_isHistoryRequest`.
   */
  private _handleBeforeRequestTimelineUri(_uri?: string, _position?: number) {
    if (!this._isHistoryRequest) {
      this._saveCurrentNavigation();
    }
  }

  private _saveCurrentNavigation() {
    const resultCallback = (item: any) => {
      this._pushState(item);
    };
    this.eventbus?.broadcast('request-current-navigation', [resultCallback]);
  }

  private _getQueryVariable(variableIdx: number) {
    const href = window.location.href;
    const hashIndex = href.indexOf('#');
    if (hashIndex > -1) {
      const query = href.substring(hashIndex + 2);
      if (query) {
        const vars = query.split('/');
        return vars[variableIdx];
      }
    }
    return '';
  }

  private _handlePushHistoryState(state: any) {
    this._pushState(state);
  }

  private _pushState(state: any) {
    if (!state?.navigationData?.visible) {
      return;
    }

    const navigationId = state.navigationData.id;
    const position = this._resolveStatePosition(state.position);
    const historyState =
      position === undefined ? {navigationId} : {navigationId, position};
    const url =
      position === undefined
        ? `#/${navigationId}`
        : `#/${navigationId}/${position}`;

    if (window.history.state?.navigationId === navigationId) {
      window.history.replaceState(historyState, state.title, url);
    } else {
      window.history.pushState(historyState, state.title, url);
    }
    window.document.title = state.title;
  }

  /**
   * A missing or negative position means "where the timeline is now": the
   * engine position minus a short rewind. When nothing reports a position,
   * the position is left out of the URL and the state.
   */
  private _resolveStatePosition(position: unknown): number | undefined {
    if (
      typeof position === 'number' &&
      Number.isFinite(position) &&
      position >= 0
    ) {
      return position;
    }

    let current = this.eventbus?.request<number>(
      'request-current-timeline-position'
    );
    if (current === undefined) {
      // Legacy hosts answer through a callback broadcast
      this.eventbus?.broadcast('request-current-video-position', [
        (value: number) => {
          current = value;
        },
      ]);
    }
    return typeof current === 'number' && Number.isFinite(current)
      ? Math.max(0, current - REWIND_SECONDS)
      : undefined;
  }
}
