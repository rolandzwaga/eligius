import { expect } from 'chai';
import { afterEach, beforeEach, describe, test, type TestContext } from 'vitest';
import {
  getQueryParams,
  type IGetQueryParamsOperationData,
} from '../../../operation/get-query-params.ts';
import { applyOperation } from '../../../util/apply-operation.ts';
import type { ExtractReturnedOperationData } from 'operation/types.ts';

type GetQueryParamsSuiteContext = {
  location: any;
} & TestContext;

describe.concurrent<GetQueryParamsSuiteContext>('getQueryParams', () => {
  beforeEach<GetQueryParamsSuiteContext>((context) => {
    context.location = window.location;
    delete (window as any).location;
    (window as any).location = {
      search: '',
    };
  });
  afterEach<GetQueryParamsSuiteContext>((context) => {
    (window as any).location = context.location;
  });
  test('should retrieve the query params and put them on the resulting operation data', () => {
    /// given
    (window as any).location = {
      search: '?test=true&test2=false',
    };
    const operationData = {};

    // test
    const result = applyOperation(
      getQueryParams,
      operationData
    );

    expect(result).to.eql({ queryParams: { test: 'true', test2: 'false' } });
  });
  test('should add an empty queryParams object to the operation data when no query params are present', () => {
    /// given
    (window as any).location = {
      search: '',
    };
    const operationData = {};

    // test
    const result = applyOperation(
      getQueryParams,
      operationData
    );

    expect(result).to.eql({ queryParams: {} });
  });
  test('should add the default values when query params not set', () => {
    /// given
    (window as any).location = {
      search: 'test=true',
    };
    const operationData: IGetQueryParamsOperationData = {
      defaultValues: { test: 'true', test2: 'foo' },
    };

    // test
    const result = applyOperation(
      getQueryParams,
      operationData
    );

    expect(result).to.eql({ queryParams: { test: 'true', test2: 'foo' } });
  });
});
