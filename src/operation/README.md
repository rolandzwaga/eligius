# Operations

This is a list of all the available operations with links to their respective documentation

- [addClass](https://rolandzwaga.github.io/eligius/functions/addClass.html "This operation adds the specified class name to the specified selected element.")

- [addControllerToElement](https://rolandzwaga.github.io/eligius/functions/addControllerToElement.html "This operation adds the specified controller instance to the specified selected element.")

- [animate](https://rolandzwaga.github.io/eligius/functions/animate.html "This operation animates the specified selected element with the given jQuery animation settings. It resolves after the animation completes.")

- [animateWithClass](https://rolandzwaga.github.io/eligius/functions/animateWithClass.html "This operation adds the specified class name to the specified selected element and assumes that this class triggers and animation on the selected element. It then waits for this animation to complete until it resolves.")

- [broadcastEvent](https://rolandzwaga.github.io/eligius/functions/broadcastEvent.html "This operation broadcasts the given event through the eventbus, along with the event argumetns and optional event topic.")

- [calc](https://rolandzwaga.github.io/eligius/functions/calc.html "This operation calculates the given left and right hand sides using the specified operator.")

- [clearElement](https://rolandzwaga.github.io/eligius/functions/clearElement.html "This operation removes all of the children from the specified selected element.")

- [clearOperationData](https://rolandzwaga.github.io/eligius/functions/clearOperationData.html "This operation removes all of the properties on the current operation date. Or, if the properties property is set only removes the properties defined by that list.")

- [createElement](https://rolandzwaga.github.io/eligius/functions/createElement.html "This operation creates the DOM element defined by the given properties and assigns the instance to the give property name on the current operation data. The property name defaults to 'template'.")

- [customFunction](https://rolandzwaga.github.io/eligius/functions/customFunction.html "This operation retrieves a custom function defined by the specified system name and invokes it with the current operation data and eventbus.")

- [endAction](https://rolandzwaga.github.io/eligius/functions/endAction.html "This operation invokes the end() method on the specified action instance.  The action operation data is first merged with the current operation data before it is passed on to the action. After the action has completed the action operation data properties are removed from the current operation data.")

- [endLoop](https://rolandzwaga.github.io/eligius/functions/endLoop.html "This operation checks if the current loop should end or start the next iteration.")

- [endWhen](https://rolandzwaga.github.io/eligius/functions/endWhen.html)

- [extendController](https://rolandzwaga.github.io/eligius/functions/extendController.html)

- [getControllerFromElement](https://rolandzwaga.github.io/eligius/functions/getControllerFromElement.html "This operation retrieves the controller instance with the specified name from the specified selected element.")

- [getControllerInstance](https://rolandzwaga.github.io/eligius/functions/getControllerInstance.html "This operation retrieves an instance of the given controller name. It assigns this instance to the ")

- [getElementDimensions](https://rolandzwaga.github.io/eligius/functions/getElementDimensions.html "This operation calculates the width and height of the specified selected element. It assigns this struct to the dimensions property on the current operation data. Optionally the width and height can be tweaked using the given modifier string.  The modifier string is formatted in the following way:  <operator><amount><optional-side><optional-precentage>|<ratio-definition>  Where the ratio modifier is formatted in the following way: <side>[ar=<ratio-left>-<ratio-right>]  For example, this modifier '+100h|w[ar=8-1]' will modifiy the dimensions like this: it will add a value of 100 to the height and modify the width by a ration of 8 to 1 relative to the height.")

- [getImport](https://rolandzwaga.github.io/eligius/functions/getImport.html "This operation retrieves the import specified by the given system name and assigns it to the importedInstance property on the current operaton date.")

- [getQueryParams](https://rolandzwaga.github.io/eligius/functions/getQueryParams.html "This operation retrieves the current query parameters from the browser's address bar and places them on the returned operation data.")

- [invokeObjectMethod](https://rolandzwaga.github.io/eligius/functions/invokeObjectMethod.html "This operation invokes the specified method on the given object with the optional specified arguments and assigns the result to the ")

- [loadJSON](https://rolandzwaga.github.io/eligius/functions/loadJSON.html "This operation loads a JSON file from the specified url and assigns it to the json property on the current operation data.  If the cache property is set to true and a cached value already exists, this is assigned instead of re-retrieving it from the url.")

- [log](https://rolandzwaga.github.io/eligius/functions/log.html "This operation logs the current operation data and context.")

- [math](https://rolandzwaga.github.io/eligius/functions/math.html "This operation performs the given math function with the specified arguments.")

- [otherwise](https://rolandzwaga.github.io/eligius/functions/otherwise.html)

- [removeClass](https://rolandzwaga.github.io/eligius/functions/removeClass.html "This operation removes the spcified class name from the specified selected element.")

- [removeControllerFromElement](https://rolandzwaga.github.io/eligius/functions/removeControllerFromElement.html "This operation removes the controller with the specified name from the specified selected element.")

- [removeElement](https://rolandzwaga.github.io/eligius/functions/removeElement.html "This operation removes the specified selected element from the DOM.")

- [removePropertiesFromOperationData](https://rolandzwaga.github.io/eligius/functions/removePropertiesFromOperationData.html "This operation removes the given list of properties from the current operation data. It will also omit the property 'propertyNames' from the result.")

- [reparentElement](https://rolandzwaga.github.io/eligius/functions/reparentElement.html "This operation moves the specified selected element to the new parent that is defined by the specified selector.")

- [requestAction](https://rolandzwaga.github.io/eligius/functions/requestAction.html "This operation requests an action instance with the specified name and assigns it to the actionInstance property on the current operation data.")

- [resizeAction](https://rolandzwaga.github.io/eligius/functions/resizeAction.html)

- [selectElement](https://rolandzwaga.github.io/eligius/functions/selectElement.html "This operation selects one or more elements using the specified selector.  If useSelectedElementAsRoot is set to true and a valid DOM element is assigned to the current operation data's ")

- [setElementAttributes](https://rolandzwaga.github.io/eligius/functions/setElementAttributes.html "This operation sets the given set of attributes on the specified selected element.")

- [setElementContent](https://rolandzwaga.github.io/eligius/functions/setElementContent.html "This operation sets the specified content defined by the value assigned to the template property to the specified selected element.  When the insertionType is set to 'overwrite' the contents of the selected element are replaced by the given template. When set to 'append' the new content will be inserted after the current content. When set to 'prepend' the new content will be inserted before the current content.")

- [setGlobalData](https://rolandzwaga.github.io/eligius/functions/setGlobalData.html "This operation copies the specified values from the operationData to the global data.")

- [setOperationData](https://rolandzwaga.github.io/eligius/functions/setOperationData.html "This operation assigns the specified properties to the current operation data. When override is set to true the properties replace the current operation data entirely.")

- [setStyle](https://rolandzwaga.github.io/eligius/functions/setStyle.html "This operation assigns the specified CSS style properties to the specified selected element.")

- [startAction](https://rolandzwaga.github.io/eligius/functions/startAction.html "This operation starts the specified action instance using the specified action operation data.  The action operation data is first merged with the current operation data before it is passed on to the action. After the action has completed the action operation data properties are removed from the current operation data.")

- [startLoop](https://rolandzwaga.github.io/eligius/functions/startLoop.html "This operation starts a loop using the given collection.  Each iteration the current item from the specified collection is assigned to the ")

- [toggleClass](https://rolandzwaga.github.io/eligius/functions/toggleClass.html "This operation toggles the specfied class name on the specified selected element.")

- [toggleElement](https://rolandzwaga.github.io/eligius/functions/toggleElement.html "This operation toggles the visibility of the specified selected element")

- [wait](https://rolandzwaga.github.io/eligius/functions/wait.html "This operation waits for the specified amount of milliseconds.")

- [when](https://rolandzwaga.github.io/eligius/functions/when.html "When the given expression evaluates to false, subsequent operations will be skipped until an ")