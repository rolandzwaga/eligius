import { expect } from 'chai';
import { suite } from 'uvu';
import {
  getQueryParams,
  IGetQueryParamsOperationData,
} from '../../../operation/get-query-params';
import { applyOperation } from '../../../util/apply-operation';

interface GetQueryParamsSuiteContext {
  location: any;
}

const GetQueryParamsSuite = suite<GetQueryParamsSuiteContext>('getQueryParams');

GetQueryParamsSuite.before((context) => {
  context.location = window.location;
  delete (window as any).location;
  (window as any).location = {
    search: '',
  };
});

GetQueryParamsSuite.after((context) => {
  (window as any).location = context.location;
});

GetQueryParamsSuite(
  'should retrieve the query params and put them on the resulting operation data',
  () => {
    /// given
    (window as any).location = {
      search: '?test=true&test2=false',
    };
    const operationData = {};

    // test
    const result = applyOperation<IGetQueryParamsOperationData>(
      getQueryParams,
      operationData
    );

    expect(result).to.eql({ queryParams: { test: 'true', test2: 'false' } });
  }
);

GetQueryParamsSuite(
  'should add an empty queryParams object to the operation data when no query params are present',
  () => {
    /// given
    (window as any).location = {
      search: '',
    };
    const operationData = {};

    // test
    const result = applyOperation<IGetQueryParamsOperationData>(
      getQueryParams,
      operationData
    );

    expect(result).to.eql({ queryParams: {} });
  }
);

GetQueryParamsSuite(
  'should add the default values when query params not set',
  () => {
    /// given
    (window as any).location = {
      search: 'test=true',
    };
    const operationData: IGetQueryParamsOperationData = {
      defaultValues: { test: 'true', test2: 'foo' },
    };

    // test
    const result = applyOperation<IGetQueryParamsOperationData>(
      getQueryParams,
      operationData
    );

    expect(result).to.eql({ queryParams: { test: 'true', test2: 'foo' } });
  }
);

GetQueryParamsSuite.run();
