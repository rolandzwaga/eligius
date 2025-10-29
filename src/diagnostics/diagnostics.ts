import type {TDiagnosticType} from './types.ts';

let active: boolean;

export function send(_name: TDiagnosticType, _data: any): void {
  console.log(_name, _data);
}

export function setActive(value: boolean): void {
  active = value;
}

export function isActive(): boolean {
  return active;
}

export const Diagnostics = {
  send,
  get active() {
    return active;
  },
  set active(value: boolean) {
    active = value;
  },
};
