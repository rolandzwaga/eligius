import {internalResolve} from '@operation/helper/internal-resolve.ts';
import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import type {TOperation} from '@operation/types.ts';

export interface IAnimateWithClassOperationData {
  /**
   * @dependency
   */
  selectedElement: JQuery;
  /**
   * @type=ParameterType:className
   * @required
   * @erased
   */
  className: string;
  /**
   * When true (the default), the class is removed again after the animation ends
   *
   * @erased
   */
  removeClass?: boolean;
  /**
   * When true, the operation resolves on the first `animationend` event from the selected
   * element or any of its descendants. Use this for a class that only animates descendants.
   * When false (the default), only animations on the selected elements themselves are awaited.
   *
   * @erased
   */
  includeDescendants?: boolean;
}

/**
 * Extra time, in milliseconds, after the longest computed animation before the
 * operation settles anyway. Covers an `animationend` that never fires, for example
 * because the element was hidden or removed while animating.
 */
const FALLBACK_MARGIN_MS = 150;

function parseCssList(value: string | undefined): string[] {
  return (value ?? '').split(',').map(part => part.trim());
}

function parseCssTime(value: string | undefined): number {
  if (!value) {
    return 0;
  }
  const amount = Number.parseFloat(value);
  if (Number.isNaN(amount)) {
    // 'auto' and other keywords resolve to 0s for time-based animations
    return 0;
  }
  return value.endsWith('ms') ? amount : amount * 1000;
}

function parseIterationCount(value: string | undefined): number {
  if (value === 'infinite') {
    return Number.POSITIVE_INFINITY;
  }
  const count = Number.parseFloat(value ?? '');
  return Number.isNaN(count) ? 1 : count;
}

/**
 * Returns the time in milliseconds until the element's longest running CSS animation
 * ends: 0 when it has no animation to wait for, Infinity for an infinite animation.
 */
function getAnimationEndTime(element: Element): number {
  const view = element.ownerDocument?.defaultView;
  if (!view) {
    return 0;
  }
  const style = view.getComputedStyle(element);
  const names = parseCssList(style.animationName);
  const durations = parseCssList(style.animationDuration);
  const delays = parseCssList(style.animationDelay);
  const iterations = parseCssList(style.animationIterationCount);

  let endTime = 0;
  names.forEach((name, index) => {
    if (name === '' || name === 'none') {
      return;
    }
    const duration = parseCssTime(durations[index % durations.length]);
    const delay = parseCssTime(delays[index % delays.length]);
    const count = parseIterationCount(iterations[index % iterations.length]);
    const activeTime = duration === 0 ? 0 : duration * count;
    endTime = Math.max(endTime, delay + activeTime);
  });
  return endTime;
}

/**
 * This operation adds the specified class name to the specified selected element and assumes that this
 * class triggers an animation on the selected element. It then waits for this animation to complete
 * before it resolves.
 *
 * The class must put the animation on the selected element itself: `animationend` events that bubble up
 * from descendants are ignored, and with several selected elements the operation waits for all of them.
 * Set `includeDescendants` to true for a class that only animates descendants; the operation then resolves
 * on the first `animationend` from the element or its subtree.
 *
 * The operation resolves immediately when the selection is empty, or when the class gives none of the
 * selected elements a CSS animation (for example under `prefers-reduced-motion: reduce`). When an
 * `animationend` event never arrives, for example because the element was hidden or removed while
 * animating, it resolves shortly after the longest computed animation should have ended. An infinite
 * animation is waited for until it is ended by an `animationend` event.
 *
 * @category Animation
 */
export const animateWithClass: TOperation<
  IAnimateWithClassOperationData,
  Omit<
    IAnimateWithClassOperationData,
    'className' | 'removeClass' | 'includeDescendants'
  >
> = (operationData: IAnimateWithClassOperationData) => {
  const {selectedElement, className} = operationData;
  const removeClass = operationData.removeClass ?? true;
  const includeDescendants = operationData.includeDescendants ?? false;

  removeProperties(
    operationData,
    'className',
    'removeClass',
    'includeDescendants'
  );

  return new Promise<
    Omit<
      IAnimateWithClassOperationData,
      'className' | 'removeClass' | 'includeDescendants'
    >
  >((resolve, reject) => {
    // There is nothing that can fire animationend for an empty set
    if (selectedElement.length === 0) {
      internalResolve(resolve, {}, operationData);
      return;
    }

    let settled = false;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

    const finish = () => {
      if (settled) {
        return;
      }
      settled = true;
      if (fallbackTimer !== undefined) {
        clearTimeout(fallbackTimer);
      }
      selectedElement.off('animationend', handleAnimationEnd);
      if (removeClass) {
        selectedElement.removeClass(className);
      }
      internalResolve(resolve, {}, operationData);
    };

    const pending = new Set<Element>();

    function handleAnimationEnd(event: JQuery.TriggeredEvent) {
      if (includeDescendants) {
        finish();
        return;
      }
      // animationend bubbles: ignore events from descendants
      if (event.target !== event.currentTarget) {
        return;
      }
      pending.delete(event.currentTarget as Element);
      if (pending.size === 0) {
        finish();
      }
    }

    try {
      selectedElement.on('animationend', handleAnimationEnd);
      selectedElement.addClass(className);

      if (includeDescendants) {
        return;
      }

      let longestFinite = 0;
      let hasInfinite = false;
      selectedElement.each((_index, element) => {
        const endTime = getAnimationEndTime(element);
        if (endTime <= 0) {
          return;
        }
        pending.add(element);
        if (endTime === Number.POSITIVE_INFINITY) {
          hasInfinite = true;
        } else {
          longestFinite = Math.max(longestFinite, endTime);
        }
      });

      if (pending.size === 0) {
        finish();
        return;
      }

      if (!hasInfinite) {
        fallbackTimer = setTimeout(finish, longestFinite + FALLBACK_MARGIN_MS);
      }
    } catch (e) {
      settled = true;
      selectedElement.off('animationend', handleAnimationEnd);
      reject(e);
    }
  });
};
