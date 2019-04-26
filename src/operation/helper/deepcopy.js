function deepcopy(original) {
    return JSON.parse(JSON.stringify(original));
}

export default deepcopy;
