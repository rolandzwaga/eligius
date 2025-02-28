import $ from 'jquery';
import type { IEventbus, TEventbusRemover } from '../eventbus/types.ts';
import type { TOperationData } from '../operation/types.ts';
import type { TResultCallback } from '../types.ts';
import { LabelController } from './label-controller.ts';
import type { IController } from './types.ts';

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

export class NavigationController
  implements IController<INavigationControllerOperationData>
{
  name: string = 'NavigationController';
  navigation: any[] = [];
  navLookup: Record<string, any> = {};
  navVidIdLookup: Record<string, any> = {};
  ctrlLookup: Record<string, LabelController> = {};
  activeNavigationPoint: any | null = null;
  labelControllers: LabelController[] = [];
  eventhandlers: TEventbusRemover[] = [];
  eventbus: IEventbus | null = null;
  container: JQuery | null = null;

  constructor() {}

  init(operationData: TOperationData) {
    this.container = operationData.selectedElement;
    this.navigation = this._buildNavigationData(operationData.json);
  }

  attach(eventbus: IEventbus) {
    if (!this.container) {
      return;
    }

    this.eventbus = eventbus;

    this.eventhandlers.push(
      eventbus.on(
        'navigate-to-video-url',
        this._handleNavigateVideoUrl.bind(this)
      )
    );
    this.eventhandlers.push(
      eventbus.on('highlight-navigation', this._highlightMenu.bind(this))
    );
    this.eventhandlers.push(
      eventbus.on(
        'request-current-navigation',
        this._handleRequestCurrentNavigation.bind(this)
      )
    );
    this.eventhandlers.push(
      eventbus.on('video-complete', this._handleVideoComplete.bind(this))
    );

    this._buildHtml(this.container, this.navigation);
    this._initHistory.bind(this);
  }

  private _initHistory() {
    this.activeNavigationPoint = this.navVidIdLookup[0];
    const navId = this._getQueryVariable(0);
    let videoIndex = 0;
    if (navId) {
      const nav = this.navLookup[navId];
      videoIndex = nav.videoUrlIndex;
    }
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

  private _handleRequestCurrentNavigation(resultCallback: TResultCallback<{navigationData: any, title: string}|null>) {
    if (this.activeNavigationPoint) {
      const labelCtrl = this.ctrlLookup[this.activeNavigationPoint.labelId];
      resultCallback({
        navigationData: this.activeNavigationPoint,
        title: labelCtrl.labelData[labelCtrl.currentLanguage || ''],
      });
    } else {
      resultCallback(null);
    }
  }

  detach(eventbus: IEventbus) {
    this.eventhandlers.forEach((handler) => {
      handler();
    });

    this.labelControllers.forEach((ctrl) => {
      ctrl.detach(eventbus);
    });

    this.labelControllers.length = 0;
    this.eventbus = null;
    this.container = null;
    window.onpopstate = null;
  }

  private _pushCurrentState(position = -1) {
    if (!this.activeNavigationPoint) {
      return;
    }
    const labelCtrl: LabelController =
      this.ctrlLookup[this.activeNavigationPoint.labelId];

    if (!labelCtrl) {
      return;
    }

    const state = {
      navigationData: this.activeNavigationPoint,
      title: labelCtrl.labelData[labelCtrl.currentLanguage || ''],
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
  }

  private _addNavElement(parentElm: JQuery, data: any) {
    if (data.visible) {
      const li = $('<li/>');
      const a = $(`<a href='javascript:;' id='nav_${data.videoUrlIndex}'/>`);
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
      this.eventbus?.broadcast('request-video-url', [navdata.videoUrlIndex]);
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
    const navElm = $(`#nav_${index}`);

    if (navElm.length) {
      $('.current-menu-item').removeClass('current-menu-item');
      navElm.addClass('current-menu-item');
    }
  }

  private _handleVideoComplete(index: number) {
    const navData = this.navVidIdLookup[index];
    if (navData.autoNext) {
      this.eventbus?.broadcast('request-video-url', [
        navData.next.videoUrlIndex,
      ]);
    } else {
      this.eventbus?.broadcast('request-video-cleanup');
    }
  }

  private _addLabel(parentElm: JQuery, labelId: string) {
    const data = {
      selectedElement: parentElm,
      labelId: labelId,
    };
    const resultCallback = (instance: LabelController) => {
      instance.init(data);
      instance.attach(this.eventbus as IEventbus);
      this.labelControllers.push(instance);
      this.ctrlLookup[labelId] = instance;
    };
    this.eventbus?.broadcast('request-instance', [
      'LabelController',
      resultCallback,
    ]);
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
