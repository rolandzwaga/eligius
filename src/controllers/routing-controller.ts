import { IEventbus, TEventbusRemover } from '../eventbus/types';
import { TOperationData } from '../operation/types';
import { IController } from './types';

export interface IRoutingControllerOperationData {
  json: any;
}

/**
 * This is a work in progress, do not use this yet please....
 */
export class RoutingController
  implements IController<IRoutingControllerOperationData>
{
  name = 'RoutingController';
  navLookup: Record<string, any> = {};
  navVidIdLookup: Record<string, any> = {};
  navigation: any = null;
  eventhandlers: TEventbusRemover[] = [];
  eventbus: IEventbus | null = null;

  constructor() {}

  init(operationData: TOperationData) {
    this.navigation = this._buildNavigationData(operationData.json);
  }

  attach(eventbus: IEventbus) {
    this.eventhandlers.push(
      eventbus.on(
        'before-request-video-url',
        this._handleBeforeRequestVideoUrl.bind(this)
      )
    );
    this.eventhandlers.push(
      eventbus.on('push-history-state', this._handlePushHistoryState.bind(this))
    );
    this.eventbus = eventbus;
    window.onpopstate = this._handlePopstate.bind(this);

    const navId = this._getQueryVariable(0);
    if (navId) {
      const nav = this.navLookup[navId];
      const pos = +this._getQueryVariable(1);
      this.eventbus.broadcast('request-video-url', [
        nav.videoUrlIndex,
        pos,
        true,
      ]);
    } else {
      window.history.pushState(
        { navigationId: this.navigation[0].id },
        '',
        `#/${this.navigation[0].id}`
      );
    }
  }

  private _handlePopstate(event: any) {
    const navigationId = event.state
      ? event.state.navigationId
      : this.navigation[0].id;
    const position = event.state?.position ?? 0;
    const nav = this.navLookup[navigationId];
    this.eventbus?.broadcast('highlight-navigation', [nav.videoUrlIndex]);
    this.eventbus?.broadcast('request-video-url', [
      nav.videoUrlIndex,
      position,
      true,
    ]);
  }

  detach(_eventbus: IEventbus) {
    if (this.eventhandlers) {
      this.eventhandlers.forEach((handler) => {
        handler();
      });
    }
    this.eventbus = null;
  }

  private _handleBeforeRequestVideoUrl(
    _index: number,
    _requestedVideoPosition: number = 0,
    isHistoryRequest: boolean = false
  ) {
    isHistoryRequest =
      isHistoryRequest !== undefined ? isHistoryRequest : false;
    if (!isHistoryRequest) {
      const resultCallback = (item: any) => {
        this._pushState(item);
      };
      this.eventbus?.broadcast('request-current-navigation', [resultCallback]);
    }
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
    if (state && state.navigationData && state.navigationData.visible) {
      let currentPosition = state.position !== undefined ? state.position : -1;
      if (currentPosition < 0) {
        const resultCallback = (position: number) => {
          currentPosition = position > 3 ? position - 3 : 0;
        };
        this.eventbus?.broadcast('request-current-video-position', [
          resultCallback,
        ]);
      }

      const currentState = window.history.state;
      if (
        currentState &&
        currentState.navigationId !== state.navigationData.id
      ) {
        window.history.pushState(
          { navigationId: state.navigationData.id, position: currentPosition },
          state.title,
          `#/${state.navigationData.id}/${currentPosition}`
        );
      } else if (
        currentState &&
        currentState.navigationId === state.navigationData.id
      ) {
        window.history.replaceState(
          {
            navigationId: currentState.navigationId,
            position: currentPosition,
          },
          state.title,
          `#/${currentState.navigationId}/${currentPosition}`
        );
      } else {
        window.history.pushState(
          { navigationId: state.navigationData.id, position: currentPosition },
          state.title,
          `#/${state.navigationData.id}/${currentPosition}`
        );
      }
      window.document.title = state.title;
    }
  }

  private _buildNavigationData(data: any) {
    const result: any[] = [];
    data.navigationData.forEach((nav: any, index: any) => {
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
