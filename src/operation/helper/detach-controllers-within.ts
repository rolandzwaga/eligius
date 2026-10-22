import type {IEventbus} from '@eventbus/types.ts';
import {getElementControllers} from '@operation/helper/get-element-data.ts';
import $ from 'jquery';

/**
 * Detaches every controller that is still attached (by the
 * `addControllerToElement` operation) to `root` or to one of its descendants,
 * and removes it from its element. Controllers that were already removed with
 * `removeControllerFromElement` are not touched, so calling this again detaches
 * nothing twice.
 *
 * Every controller is attempted even when one of them throws.
 *
 * @param root - The element whose subtree is searched, root included
 * @param eventbus - The eventbus passed to each controller's `detach()`
 * @returns The errors thrown by `detach()` calls, empty when all succeeded
 */
export function detachControllersWithin(
  root: JQuery,
  eventbus: IEventbus
): unknown[] {
  const errors: unknown[] = [];

  root
    .find('*')
    .addBack()
    .each((_index, element) => {
      // Elements without jQuery data cannot have controllers; skip them
      // without creating a data cache.
      if (!$.hasData(element)) {
        return;
      }
      const controllers = getElementControllers($(element));
      if (!controllers?.length) {
        return;
      }
      // Empty the stored list in place, so the element no longer holds them.
      controllers.splice(0).forEach(controller => {
        try {
          controller.detach(eventbus);
        } catch (error) {
          errors.push(error);
        }
      });
    });

  return errors;
}
