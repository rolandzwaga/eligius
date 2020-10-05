function deepcopy<T>(original: T): T {
  return JSON.parse(JSON.stringify(original)) as T;
}

export default deepcopy;
