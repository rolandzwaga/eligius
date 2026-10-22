import type {IEventbus} from '@eventbus/types.ts';
import {deepCopy} from '@operation/helper/deep-copy.ts';

/**
 * The navigation lookups shared by NavigationController and RoutingController.
 */
export interface INavigationData {
  /** The root entries, in `roots` order */
  roots: any[];
  /** Entries by `id` */
  navLookup: Record<string, any>;
  /** Entries by `videoUrlIndex` */
  navVidIdLookup: Record<string, any>;
}

/**
 * Builds the navigation entries from a navigation json
 * (`{navigationData: [...], roots: [...]}`).
 *
 * The json is copied first and never changed, so several controllers can be
 * initialised with the same json object. Every entry gets `previous` and
 * `next` links (`next` follows `nextId` when given, otherwise the next entry
 * in `navigationData`), and the `children` ids of every entry, at any depth,
 * are replaced by the entries they name.
 *
 * @param json - The navigation json
 * @param controllerName - Named in error messages
 * @returns the root entries and the lookups
 * @throws when the json has no `navigationData` array, or when `roots`,
 * `nextId` or `children` name an unknown navigation id
 */
export function buildNavigationData(
  json: any,
  controllerName: string
): INavigationData {
  if (!Array.isArray(json?.navigationData)) {
    throw new Error(
      `${controllerName}: json.navigationData must be an array of navigation entries`
    );
  }

  const entries: any[] = deepCopy(json.navigationData);
  const navLookup: Record<string, any> = {};
  const navVidIdLookup: Record<string, any> = {};

  entries.forEach((nav, index) => {
    navLookup[nav.id] = nav;
    navVidIdLookup[nav.videoUrlIndex] = nav;
    nav.previous = entries[index - 1];
  });

  const find = (id: unknown, location: string) => {
    if (typeof id === 'string' && Object.hasOwn(navLookup, id)) {
      return navLookup[id];
    }
    throw new Error(
      `${controllerName}: unknown navigation id '${String(id)}' in ${location}`
    );
  };

  entries.forEach((nav, index) => {
    nav.next = nav.nextId
      ? find(nav.nextId, `nextId of '${nav.id}'`)
      : entries[index + 1];

    if (Array.isArray(nav.children)) {
      nav.children = nav.children.map((child: unknown) =>
        find(
          typeof child === 'object' && child !== null
            ? (child as {id?: unknown}).id
            : child,
          `children of '${nav.id}'`
        )
      );
    }
  });

  const rootIds: unknown[] = Array.isArray(json.roots) ? json.roots : [];
  const roots = rootIds.map(id => find(id, 'roots'));

  return {roots, navLookup, navVidIdLookup};
}

/**
 * Asks for the content of a navigation entry.
 *
 * An entry with a `timelineUri` is requested from the engine with
 * `request-timeline-uri` [timelineUri, position]. An entry without one falls
 * back to the legacy `request-video-url` [videoUrlIndex, position], which the
 * engine does not handle, so the host has to.
 *
 * @param eventbus - The eventbus to broadcast on
 * @param nav - The navigation entry
 * @param position - The start position in seconds
 * @param isHistoryRequest - Passed on as the third `request-video-url`
 * argument; the timeline request has no such argument
 */
export function requestNavigation(
  eventbus: IEventbus,
  nav: any,
  position: number,
  isHistoryRequest = false
): void {
  if (typeof nav.timelineUri === 'string' && nav.timelineUri.length > 0) {
    eventbus.broadcast('request-timeline-uri', [nav.timelineUri, position]);
  } else if (isHistoryRequest) {
    eventbus.broadcast('request-video-url', [
      nav.videoUrlIndex,
      position,
      true,
    ]);
  } else {
    eventbus.broadcast('request-video-url', [nav.videoUrlIndex, position]);
  }
}
