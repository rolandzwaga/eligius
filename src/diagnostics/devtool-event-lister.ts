import { IEventbusListener } from '../eventbus';
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
    });
  }
}
