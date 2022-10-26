import { TDiagnosticType } from './types';

export class Diagnostics {
  static send(_name: TDiagnosticType, _data: any): void {
    console.log(_name, _data);
  }
  static active: boolean;
}
