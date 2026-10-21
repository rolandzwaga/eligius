import {BaseController} from '@controllers/base-controller.ts';
import {
  buildNavigationData,
  requestNavigation,
} from '@controllers/helper/navigation-data.ts';
import type {LabelController} from '@controllers/label-controller.ts';
import type {IEventbus} from '@eventbus/types.ts';
import $ from 'jquery';
import type {TResultCallback} from '../types.ts';

export interface INavigationControllerOperationData {
  /**
   * @dependency
   */
  selectedElement: JQuery;
  /**
   * The navigation json: `{navigationData: [...], roots: [...]}`. Each entry
   * has an `id`, a `labelId`, a `videoUrlIndex` and optionally `visible`,
   * `children` (ids), `nextId`, `autoNext` and `timelineUri`. Give an entry a
   * `timelineUri` to let the engine switch to that timeline when the entry is
   * activated.
   *
   * @required
   */
  json: any;
}

const CURRENT_CLASS = 'current-menu-item';

/**
 * Renders a navigation menu in the selected element and keeps it in sync with
 * the active navigation entry.
 *
 * Activating a menu item (click, Enter or Space) navigates to its entry:
 * - an entry with a `timelineUri` broadcasts `request-timeline-uri`
 *   [timelineUri, position], which the engine handles by switching timelines;
 * - an entry without one broadcasts the legacy `request-video-url`
 *   [videoUrlIndex, position], which the engine does not handle.
 *
 * With `autoNext`, the next entry is started when the active entry's timeline
 * completes (`timeline-complete`) or, for legacy entries, on `video-complete`.
 * When the engine switches to a timeline that an entry names
 * (`timeline-current-timeline-change`), that entry becomes the active one.
 */
export class NavigationController extends BaseController<INavigationControllerOperationData> {
  name: string = 'NavigationController';
  navigation: any[] = [];
  navLookup: Record<string, any> = {};
  navVidIdLookup: Record<string, any> = {};
  ctrlLookup: Record<string, LabelController> = {};
  activeNavigationPoint: any | null = null;
  labelControllers: LabelController[] = [];
  eventbus: IEventbus | null = null;
  container: JQuery | null = null;
  private _menuElement: JQuery | null = null;
  private _anchorLookup = new Map<any, JQuery>();
  private _highlightedAnchor: JQuery | null = null;
  private _navByTimelineUri = new Map<string, any>();

  /**
   * @throws when the json has no navigationData array or names an unknown
   * navigation id in roots, nextId or children
   */
  init(operationData: INavigationControllerOperationData) {
    this.operationData = operationData;
    this.container = operationData.selectedElement;
    const {roots, navLookup, navVidIdLookup} = buildNavigationData(
      operationData.json,
      this.name
    );
    this.navigation = roots;
    this.navLookup = navLookup;
    this.navVidIdLookup = navVidIdLookup;
    this._navByTimelineUri.clear();
    Object.values(navLookup).forEach(nav => {
      if (
        typeof nav.timelineUri === 'string' &&
        !this._navByTimelineUri.has(nav.timelineUri)
      ) {
        this._navByTimelineUri.set(nav.timelineUri, nav);
      }
    });
  }

  attach(eventbus: IEventbus) {
    if (!this.container) {
      return;
    }

    this.beginAttach(eventbus);
    this.eventbus = eventbus;

    this.addListener(
      eventbus,
      'navigate-to-video-url',
      this._handleNavigateVideoUrl
    );
    this.addListener(eventbus, 'highlight-navigation', this._highlightMenu);
    this.addListener(
      eventbus,
      'request-current-navigation',
      this._handleRequestCurrentNavigation
    );
    this.addListener(eventbus, 'video-complete', this._handleVideoComplete);
    this.addListener(
      eventbus,
      'timeline-complete',
      this._handleTimelineComplete
    );
    this.addListener(
      eventbus,
      'timeline-current-timeline-change',
      this._handleTimelineChange
    );

    this._buildHtml(this.container, this.navigation);
    this._initHistory();
  }

  /**
   * Sets the active navigation point and the menu highlight from the URL hash,
   * falling back to the item with videoUrlIndex 0 when the hash is missing or
   * names an unknown navigation id.
   */
  private _initHistory() {
    const navId = this._getQueryVariable(0);
    const nav =
      navId && Object.hasOwn(this.navLookup, navId)
        ? this.navLookup[navId]
        : undefined;
    const videoIndex = nav?.videoUrlIndex ?? 0;
    this.activeNavigationPoint = this.navVidIdLookup[videoIndex] ?? null;
    this._highlightMenu(videoIndex);
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
    return null;
  }

  private _handleRequestCurrentNavigation(
    resultCallback: TResultCallback<{navigationData: any; title: string} | null>
  ) {
    if (this.activeNavigationPoint) {
      const title =
        this.eventbus?.request<string>(
          'request-translation',
          this.activeNavigationPoint.labelId
        ) ?? '';
      resultCallback({
        navigationData: this.activeNavigationPoint,
        title,
      });
    } else {
      resultCallback(null);
    }
  }

  detach(eventbus: IEventbus) {
    super.detach(eventbus);

    this.labelControllers.forEach(ctrl => {
      ctrl.detach(eventbus);
    });

    this.labelControllers.length = 0;
    this.ctrlLookup = {};

    // Removing the menu also unbinds its jQuery click and keydown handlers
    this._menuElement?.remove();
    this._menuElement = null;
    this._anchorLookup.clear();
    this._highlightedAnchor = null;

    this.eventbus = null;
  }

  private _pushCurrentState(position = -1) {
    if (!this.activeNavigationPoint) {
      return;
    }

    const title =
      this.eventbus?.request<string>(
        'request-translation',
        this.activeNavigationPoint.labelId
      ) ?? '';

    const state = {
      navigationData: this.activeNavigationPoint,
      title,
      position: -1,
    };
    if (position > -1) {
      state.position = position;
    }
    this.eventbus?.broadcast('push-history-state', [state]);
  }

  private _buildHtml(parentElm: JQuery, data: any[]) {
    const ul = $('<ul/>');
    const ancestors = new Set<any>();
    data.forEach(nav => this._addNavElement(ul, nav, ancestors));
    parentElm.append(ul);
    this._menuElement = ul;
  }

  /**
   * Renders an entry and its children. `ancestors` holds the entries on the
   * current path, so a children list that refers back to an ancestor cannot
   * recurse forever.
   */
  private _addNavElement(parentElm: JQuery, data: any, ancestors: Set<any>) {
    if (!data?.visible || ancestors.has(data)) {
      return;
    }
    const li = $('<li/>');
    // Configuration values are only ever set as attribute values, never parsed
    // as HTML. The fragment href gives the anchor link semantics (focusable,
    // activated by Enter); the click handler prevents the navigation itself.
    const a = $('<a/>')
      .attr('href', `#/${data.id}`)
      .attr('id', `nav_${data.videoUrlIndex}`);
    this._anchorLookup.set(data, a);
    li.append(a);
    this._addLabel(a, data.labelId);
    this._addActivationHandlers(a, data);

    if (Array.isArray(data.children)) {
      const ul = $('<ul/>');
      ancestors.add(data);
      data.children.forEach((child: any) =>
        this._addNavElement(ul, child, ancestors)
      );
      ancestors.delete(data);
      li.append(ul);
    }

    parentElm.append(li);
  }

  /**
   * Activates the entry on click, which the browser also fires for Enter on a
   * focused link and for the default action of assistive technology, and on
   * Space, which links do not handle natively. Only one of click and mouseup
   * may be bound, since a mouse click fires both.
   */
  private _addActivationHandlers(anchor: JQuery, nav: any) {
    anchor.on('click', (event?: JQuery.TriggeredEvent) => {
      event?.preventDefault?.();
      this._navigateTo(nav);
    });
    anchor.on('keydown', (event?: JQuery.TriggeredEvent) => {
      if (event?.key === ' ' || event?.key === 'Spacebar') {
        event.preventDefault?.();
        this._navigateTo(nav);
      }
    });
  }

  private _handleNavigateVideoUrl(
    index: number,
    requestedVideoPosition: number = 0
  ) {
    const nav = this.navVidIdLookup[index];
    if (nav) {
      this._navigateTo(nav, requestedVideoPosition);
    } else {
      this.eventbus?.broadcast('request-video-url', [
        index,
        requestedVideoPosition,
      ]);
    }
  }

  /**
   * Highlights the entry, requests its content, makes it the active entry and
   * pushes a history state for it.
   */
  private _navigateTo(nav: any, position: number = 0) {
    this._highlightNav(nav);
    if (this.eventbus) {
      requestNavigation(this.eventbus, nav, position);
    }
    this.activeNavigationPoint = nav;
    this._pushCurrentState(position);
  }

  private _highlightMenu(index: number) {
    this._highlightNav(this.navVidIdLookup[index]);
  }

  private _highlightNav(nav: any) {
    const navElm = nav ? this._anchorLookup.get(nav) : undefined;

    if (navElm) {
      this._highlightedAnchor
        ?.removeClass(CURRENT_CLASS)
        .removeAttr('aria-current');
      navElm.addClass(CURRENT_CLASS).attr('aria-current', 'page');
      this._highlightedAnchor = navElm;
    }
  }

  /**
   * Legacy completion event for entries driven by `request-video-url`.
   */
  private _handleVideoComplete(index: number) {
    const navData = this.navVidIdLookup[index];
    if (navData?.autoNext && navData.next) {
      this._navigateTo(navData.next);
    } else {
      this.eventbus?.broadcast('request-video-cleanup', []);
    }
  }

  /**
   * Starts the next entry when the active entry's timeline completes. Legacy
   * entries without a `timelineUri` are left to `video-complete`, so a host
   * that bridges both events does not navigate twice.
   */
  private _handleTimelineComplete() {
    const nav = this.activeNavigationPoint;
    if (!nav?.timelineUri || !nav.autoNext || !nav.next) {
      return;
    }
    const currentUri = this.eventbus?.request<string>(
      'timeline-request-current-timeline'
    );
    if (currentUri !== undefined && currentUri !== nav.timelineUri) {
      return;
    }
    this._navigateTo(nav.next);
  }

  /**
   * Keeps the active entry and the highlight in sync when the engine switches
   * timelines, whoever asked for the switch.
   */
  private _handleTimelineChange(timelineUri: string) {
    const nav = this._navByTimelineUri.get(timelineUri);
    if (nav) {
      this.activeNavigationPoint = nav;
      this._highlightNav(nav);
    }
  }

  private _addLabel(parentElm: JQuery, translationKey: string) {
    const data = {
      selectedElement: parentElm,
      translationKey,
    };
    const instance = this.eventbus?.request<LabelController>(
      'request-instance',
      'LabelController'
    );
    if (instance) {
      instance.init(data);
      instance.attach(this.eventbus as IEventbus);
      this.labelControllers.push(instance);
      this.ctrlLookup[translationKey] = instance;
    }
  }
}
