import {BaseController} from '@controllers/base-controller.ts';
import type {LabelController} from '@controllers/label-controller.ts';
import type {IEventbus} from '@eventbus/types.ts';
import type {TOperationData} from '@operation/types.ts';
import $ from 'jquery';
import type {TResultCallback} from '../types.ts';

export interface INavigationControllerOperationData {
  /**
   * @dependency
   */
  selectedElement: JQuery;
  /**
   * @required
   */
  json: any;
}

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
  private _anchorLookup = new Map<string, JQuery>();
  private _highlightedAnchor: JQuery | null = null;

  init(operationData: TOperationData) {
    this.container = operationData.selectedElement;
    this.navigation = this._buildNavigationData(operationData.json);
  }

  attach(eventbus: IEventbus) {
    if (!this.container) {
      return;
    }

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

    // Removing the menu also unbinds its jQuery mouseup handlers
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

  private _buildHtml(parentElm: JQuery, data: any) {
    const ul = $('<ul/>');
    data.forEach(this._addNavElement.bind(this, ul));
    parentElm.append(ul);
    this._menuElement = ul;
  }

  private _addNavElement(parentElm: JQuery, data: any) {
    if (data.visible) {
      const li = $('<li/>');
      // Configuration values are only ever set as attribute values, never parsed as HTML
      const a = $('<a/>')
        .attr('href', 'javascript:;')
        .attr('id', `nav_${data.videoUrlIndex}`);
      this._anchorLookup.set(String(data.videoUrlIndex), a);
      li.append(a);
      this._addLabel(a, data.labelId);
      this._addClickHandler(a, data.videoUrlIndex);

      if (data.children) {
        const ul = $('<ul/>');
        data.children.forEach(this._addNavElement.bind(this, ul));
        li.append(ul);
      }

      parentElm.append(li);
    }
  }

  private _addClickHandler(parentElm: JQuery, videoIndex: number) {
    parentElm.mouseup(this._menuMouseupHandler.bind(this, videoIndex));
  }

  private _menuMouseupHandler(videoIndex: number) {
    const navdata = this.navVidIdLookup[videoIndex];
    if (navdata) {
      // _handleNavigateVideoUrl broadcasts request-video-url
      this._handleNavigateVideoUrl(navdata.videoUrlIndex);
    }
  }

  private _handleNavigateVideoUrl(
    index: number,
    requestedVideoPosition: number = 0
  ) {
    this._highlightMenu(index);
    this.eventbus?.broadcast('request-video-url', [
      index,
      requestedVideoPosition,
    ]);
    this.activeNavigationPoint = this.navVidIdLookup[index];
    this._pushCurrentState(requestedVideoPosition);
  }

  private _highlightMenu(index: number) {
    const navElm = this._anchorLookup.get(String(index));

    if (navElm) {
      this._highlightedAnchor?.removeClass('current-menu-item');
      navElm.addClass('current-menu-item');
      this._highlightedAnchor = navElm;
    }
  }

  private _handleVideoComplete(index: number) {
    const navData = this.navVidIdLookup[index];
    if (navData?.autoNext && navData.next) {
      this.eventbus?.broadcast('request-video-url', [
        navData.next.videoUrlIndex,
      ]);
    } else {
      this.eventbus?.broadcast('request-video-cleanup', []);
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

  private _buildNavigationData(data: any) {
    const result: any[] = [];
    data.navigationData.forEach((nav: any, index: number) => {
      this.navLookup[nav.id] = nav;
      this.navVidIdLookup[nav.videoUrlIndex] = nav;
      nav.previous = data.navigationData[index - 1];
    });

    data.navigationData.forEach((nav: any, index: number) => {
      if (nav.nextId) {
        nav.next = this.navLookup[nav.nextId];
        delete nav.nextId;
      } else {
        nav.next = data.navigationData[index + 1];
      }
    });

    data.roots.forEach((id: string) => {
      const nav = this.navLookup[id];
      if (nav.children) {
        nav.children = nav.children.map((childId: string) => {
          return this.navLookup[childId];
        });
      }
      result.push(nav);
    });
    return result;
  }
}
