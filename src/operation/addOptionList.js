function createOptionElementText(valueProperty, labelProperty, defaultIndex, defaultValue, data, index) {
    let selected = '';
    if (defaultValue) {
        selected = (data[valueProperty] === defaultValue) ? ' selected' : '';
    } else if (defaultIndex) {
        selected = (index === defaultIndex) ? ' selected' : '';
    }
    return `<option value='${data[valueProperty]}'${selected}>${data[labelProperty]}</option>`;
}

function addOptionList(operationData, eventBus) {
    const { valueProperty, labelProperty, defaultIndex, defaultValue, optionData, selectedElement } = operationData;

    const createOption = createOptionElementText.bind(null, valueProperty, labelProperty, defaultIndex, defaultValue);

    const optionElements = optionData.map(createOption);

    selectedElement.html(optionElements);

    return operationData;
}

export default addOptionList;
