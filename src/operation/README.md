# Operations

This is a list of all the available operations with links to their respective documentation

- [addClass](https://rolandzwaga.github.io/eligius/functions/addClass.html "This operation adds the specified class name to the specified selected element.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/add-class.json))

- [addControllerToElement](https://rolandzwaga.github.io/eligius/functions/addControllerToElement.html "This operation adds the specified controller instance to the given selected element.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/add-controller-to-element.json))

- [animate](https://rolandzwaga.github.io/eligius/functions/animate.html "This operation animates the specified selected element with the given jQuery animation settings. It resolves after the animation completes.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/animate.json))

- [animateWithClass](https://rolandzwaga.github.io/eligius/functions/animateWithClass.html "This operation adds the specified class name to the specified selected element and assumes that this class triggers and animation on the selected element. It then waits for this animation to complete before it resolves.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/animate-with-class.json))

- [broadcastEvent](https://rolandzwaga.github.io/eligius/functions/broadcastEvent.html "This operation broadcasts the given event through the eventbus, along with the event argumetns and optional event topic.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/broadcast-event.json))

- [calc](https://rolandzwaga.github.io/eligius/functions/calc.html "This operation calculates the given left and right hand operands using the specified operator.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/calc.json))

- [clearElement](https://rolandzwaga.github.io/eligius/functions/clearElement.html "This operation removes all of the children from the given selected element.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/clear-element.json))

- [clearOperationData](https://rolandzwaga.github.io/eligius/functions/clearOperationData.html "This operation removes all of the properties on the current operation date. Or, if the properties property is set only removes the properties defined by that list.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/clear-operation-data.json))

- [createElement](https://rolandzwaga.github.io/eligius/functions/createElement.html "This operation creates the DOM element described by the given elementName and attributes and assigns the instance to the ") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/create-element.json))

- [customFunction](https://rolandzwaga.github.io/eligius/functions/customFunction.html "This operation retrieves a custom function defined by the given system name and invokes it with the current operation data and eventbus.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/custom-function.json))

- [endAction](https://rolandzwaga.github.io/eligius/functions/endAction.html "This operation invokes the end() method on the specified action instance.  The action operation data is first merged with the current operation data before it is passed on to the action. After the action has completed the action operation data properties are removed from the current operation data.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/end-action.json))

- [endLoop](https://rolandzwaga.github.io/eligius/functions/endLoop.html "This operation checks if the current loop should end or start the next iteration.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/end-loop.json))

- [endWhen](https://rolandzwaga.github.io/eligius/functions/endWhen.html "This operation cleans up after the ") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/end-when.json))

- [extendController](https://rolandzwaga.github.io/eligius/functions/extendController.html) - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/extend-controller.json))

- [getControllerFromElement](https://rolandzwaga.github.io/eligius/functions/getControllerFromElement.html "This operation retrieves the controller instance with the specified name that is assigned to the given selected element.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/get-controller-from-element.json))

- [getControllerInstance](https://rolandzwaga.github.io/eligius/functions/getControllerInstance.html "This operation retrieves an instance of the given controller name. It assigns this instance to the ") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/get-controller-instance.json))

- [getElementDimensions](https://rolandzwaga.github.io/eligius/functions/getElementDimensions.html "This operation calculates the width and height of the given selected element. It assigns this struct to the dimensions property on the current operation data. Optionally the width and height can be modified using the given modifier string.  The modifier string is formatted in the following way:  <operator><amount><optional-side><optional-precentage>|<ratio-definition>  Where the ratio modifier is formatted in the following way: <side>[ar=<ratio-left>-<ratio-right>]  For example, this modifier '+100h|w[ar=8-1]' will modifiy the dimensions like this: it will add a value of 100 to the height and modify the width by a ration of 8 to 1 relative to the height.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/get-element-dimensions.json))

- [getImport](https://rolandzwaga.github.io/eligius/functions/getImport.html "This operation retrieves the import specified by the given system name and assigns it to the importedInstance property on the current operaton date.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/get-import.json))

- [getQueryParams](https://rolandzwaga.github.io/eligius/functions/getQueryParams.html "This operation retrieves the current query parameters from the browser's address bar and places them on the returned operation data.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/get-query-params.json))

- [invokeObjectMethod](https://rolandzwaga.github.io/eligius/functions/invokeObjectMethod.html "This operation invokes the specified method on the given object with the given optional arguments and assigns the result to the ") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/invoke-object-method.json))

- [loadJSON](https://rolandzwaga.github.io/eligius/functions/loadJSON.html "This operation loads a JSON file from the specified url and assigns it to the json property on the current operation data.  If the cache property is set to true and a cached value already exists, this is assigned instead of re-retrieving it from the url.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/load-json.json))

- [log](https://rolandzwaga.github.io/eligius/functions/log.html "This operation logs the current operation data and context to the console.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/log.json))

- [math](https://rolandzwaga.github.io/eligius/functions/math.html "This operation performs the given math function with the specified arguments.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/math.json))

- [otherwise](https://rolandzwaga.github.io/eligius/functions/otherwise.html "If the preceeding ") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/otherwise.json))

- [removeClass](https://rolandzwaga.github.io/eligius/functions/removeClass.html "This operation removes the spcified class name from the given selected element.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/remove-class.json))

- [removeControllerFromElement](https://rolandzwaga.github.io/eligius/functions/removeControllerFromElement.html "This operation removes the controller with the specified name from the given selected element.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/remove-controller-from-element.json))

- [removeElement](https://rolandzwaga.github.io/eligius/functions/removeElement.html "This operation removes the given selected element from the DOM.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/remove-element.json))

- [removePropertiesFromOperationData](https://rolandzwaga.github.io/eligius/functions/removePropertiesFromOperationData.html "This operation removes the given list of properties from the current operation data. It will also omit the property 'propertyNames' from the result.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/remove-properties-from-operation-data.json))

- [reparentElement](https://rolandzwaga.github.io/eligius/functions/reparentElement.html "This operation moves the given selected element to the new parent that is defined by the specified selector.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/reparent-element.json))

- [requestAction](https://rolandzwaga.github.io/eligius/functions/requestAction.html "This operation requests an action instance with the specified name and assigns it to the ") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/request-action.json))

- [resizeAction](https://rolandzwaga.github.io/eligius/functions/resizeAction.html) - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/resize-action.json))

- [selectElement](https://rolandzwaga.github.io/eligius/functions/selectElement.html "This operation selects one or more elements using the specified selector.  If ") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/select-element.json))

- [setElementAttributes](https://rolandzwaga.github.io/eligius/functions/setElementAttributes.html "This operation sets the specified set of attributes on the given selected element.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/set-element-attributes.json))

- [setElementContent](https://rolandzwaga.github.io/eligius/functions/setElementContent.html "This operation sets the specified content defined by the value assigned to the template property to the given selected element.  When the ") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/set-element-content.json))

- [setGlobalData](https://rolandzwaga.github.io/eligius/functions/setGlobalData.html "This operation copies the specified property values from the operationData to the global data.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/set-global-data.json))

- [setOperationData](https://rolandzwaga.github.io/eligius/functions/setOperationData.html "This operation assigns the specified properties to the current operation data. When override is set to true the properties replace the current operation data entirely.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/set-operation-data.json))

- [setStyle](https://rolandzwaga.github.io/eligius/functions/setStyle.html "This operation assigns the specified CSS style properties to the given selected element.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/set-style.json))

- [startAction](https://rolandzwaga.github.io/eligius/functions/startAction.html "This operation starts the specified action instance using the given action operation data.  The action operation data is first merged with the current operation data before it is passed on to the action. After the action has completed the action operation data properties are removed from the current operation data.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/start-action.json))

- [startLoop](https://rolandzwaga.github.io/eligius/functions/startLoop.html "This operation starts a loop using the given collection.  Each iteration the current item from the specified collection is assigned to the ") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/start-loop.json))

- [toggleClass](https://rolandzwaga.github.io/eligius/functions/toggleClass.html "This operation toggles the specfied class name on the given selected element.  Meaning, if the specified class name exists on the given element it will be removed, otherwise it will be added.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/toggle-class.json))

- [toggleElement](https://rolandzwaga.github.io/eligius/functions/toggleElement.html "This operation toggles the visibility of the given selected element.  Meaning, if the element is hidden, it will be made visible, otherwise it will be hidden.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/toggle-element.json))

- [wait](https://rolandzwaga.github.io/eligius/functions/wait.html "This operation waits for the specified amount of milliseconds.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/wait.json))

- [when](https://rolandzwaga.github.io/eligius/functions/when.html "When the given expression evaluates to false, subsequent operations will be skipped until an ") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/when.json))