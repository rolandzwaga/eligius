/**
 * TypeScript Contract Definitions for Mutation Observer Controller
 *
 * These interfaces define the contracts for the MutationObserverController feature.
 * They will be implemented in src/controllers/mutation-observer-controller.ts
 */

/**
 * Metadata configuration for MutationObserverController
 *
 * Configures what types of DOM mutations to observe and how to observe them.
 * Passed to the controller's init() method.
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
 *
 * Event name: TimelineEventNames.DOM_MUTATION
 * Payload contains mutation records and metadata
 */
export interface IMutationEventPayload {
  /**
   * Array of mutation records from the MutationObserver callback
   * Contains details about what changed in the DOM
   */
  mutations: MutationRecord[];

  /**
   * Reference to the observed element (native DOM node)
   * Useful for identifying which observer triggered the event
   */
  target: Element;

  /**
   * Timestamp when the mutations were detected
   * Generated via Date.now()
   */
  timestamp: number;
}

/**
 * Controller class interface (for reference)
 *
 * Actual implementation will extend BaseController<IMutationObserverControllerMetadata>
 * This interface documents the public API contract
 */
export interface IMutationObserverController {
  /**
   * Controller name identifier
   */
  name: string;

  /**
   * Initialize the controller with configuration metadata
   *
   * @param operationData - Configuration for observation behavior
   */
  init(operationData: IMutationObserverControllerMetadata): void;

  /**
   * Attach the controller and start observing mutations
   * Creates MutationObserver instance and begins monitoring the target element
   *
   * @param eventbus - Eligius eventbus for broadcasting mutation events
   */
  attach(eventbus: IEventbus): void;

  /**
   * Detach the controller and stop observing mutations
   * Disconnects MutationObserver and cleans up resources
   *
   * @param eventbus - Eligius eventbus (used by BaseController for cleanup)
   */
  detach(eventbus: IEventbus): void;
}

/**
 * Type alias for MutationObserver options
 * Maps controller metadata to native MutationObserverInit options
 */
export type MutationObserverOptions = MutationObserverInit;
