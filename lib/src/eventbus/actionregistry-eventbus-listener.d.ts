import { IAction } from '~/action/types';
import { IEventbusListener } from './types';
export declare class ActionRegistryEventbusListener implements IEventbusListener {
    private _actionRegistry;
    registerAction(action: IAction, eventName: string, eventTopic?: string): void;
    handleEvent(eventName: string, eventTopic: string | undefined, args: any[]): void;
}
