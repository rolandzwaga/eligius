import { expect } from 'chai';
import { addOptionList } from '~/operation/add-option-list';

class MockElement {
  optionsHtml: string = '';
  html(optionsHtml: string) {
    this.optionsHtml = optionsHtml;
  }
}

describe('addOptionList', () => {
  it('should generate an option list and add it to the specified element', () => {
    // given
    const mockElement = new MockElement();

    const operationData = {
      valueProperty: 'value',
      labelProperty: 'label',
      defaultIndex: 0,
      defaultValue: 'x',
      optionData: [
        {
          value: 'x',
          label: 'label 1',
        },
        {
          value: 'y',
          label: 'label 2',
        },
      ],
      selectedElement: (mockElement as any) as JQuery,
    };

    addOptionList(operationData, {} as any);

    // expect
    expect(mockElement.optionsHtml).to.not.be.null;
    expect(mockElement.optionsHtml).to.equal(
      "<option value='x' selected>label 1</option><option value='y'>label 2</option>"
    );
  });

  // test
});
