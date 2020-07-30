import { IChronoTriggerEngine, IResolvedEngineConfiguration, TimelineTypes, ITimelineProviderInfo, TResultCallback } from './types';
import { IEventbus } from './eventbus/types';
import { ITimelineProvider } from './timelineproviders/types';
import LanguageManager from './language-manager';
import { TimelineAction } from './action';
import { TOperation, IEndableAction, ITimelineAction } from './action/types';
/**
 * ChronoTriggerEngine, this is where the magic happens. The engine is responsible for starting and stoppping
 * the given timeline provider and triggering the actions associated with it.
 * ...
 */
declare class ChronoTriggerEngine implements IChronoTriggerEngine {
    #private;
    private configuration;
    private eventbus;
    private timelineProviders;
    private languageManager;
    constructor(configuration: IResolvedEngineConfiguration, eventbus: IEventbus, timelineProviders: Record<TimelineTypes, ITimelineProviderInfo>, languageManager: LanguageManager);
    init(): Promise<ITimelineProvider>;
    _createLayoutTemplate(): void;
    _initializeTimelineProvider(): Promise<ITimelineProvider>;
    _cleanUp(): Promise<void>;
    destroy(): Promise<void>;
    _addInitialisationListeners(): void;
    _createTimelineLookup(): void;
    _addTimelineAction(uri: string, timeLineAction: TimelineAction): void;
    _initializeUriLookup(lookup: Record<string, any>, uri: string): Record<number, any>;
    _initializeTimelinePosition(lookup: Record<number, any>, position: number): TOperation[];
    _executeActions(actions: IEndableAction[], methodName: 'start' | 'end', idx?: number): Promise<any>;
    _handleRequestEngineRoot(engineRootSelector: string, resultCallback: TResultCallback): void;
    _handleRequestTimelineUri(uri: string, position: number, previousVideoPosition: number): void;
    _cleanUpTimeline(): Promise<any>;
    _executeStartActions(): Promise<any>;
    _getActionsForPosition(position: number, allActions: ITimelineAction[]): ITimelineAction[];
    _getActiveActions(allActions: ITimelineAction[]): ITimelineAction[];
    _executeRelevantActions(filter: Function, executionType: 'start' | 'end'): Promise<any>;
    _handleRequestTimelinePosition(floor: Function, resultCallback: TResultCallback): void;
    _handleTimelineComplete(): void;
    _handleExecuteTimelineAction(uri: string, index: number, start: boolean): void;
    _resizeTimelineAction(): void;
    _getRelevantTimelineActions(): ITimelineAction[];
    _requestCurrentTimeline(resultCallback: TResultCallback): void;
    _getTimelineActionsForUri(uri: string): ITimelineAction[];
    _onTimeHandler(floor: Function, event: any): void;
    _onSeekHandler(floor: Function, event: {
        offset: number;
    }): void;
    _executeActionsForPosition(position: number): void;
    _executeSeekActions(pos: number): Promise<unknown>;
}
export default ChronoTriggerEngine;
