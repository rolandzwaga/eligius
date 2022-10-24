import { IEventbusListener } from '../eventbus';
import { prepareValueForSerialization } from '../util/prepare-value-for-serialization';
import { IDiagnosticsAgent } from './types';

export class DevToolEventListener implements IEventbusListener {
  constructor(private agent: IDiagnosticsAgent) {}

  handleEvent(
    eventName: string,
    eventTopic: string | undefined,
    args: any[]
  ): void {
    this.agent.postMessage('eligius-diagnostics-event', {
      eventName,
      eventTopic,
      args: prepareValueForSerialization(args),
    });
  }
}
