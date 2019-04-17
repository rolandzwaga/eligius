function loadJSON(jsonCache, operationData, eventBus) {
    const {url, cache} = operationData;

    if (cache && jsonCache[url]) {
        operationData.json = jsonCache[url];
        return operationData;
    }

    let { propertyName } = operationData;
    propertyName = propertyName || "json";

    return new Promise((resolve, reject)=> {
        fetch(url)
        .then((response)=> {
            operationData[propertyName] = response.body;
            resolve(operationData);
        })
        .catch(reject);
    });
}

export default loadJSON.bind(null, {});
