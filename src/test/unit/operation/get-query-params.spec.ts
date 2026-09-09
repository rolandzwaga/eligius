import {
  getQueryParams,
  type IGetQueryParamsOperationData,
} from '@operation/get-query-params.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {afterEach, describe, expect, test} from 'vitest';

// `window.location` cannot be replaced (non-configurable on the jsdom window),
// so the query string is set through the real History API.
const setSearch = (search: string) =>
  window.history.replaceState(null, '', search ? `/?${search}` : '/');

describe('getQueryParams', () => {
  afterEach(() => {
    setSearch('');
  });
  test('should retrieve the query params and put them on the resulting operation data', () => {
    /// given
    setSearch('test=true&test2=false');
    const operationData = {};

    // test
    const result = applyOperation(getQueryParams, operationData);

    expect(result).toEqual({queryParams: {test: 'true', test2: 'false'}});
  });
  test('should add an empty queryParams object to the operation data when no query params are present', () => {
    /// given
    setSearch('');
    const operationData = {};

    // test
    const result = applyOperation(getQueryParams, operationData);

    expect(result).toEqual({queryParams: {}});
  });
  test('should add the default values when query params not set', () => {
    /// given
    setSearch('test=true');
    const operationData: IGetQueryParamsOperationData = {
      defaultValues: {test: 'true', test2: 'foo'},
    };

    // test
    const result = applyOperation(getQueryParams, operationData);

    expect(result).toEqual({queryParams: {test: 'true', test2: 'foo'}});
  });

  test('should remove the defaultValue property from the operation data', () => {
    /// given
    setSearch('test=true');
    const operationData: IGetQueryParamsOperationData = {
      defaultValues: {test: 'true', test2: 'foo'},
    };

    // test
    const result = applyOperation(getQueryParams, operationData);

    expect('defaultValues' in result).toBe(false);
  });
});
