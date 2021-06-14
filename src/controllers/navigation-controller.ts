import $ from 'jquery';
import { IEventbus, TEventHandlerRemover } from '../eventbus/types';
import { TOperationData } from '../operation/types';
import { TResultCallback } from '../types';
import { LabelController } from './label-controller';
import { IController } from './types';

export interface INavigationControllerOperationData {
  selectedElement: JQuery;
  json: any;
}

export class NavigationController
  implements IController<INavigationControllerOperationData> {
  name: string = 'NavigationController';
  navigation: any[] = [];
  navLookup: Record<string, any> = {};
  navVidIdLookup: Record<string, any> = {};
  ctrlLookup: Record<string, LabelController> = {};
  activeNavigationPoint: any | null = null;
  labelControllers: LabelController[] = [];
  eventhandlers: TEventHandlerRemover[] = [];
  eventbus: IEventbus | null = null;
  container: JQuery | null = null;

  constructor() {}

  init(operationData: TOperationData) {
    this.container = operationData.selectedElement;
    this.navigation = this.buildNavigationData(operationData.json);
  }

  attach(eventbus: IEventbus) {
    if (!this.container) {
      return;
    }

    this.eventbus = eventbus;

    this.eventhandlers.push(
      eventbus.on(
        'navigate-to-video-url',
        this.handleNavigateVideoUrl.bind(this)
      )
    );
    this.eventhandlers.push(
      eventbus.on('highlight-navigation', this.highlightMenu.bind(this))
    );
    this.eventhandlers.push(
      eventbus.on(
        'request-current-navigation',
        this.handleRequestCurrentNavigation.bind(this)
      )
    );
    this.eventhandlers.push(
      eventbus.on('video-complete', this.handleVideoComplete.bind(this))
    );

    this.buildHtml(this.container, this.navigation);
    this.initHistory.bind(this);
  }

  initHistory() {
    this.activeNavigationPoint = this.navVidIdLookup[0];
    const navId = this.getQueryVariable(0);
    let videoIndex = 0;
    if (navId) {
      const nav = this.navLookup[navId];
      videoIndex = nav.videoUrlIndex;
    }
    this.highlightMenu(videoIndex);
  }

  getQueryVariable(variableIdx: number) {
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

  handleRequestCurrentNavigation(resultCallback: TResultCallback) {
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
    this.eventhandlers.forEach(handler => {
      handler();
    });

    this.labelControllers.forEach(ctrl => {
      ctrl.detach(eventbus);
    });

    this.labelControllers.length = 0;
    this.eventbus = null;
    this.container = null;
    window.onpopstate = null;
  }

  pushCurrentState(position = -1) {
    if (!this.activeNavigationPoint) {
      return;
    }
    const labelCtrl: LabelController = this.ctrlLookup[
      this.activeNavigationPoint.labelId
    ];

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

  buildHtml(parentElm: JQuery, data: any) {
    const ul = $('<ul/>');
    data.forEach(this.addNavElement.bind(this, ul));
    parentElm.append(ul);
  }

  addNavElement(parentElm: JQuery, data: any) {
    if (data.visible) {
      const li = $('<li/>');
      const a = $(`<a href='javascript:;' id='nav_${data.videoUrlIndex}'/>`);
      li.append(a);
      this.addLabel(a, data.labelId);
      this.addClickHandler(a, data.videoUrlIndex);

      if (data.children) {
        const ul = $('<ul/>');
        data.children.forEach(this.addNavElement.bind(this, ul));
        li.append(ul);
      }

      parentElm.append(li);
    }
  }

  addClickHandler(parentElm: JQuery, videoIndex: number) {
    parentElm.mouseup(this.menuMouseupHandler.bind(this, videoIndex));
  }

  menuMouseupHandler(videoIndex: number) {
    const navdata = this.navVidIdLookup[videoIndex];
    if (navdata) {
      this.eventbus?.broadcast('request-video-url', [navdata.videoUrlIndex]);
      this.handleNavigateVideoUrl(navdata.videoUrlIndex);
    }
  }

  handleNavigateVideoUrl(index: number, requestedVideoPosition: number = 0) {
    this.highlightMenu(index);
    this.eventbus?.broadcast('request-video-url', [
      index,
      requestedVideoPosition,
    ]);
    this.activeNavigationPoint = this.navVidIdLookup[index];
    this.pushCurrentState(requestedVideoPosition);
  }

  highlightMenu(index: number) {
    const navElm = $(`#nav_${index}`);

    if (navElm.length) {
      $('.current-menu-item').removeClass('current-menu-item');
      navElm.addClass('current-menu-item');
    }
  }

  handleVideoComplete(index: number) {
    const navData = this.navVidIdLookup[index];
    if (navData.autoNext) {
      this.eventbus?.broadcast('request-video-url', [
        navData.next.videoUrlIndex,
      ]);
    } else {
      this.eventbus?.broadcast('request-video-cleanup');
    }
  }

  addLabel(parentElm: JQuery, labelId: string) {
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

  buildNavigationData(data: any) {
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
