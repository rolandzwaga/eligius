import {removeProperties} from './helper/remove-operation-properties.ts';
import type {TOperation} from './types.ts';

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
 * Announces a message to screen readers using an ARIA live region.
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

  liveRegion.textContent = message;

  removeProperties(operationData, 'message', 'priority');

  return operationData;
};
