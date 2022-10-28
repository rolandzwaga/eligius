export type TDevToolsEventSubscriber = (event: TEventData) => void;

export type TPlayControlEventKind = 'play' | 'stop' | 'pause' | 'seek';
export const DEV_TOOLS_KEY = '__ELIGIUS_DEV_TOOLS__';

export type TWindowWithDevtools = Window & {
  [DEV_TOOLS_KEY]: IDiagnosticsInfo | undefined;
};

export type TDevToolsMessage = {
  source: 'eligius-inspect-devtools';
  name: 'event';
  data: TEventData;
};

export type TEventData = {
  type: 'playcontrol';
  data: IPlayControlEvent;
};

export interface IPlayControlEvent {
  kind: TPlayControlEventKind;
  args?: any[];
}

export interface IDiagnosticsAgent {
  postMessage(name: TDiagnosticType, messageData: any): void;
  subscribe(subscriber: TDevToolsEventSubscriber): () => void;
}

export interface IDiagnosticsInfo {
  get agent(): IDiagnosticsAgent;
}

export type TDiagnosticType =
  | 'eligius-diagnostics-factory'
  | 'eligius-diagnostics-engine'
  | 'eligius-diagnostics-event'
  | 'eligius-diagnostics-action'
  | 'eligius-diagnostics-action-error'
  | 'eligius-diagnostics-operation';

export type TDiagnosticsMessageSource =
  | 'eligius-inspect-agent'
  | 'eligius-inspect-devtools';
