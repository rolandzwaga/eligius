import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import type {TOperation} from '@operation/types.ts';

export interface IAnnounceToScreenReaderOperationData {
  /**
   * @required
   * @erased
   */
  message: string;
  /**
   * @optional
   * @erased
   */
  priority?: 'polite' | 'assertive';
}

/**
 * Delay between emptying the live region and writing the message. Screen readers
 * ignore content that is inserted together with a new live region, and setting the
 * same text twice causes no DOM change, so the message is written on a later task.
 */
const ANNOUNCE_DELAY_MS = 100;

/**
 * Time after which an announced message is removed from the live region again.
 */
const ANNOUNCE_CLEAR_AFTER_MS = 5000;

interface IPendingAnnouncement {
  fill?: ReturnType<typeof setTimeout>;
  clear?: ReturnType<typeof setTimeout>;
}

const pendingAnnouncements = new WeakMap<HTMLElement, IPendingAnnouncement>();

function cancelPending(liveRegion: HTMLElement) {
  const pending = pendingAnnouncements.get(liveRegion);
  if (pending) {
    clearTimeout(pending.fill);
    clearTimeout(pending.clear);
    pendingAnnouncements.delete(liveRegion);
  }
}

/**
 * Announces a message to screen readers using an ARIA live region.
 *
 * The live region (`#aria-live-region`) is created empty on first use. The region is emptied
 * and the message is written 100 milliseconds later, so that a new region
 * and a message repeated verbatim are both announced. The message is removed again after 5 seconds.
 * A newer announcement replaces a pending one.
 *
 * The operation returns at once and does not wait for the message to be written.
 *
 * @throws When the message is empty.
 *
 * @category Accessibility
 */
export const announceToScreenReader: TOperation<
  IAnnounceToScreenReaderOperationData,
  Omit<IAnnounceToScreenReaderOperationData, 'message' | 'priority'>
> = (operationData: IAnnounceToScreenReaderOperationData) => {
  const {message, priority = 'polite'} = operationData;

  if (!message || message.trim() === '') {
    throw new Error('announceToScreenReader: message is required');
  }

  // Create or get existing live region
  let liveRegion = document.getElementById('aria-live-region');
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'aria-live-region';
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';
    document.body.appendChild(liveRegion);
  } else {
    liveRegion.setAttribute('aria-live', priority);
  }

  cancelPending(liveRegion);
  liveRegion.textContent = '';

  const region = liveRegion;
  const pending: IPendingAnnouncement = {};
  pending.fill = setTimeout(() => {
    region.textContent = message;
    pending.clear = setTimeout(() => {
      region.textContent = '';
      pendingAnnouncements.delete(region);
    }, ANNOUNCE_CLEAR_AFTER_MS);
  }, ANNOUNCE_DELAY_MS);
  pendingAnnouncements.set(region, pending);

  removeProperties(operationData, 'message', 'priority');

  return operationData;
};
