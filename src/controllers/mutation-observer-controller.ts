import {BaseController} from '@controllers/base-controller.ts';
import type {IEventbus} from '@eventbus/types.ts';

/**
 * Metadata configuration for MutationObserverController
 *
 * Configures what types of DOM mutations to observe and how to observe them.
 */
export interface IMutationObserverControllerMetadata {
  /**
   * jQuery-wrapped DOM element to observe for mutations
   * @dependency
   * @required
   */
  selectedElement: JQuery;

  /**
   * Observe changes to element attributes
   * @optional
   * @default true
   */
  observeAttributes?: boolean;

  /**
   * Observe additions and removals of child nodes
   * @optional
   * @default true
   */
  observeChildList?: boolean;

  /**
   * Observe changes to text content (character data)
   * @optional
   * @default true
   */
  observeCharacterData?: boolean;

  /**
   * Observe mutations in the entire subtree (all descendants)
   * @optional
   * @default false
   */
  observeSubtree?: boolean;

  /**
   * Record the previous value of attributes that change
   * Requires observeAttributes to be true
   * @optional
   * @default false
   */
  attributeOldValue?: boolean;

  /**
   * Record the previous value of text content that changes
   * Requires observeCharacterData to be true
   * @optional
   * @default false
   */
  characterDataOldValue?: boolean;

  /**
   * Array of specific attribute local names to observe
   * If omitted, all attribute changes are observed when observeAttributes is true
   * @optional
   */
  attributeFilter?: string[];
}

/**
 * Mutation event payload broadcasted through Eligius eventbus
 */
export interface IMutationEventPayload {
  /**
   * Array of mutation records from the MutationObserver callback
   */
  mutations: MutationRecord[];

  /**
   * Reference to the observed element (native DOM node)
   */
  target: Element;

  /**
   * Timestamp when the mutations were detected
   */
  timestamp: number;
}

/**
 * Controller that observes DOM mutations on a selected element and broadcasts events.
 *
 * This controller creates a MutationObserver to monitor DOM changes (attributes, child nodes,
 * text content) on a specified element. All detected mutations are broadcasted through the
 * Eligius eventbus, enabling reactive behavior in response to DOM changes.
 *
 * The controller follows the standard Eligius lifecycle:
 * - init(): Store configuration metadata
 * - attach(): Create and start the MutationObserver
 * - detach(): Disconnect the observer and clean up resources
 *
 * @example
 * ```typescript
 * // JSON configuration
 * {
 *   "systemName": "addControllerToElement",
 *   "operationData": {
 *     "controllerName": "MutationObserverController",
 *     "observeAttributes": true,
 *     "observeChildList": true,
 *     "observeCharacterData": false
 *   }
 * }
 *
 * // Listen for mutations
 * eventbus.on('dom-mutation', (payload: IMutationEventPayload) => {
 *   console.log('Mutations detected:', payload.mutations);
 * });
 * ```
 */
export class MutationObserverController extends BaseController<IMutationObserverControllerMetadata> {
  name = 'MutationObserverController';
  private observer: MutationObserver | null = null;

  /**
   * Initialize the controller with configuration metadata.
   *
   * @param operationData - Configuration for observation behavior
   */
  init(operationData: IMutationObserverControllerMetadata): void {
    this.operationData = Object.assign({}, operationData);
  }

  /**
   * Attach the controller and start observing mutations.
   * Creates MutationObserver instance and begins monitoring the target element.
   *
   * @param eventbus - Eligius eventbus for broadcasting mutation events
   */
  attach(eventbus: IEventbus): void {
    if (!this.operationData) {
      return;
    }

    // Unwrap jQuery element to get native DOM node
    const nativeElement = this.operationData.selectedElement.get(0);
    if (!nativeElement) {
      return;
    }

    // Build observer options from metadata
    const options = this._buildObserverOptions();

    // Create MutationObserver with bound callback
    this.observer = new MutationObserver(
      this._handleMutations.bind(this, eventbus, nativeElement)
    );

    // Start observing the target element
    this.observer.observe(nativeElement, options);
  }

  /**
   * Detach the controller and stop observing mutations.
   * Disconnects MutationObserver and cleans up resources.
   *
   * @param eventbus - Eligius eventbus (used by BaseController for cleanup)
   */
  detach(eventbus: IEventbus): void {
    // Disconnect and clean up observer
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // Call parent detach for event listener cleanup
    super.detach(eventbus);
  }

  /**
   * Build MutationObserverInit options from controller metadata.
   * Applies default values for optional configuration properties.
   *
   * @returns MutationObserverInit options object
   * @private
   */
  private _buildObserverOptions(): MutationObserverInit {
    if (!this.operationData) {
      return {};
    }

    const {
      observeAttributes = true,
      observeChildList = true,
      observeCharacterData = true,
      observeSubtree = false,
      attributeOldValue = false,
      characterDataOldValue = false,
      attributeFilter,
    } = this.operationData;

    return {
      attributes: observeAttributes,
      childList: observeChildList,
      characterData: observeCharacterData,
      subtree: observeSubtree,
      attributeOldValue,
      characterDataOldValue,
      attributeFilter,
    };
  }

  /**
   * Handle mutations detected by the MutationObserver.
   * Broadcasts mutation events through the eventbus with mutation details.
   *
   * @param eventbus - Eligius eventbus for broadcasting
   * @param target - The observed element
   * @param mutations - Array of mutation records from observer callback
   * @private
   */
  private _handleMutations(
    eventbus: IEventbus,
    target: Element,
    mutations: MutationRecord[]
  ): void {
    const payload: IMutationEventPayload = {
      mutations,
      target,
      timestamp: Date.now(),
    };

    eventbus.broadcast('dom-mutation', [payload]);
  }
}
