# Operations

This is a list of all the available operations with links to their respective documentation

- [addClass](https://rolandzwaga.github.io/eligius/variables/addClass.html "This operation adds the specified class name to the specified selected element.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/add-class.json))

- [addControllerToElement](https://rolandzwaga.github.io/eligius/variables/addControllerToElement.html "This operation adds the specified controller instance to the given selected element.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/add-controller-to-element.json))

- [addGlobalsToOperation](https://rolandzwaga.github.io/eligius/variables/addGlobalsToOperation.html "This operation adds the specified global property names to the current operation data. It finally removes the `globalProperties` property from the current operation data.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/add-globals-to-operation.json))

- [animate](https://rolandzwaga.github.io/eligius/variables/animate.html "This operation animates the specified selected element with the given [jQuery animation](https://api.jquery.com/animate/) properties, duration and easing. It resolves after the animation completes, or immediately when the selected element set is empty.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/animate.json))

- [animateWithClass](https://rolandzwaga.github.io/eligius/variables/animateWithClass.html "This operation adds the specified class name to the specified selected element and assumes that this class triggers and animation on the selected element. It then waits for this animation to complete before it resolves.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/animate-with-class.json))

- [announceToScreenReader](https://rolandzwaga.github.io/eligius/variables/announceToScreenReader.html "Announces a message to screen readers using an ARIA live region.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/announce-to-screen-reader.json))

- [breakForEach](https://rolandzwaga.github.io/eligius/variables/breakForEach.html "This operation should only be used within a loop, so between a forEach and endForEach operation. This operation immediately moves to the loop end index, effectively stopping the loop.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/break-for-each.json))

- [broadcastEvent](https://rolandzwaga.github.io/eligius/variables/broadcastEvent.html "This operation broadcasts the given event through the eventbus, along with the event arguments and optional event topic.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/broadcast-event.json))

- [calc](https://rolandzwaga.github.io/eligius/variables/calc.html "This operation calculates the given left and right hand operands using the specified operator.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/calc.json))

- [clearElement](https://rolandzwaga.github.io/eligius/variables/clearElement.html "This operation removes all of the children from the given selected element.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/clear-element.json))

- [clearGlobals](https://rolandzwaga.github.io/eligius/variables/clearGlobals.html "Removes every value from the global data store that operations such as `setGlobalData` and `addGlobalsToOperation` share.")

- [clearOperationData](https://rolandzwaga.github.io/eligius/variables/clearOperationData.html "This operation removes all of the properties on the current operation date. Or, if the `properties` property is set only removes the properties defined by that list.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/clear-operation-data.json))

- [clearStorage](https://rolandzwaga.github.io/eligius/variables/clearStorage.html "Clears data from browser storage (localStorage or sessionStorage).") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/clear-storage.json))

- [compareDate](https://rolandzwaga.github.io/eligius/variables/compareDate.html "Compares two dates. comparison: -1 (before), 0 (equal), 1 (after)") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/compare-date.json))

- [concatenateStrings](https://rolandzwaga.github.io/eligius/variables/concatenateStrings.html "Concatenates multiple strings with an optional separator.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/concatenate-strings.json))

- [continueForEach](https://rolandzwaga.github.io/eligius/variables/continueForEach.html "This operation should only be used within a loop, so between a forEach and endForEach operation. This operation immediately moves to the next loop index, effectively canceling the rest of the operations in the current iteration.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/continue-for-each.json))

- [createElement](https://rolandzwaga.github.io/eligius/variables/createElement.html "This operation creates the DOM element described by the given elementName and attributes and assigns the instance to the `template` property on the current operation data.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/create-element.json))

- [customFunction](https://rolandzwaga.github.io/eligius/variables/customFunction.html "This operation retrieves a custom function defined by the given system name and invokes it with the current operation data and eventbus.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/custom-function.json))

- [endAction](https://rolandzwaga.github.io/eligius/variables/endAction.html "This operation invokes the EndableAction.end method on the specified action instance.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/end-action.json))

- [endForEach](https://rolandzwaga.github.io/eligius/variables/endForEach.html "This operation checks if the current loop should end or start the next iteration.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/end-for-each.json))

- [endWhen](https://rolandzwaga.github.io/eligius/variables/endWhen.html "This operation cleans up after the when/otherwise/endWhen control flow ends.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/end-when.json))

- [extendController](https://rolandzwaga.github.io/eligius/variables/extendController.html "Extends the current controller with given extension.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/extend-controller.json))

- [filterArray](https://rolandzwaga.github.io/eligius/variables/filterArray.html "Filters an array based on property equality or custom predicate function.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/filter-array.json))

- [findInArray](https://rolandzwaga.github.io/eligius/variables/findInArray.html "Finds the first element in an array matching criteria.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/find-in-array.json))

- [forEach](https://rolandzwaga.github.io/eligius/variables/forEach.html "This operation iterates over the given collection.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/for-each.json))

- [formatDate](https://rolandzwaga.github.io/eligius/variables/formatDate.html "Formats a date using Intl.DateTimeFormat or simple patterns.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/format-date.json))

- [formatText](https://rolandzwaga.github.io/eligius/variables/formatText.html "Transforms text using format operations: uppercase, lowercase, capitalize, titlecase, or trim.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/format-text.json))

- [getAttributesFromElement](https://rolandzwaga.github.io/eligius/variables/getAttributesFromElement.html "This operation retrieves the values for the specified attribute names from the given selected element.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/get-attributes-from-element.json))

- [getControllerFromElement](https://rolandzwaga.github.io/eligius/variables/getControllerFromElement.html "This operation retrieves the controller instance with the specified name that is assigned to the given selected element.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/get-controller-from-element.json))

- [getControllerInstance](https://rolandzwaga.github.io/eligius/variables/getControllerInstance.html "This operation retrieves an instance of the given controller name. It assigns this instance to the `controllerInstance` property on the current operation data") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/get-controller-instance.json))

- [getCurrentTime](https://rolandzwaga.github.io/eligius/variables/getCurrentTime.html "Gets the current time as timestamp and Date object.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/get-current-time.json))

- [getElementDimensions](https://rolandzwaga.github.io/eligius/variables/getElementDimensions.html "This operation calculates the width and height of the given selected element. It assigns this struct to the dimensions property on the current operation data. Optionally the width and height can be modified using the given modifier string.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/get-element-dimensions.json))

- [getFocusedElement](https://rolandzwaga.github.io/eligius/variables/getFocusedElement.html "Gets the currently focused element.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/get-focused-element.json))

- [getFormData](https://rolandzwaga.github.io/eligius/variables/getFormData.html "Extracts all input, select, and textarea values from form element into operation data.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/get-form-data.json))

- [getImport](https://rolandzwaga.github.io/eligius/variables/getImport.html "This operation retrieves the import specified by the given `systemName` and assigns it to the `importedInstance` property on the current operaton date.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/get-import.json))

- [getQueryParams](https://rolandzwaga.github.io/eligius/variables/getQueryParams.html "This operation retrieves the current query parameters from the browser's address bar and places them on the returned operation data.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/get-query-params.json))

- [getScrollPosition](https://rolandzwaga.github.io/eligius/variables/getScrollPosition.html "Gets the current scroll position of the viewport.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/get-scroll-position.json))

- [getTextContent](https://rolandzwaga.github.io/eligius/variables/getTextContent.html "Extracts text content from element, stripping all HTML markup.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/get-text-content.json))

- [httpDelete](https://rolandzwaga.github.io/eligius/variables/httpDelete.html "Performs an HTTP DELETE request to the specified URL.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/http-delete.json))

- [httpPost](https://rolandzwaga.github.io/eligius/variables/httpPost.html "Performs an HTTP POST request to the specified URL.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/http-post.json))

- [httpPut](https://rolandzwaga.github.io/eligius/variables/httpPut.html "Performs an HTTP PUT request to the specified URL.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/http-put.json))

- [invokeObjectMethod](https://rolandzwaga.github.io/eligius/variables/invokeObjectMethod.html "This operation invokes the specified method on the given object with the given optional arguments and assigns the result to the `methodResult` operationdata property.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/invoke-object-method.json))

- [isElementInViewport](https://rolandzwaga.github.io/eligius/variables/isElementInViewport.html "Checks if an element is currently visible within the viewport.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/is-element-in-viewport.json))

- [loadFromStorage](https://rolandzwaga.github.io/eligius/variables/loadFromStorage.html "Loads data from browser storage (localStorage or sessionStorage).") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/load-from-storage.json))

- [loadJson](https://rolandzwaga.github.io/eligius/variables/loadJson.html "This operation loads a JSON file from the specified url and assigns it to the json property on the current operation data.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/load-json.json))

- [log](https://rolandzwaga.github.io/eligius/variables/log.html "This operation logs the specified value, or, when no logValue property has been assigned it will log the current operation data, global data and scope to the console") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/log.json))

- [mapArray](https://rolandzwaga.github.io/eligius/variables/mapArray.html "Transforms each element of an array using a mapping function.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/map-array.json))

- [math](https://rolandzwaga.github.io/eligius/variables/math.html "This operation performs the given math function with the specified arguments.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/math.json))

- [otherwise](https://rolandzwaga.github.io/eligius/variables/otherwise.html "If the preceeding when operation evaluates to `true` subsequent operations will be skipped until an endWhen operation is encountered.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/otherwise.json))

- [removeClass](https://rolandzwaga.github.io/eligius/variables/removeClass.html "This operation removes the spcified class name from the given selected element.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/remove-class.json))

- [removeControllerFromElement](https://rolandzwaga.github.io/eligius/variables/removeControllerFromElement.html "This operation removes the controller with the specified name from the given selected element.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/remove-controller-from-element.json))

- [removeElement](https://rolandzwaga.github.io/eligius/variables/removeElement.html "This operation removes the given selected element from the DOM.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/remove-element.json))

- [removePropertiesFromOperationData](https://rolandzwaga.github.io/eligius/variables/removePropertiesFromOperationData.html "This operation removes the given list of properties from the current operation data. It will also remove the property `propertyNames` from the result.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/remove-properties-from-operation-data.json))

- [reparentElement](https://rolandzwaga.github.io/eligius/variables/reparentElement.html "This operation moves the given selected element to the new parent that is defined by the specified `newParentSelector`. jQuery data, event handlers and attached controllers are preserved.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/reparent-element.json))

- [replaceString](https://rolandzwaga.github.io/eligius/variables/replaceString.html "Replaces occurrences of a pattern in a string (alias for replaceText for string context).") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/replace-string.json))

- [replaceText](https://rolandzwaga.github.io/eligius/variables/replaceText.html "Finds and replaces text using literal string or regex pattern.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/replace-text.json))

- [requestAction](https://rolandzwaga.github.io/eligius/variables/requestAction.html "This operation requests an action instance with the specified name and assigns it to the `actionInstance` property on the current operation data.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/request-action.json))

- [saveToStorage](https://rolandzwaga.github.io/eligius/variables/saveToStorage.html "Saves data to browser storage (localStorage or sessionStorage).") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/save-to-storage.json))

- [scrollToElement](https://rolandzwaga.github.io/eligius/variables/scrollToElement.html "Scrolls the viewport to bring the selected element into view.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/scroll-to-element.json))

- [scrollToPosition](https://rolandzwaga.github.io/eligius/variables/scrollToPosition.html "Scrolls the viewport to a specific x,y coordinate position.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/scroll-to-position.json))

- [selectElement](https://rolandzwaga.github.io/eligius/variables/selectElement.html "This operation selects one or more elements using the specified selector.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/select-element.json))

- [setData](https://rolandzwaga.github.io/eligius/variables/setData.html "This operation assigns the specified properties to the specified data targets.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/set-data.json))

- [setElementAttributes](https://rolandzwaga.github.io/eligius/variables/setElementAttributes.html "This operation sets the specified set of attributes on the given selected element.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/set-element-attributes.json))

- [setElementContent](https://rolandzwaga.github.io/eligius/variables/setElementContent.html "This operation sets the specified content defined by the value assigned to the template property to the given selected element.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/set-element-content.json))

- [setFocus](https://rolandzwaga.github.io/eligius/variables/setFocus.html "Sets focus to the selected element.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/set-focus.json))

- [setFormValue](https://rolandzwaga.github.io/eligius/variables/setFormValue.html "Sets the value of an input, select, or textarea element.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/set-form-value.json))

- [setGlobalData](https://rolandzwaga.github.io/eligius/variables/setGlobalData.html "This operation copies the specified properties from the operationData to the global data.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/set-global-data.json))

- [setOperationData](https://rolandzwaga.github.io/eligius/variables/setOperationData.html "This operation assigns the specified properties to the current operation data. When override is set to true the properties replace the current operation data entirely.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/set-operation-data.json))

- [setStyle](https://rolandzwaga.github.io/eligius/variables/setStyle.html "This operation assigns the specified CSS style properties to the given selected element.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/set-style.json))

- [setVariable](https://rolandzwaga.github.io/eligius/variables/setVariable.html "This operation sets a variable with the specified name on the scope with the specified value.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/set-variable.json))

- [sortArray](https://rolandzwaga.github.io/eligius/variables/sortArray.html "Sorts an array by property, natural order, or custom comparator function.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/sort-array.json))

- [splitString](https://rolandzwaga.github.io/eligius/variables/splitString.html "Splits a string into an array by delimiter (string or regex).") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/split-string.json))

- [startAction](https://rolandzwaga.github.io/eligius/variables/startAction.html "This operation starts the specified action instance using the given action operation data.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/start-action.json))

- [substringText](https://rolandzwaga.github.io/eligius/variables/substringText.html "Extracts a substring from text between start and end indices.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/substring-text.json))

- [toggleClass](https://rolandzwaga.github.io/eligius/variables/toggleClass.html "This operation toggles the specfied class name on the given selected element.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/toggle-class.json))

- [toggleElement](https://rolandzwaga.github.io/eligius/variables/toggleElement.html "This operation toggles the visibility of the given selected element.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/toggle-element.json))

- [toggleFormElement](https://rolandzwaga.github.io/eligius/variables/toggleFormElement.html "Enables or disables form input elements (inputs, selects, textareas, buttons).") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/toggle-form-element.json))

- [validateForm](https://rolandzwaga.github.io/eligius/variables/validateForm.html "Validates form fields against HTML5 validation and custom rules.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/validate-form.json))

- [wait](https://rolandzwaga.github.io/eligius/variables/wait.html "This operation waits for the specified amount of milliseconds.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/wait.json))

- [when](https://rolandzwaga.github.io/eligius/variables/when.html "When the given expression evaluates to false, subsequent operations will be skipped until an endWhen or otherwise operation is encountered.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/when.json))