import { ICalcOperationData } from '../calc';
import { IOperationMetadata } from './types';

function calc(): IOperationMetadata<ICalcOperationData> {
  return {
    description: 'clears the given element',
    properties: {
      left: {
        type: 'ParameterType:integer',
        description: 'The left operand',
        required: true,
      },
      right: {
        type: 'ParameterType:integer',
        description: 'The right operand',
        required: true,
      },
      operator: [
        {
          value: '+',
          description: 'Adds the left and right operands',
        },
        {
          value: '-',
          description: 'Subtracts the left and right operands',
        },
        {
          value: '*',
          description: 'Multiplies the left and right operands',
        },
        {
          value: '/',
          description: 'Divides the left and right operands',
        },
        {
          value: '%',
          description:
            'Returns the remainder left over after the left number is divided into a number of integer portions equal to the right number',
        },
        {
          value: '**',
          description:
            'Exponent: Raises a base number to the exponent power, that is, the base number multiplied by itself, exponent times.',
        },
      ],
      propertyName: {
        type: 'ParameterType:string',
        defaultValue: 'calculationResult',
      },
    },
    /*outputProperties: {
      propertyName: {
        type: 'ParameterType:integer',
      },
    },*/
  };
}

export default calc;
