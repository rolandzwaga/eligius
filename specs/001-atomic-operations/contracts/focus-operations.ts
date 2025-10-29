/**
 * TypeScript interfaces for Focus Operations
 *
 * @packageDocumentation
 */

/**
 * Operation data for setFocus operation.
 * Moves keyboard focus to element.
 */
export interface ISetFocusOperationData {
  /** CSS selector for element */
  selector?: string;
  /** Pre-selected element (jQuery) */
  selectedElement?: any;
  /** True if focus set successfully (output) */
  focused?: boolean;
  /** Error message if operation failed (output) */
  error?: string;
}

/**
 * Operation data for getFocusedElement operation.
 * Returns currently focused element.
 */
export interface IGetFocusedElementOperationData {
  /** Currently focused element (jQuery wrapped) (output) */
  focusedElement?: any;
  /** Selector for focused element (if identifiable) (output) */
  selector?: string;
  /** True if any element has focus (output) */
  hasFocus?: boolean;
  /** Error message if operation failed (output) */
  error?: string;
}

/**
 * Operation data for setAriaAttribute operation.
 * Sets ARIA attribute on element.
 */
export interface ISetAriaAttributeOperationData {
  /** CSS selector for element */
  selector?: string;
  /** Pre-selected element (jQuery) */
  selectedElement?: any;
  /** ARIA attribute name (e.g., 'aria-label', 'aria-live') */
  attribute: string;
  /** Attribute value */
  value: string | boolean | number;
  /** True if attribute set successfully (output) */
  set?: boolean;
  /** Error message if operation failed (output) */
  error?: string;
}

/**
 * Announcement politeness level.
 */
export type AriaPoliteness = 'polite' | 'assertive';

/**
 * Operation data for announceToScreenReader operation.
 * Announces text to screen readers using ARIA live region.
 */
export interface IAnnounceToScreenReaderOperationData {
  /** Text to announce */
  message: string;
  /** Announcement urgency */
  politeness?: AriaPoliteness;
  /** True if announcement triggered (output) */
  announced?: boolean;
  /** Error message if operation failed (output) */
  error?: string;
}
