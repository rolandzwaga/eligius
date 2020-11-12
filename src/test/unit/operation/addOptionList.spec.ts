import addOptionList from '../../operation/addOptionList';
import { expect } from 'chai';

class MockElement {
  html(optionsHtml) {
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
      selectedElement: mockElement,
    };

    addOptionList(operationData, {});

    // expect
    expect(mockElement.optionsHtml).to.not.be.null;
    expect(mockElement.optionsHtml.length).to.equal(2);
    expect(mockElement.optionsHtml[0]).to.equal("<option value='x' selected>label 1</option>");
    expect(mockElement.optionsHtml[1]).to.equal("<option value='y'>label 2</option>");
  });

  // test
});
