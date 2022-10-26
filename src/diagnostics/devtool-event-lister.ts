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
    const message = {
      eventName,
      eventTopic,
      args: prepareValueForSerialization(args),
    };
    try {
      this.agent.postMessage('eligius-diagnostics-event', message);
    } catch (e) {
      console.error('postmessage failed');
      console.error(e);
      console.log('message', message);
    }
  }
}
