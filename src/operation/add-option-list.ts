import { IEventbus } from '~/eventbus/types';
import { TOperation } from './types';

function createOptionElementText(
  valueProperty: string,
  labelProperty: string,
  defaultIndex: number,
  defaultValue: any,
  data: any,
  index: number
) {
  let selected = '';
  if (defaultValue) {
    selected = data[valueProperty] === defaultValue ? ' selected' : '';
  } else if (defaultIndex) {
    selected = index === defaultIndex ? ' selected' : '';
  }
  return `<option value='${data[valueProperty]}'${selected}>${data[labelProperty]}</option>`;
}

export interface IAddOptionListOperationData {
  valueProperty: string;
  labelProperty: string;
  defaultIndex: number;
  defaultValue: string;
  optionData: any[];
  selectedElement: JQuery;
}

export const addOptionList: TOperation<IAddOptionListOperationData> = function (
  operationData: IAddOptionListOperationData,
  _eventBus: IEventbus
) {
  const { valueProperty, labelProperty, defaultIndex, defaultValue, optionData, selectedElement } = operationData;

  const createOption = createOptionElementText.bind(null, valueProperty, labelProperty, defaultIndex, defaultValue);

  const optionElements = optionData.map(createOption);

  selectedElement.html(optionElements.join(''));

  return operationData;
};
