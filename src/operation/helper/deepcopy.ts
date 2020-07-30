function deepcopy(original: any) {
  return JSON.parse(JSON.stringify(original));
}

export default deepcopy;
