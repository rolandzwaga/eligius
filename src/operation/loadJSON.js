function loadJSON(jsonCache, operationData, eventBus) {
    const {url, cache} = operationData;

    let { propertyName } = operationData;
    propertyName = propertyName || "json";

    if (cache && jsonCache[url]) {
        operationData[propertyName] = jsonCache[url];
        return operationData;
    }


    return new Promise((resolve, reject)=> {
        fetch(url)
        .then((response)=> {
            jsonCache[url] = operationData[propertyName] = response.body;
            resolve(operationData);
        })
        .catch(reject);
    });
}

export default loadJSON.bind(null, {});
