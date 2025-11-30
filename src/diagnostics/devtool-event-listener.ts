import type {IDiagnosticsAgent} from '@diagnostics/types.ts';
import type {IEventbusListener} from '@eventbus/index.ts';
import {prepareValueForSerialization} from '@util/prepare-value-for-serialization.ts';

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
      console.info('message', message);
    }
  }
}
