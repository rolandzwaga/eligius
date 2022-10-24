export interface IDiagnosticsAgent {
  postMessage(name: TDiagnosticType, data: any): void;
}

export interface IDiagnosticsInfo {
  get agent(): IDiagnosticsAgent;
}

export type TDiagnosticType =
  | 'eligius-diagnostics-event'
  | 'eligius-diagnostics-action'
  | 'eligius-diagnostics-action-error'
  | 'eligius-diagnostics-operation';

export const DEV_TOOLS_KEY = '__ELIGIUS_DEV_TOOLS__';
