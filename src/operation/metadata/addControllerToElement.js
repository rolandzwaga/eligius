function addControllerToElement() {
  return {
    description: 'Adds the current controller to the selected element(s)',
    dependentProperties: ['selectedElement', 'controllerInstance'],
  };
}
export default addControllerToElement;
