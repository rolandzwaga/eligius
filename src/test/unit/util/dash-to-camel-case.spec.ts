import { expect } from "chai";
import dashToCamelCase from "../../../util/dash-to-camel-case.ts";
import { describe, test } from "vitest";

describe.concurrent('dash-to-camel-case', () => {

    test('should convert a dashed string to a camel cased string', () => {
        // given
        const input = "i-am-very-dashed";

        // test
        const output = dashToCamelCase(input);

        // expect
        expect(output).to.equal("iAmVeryDashed");
    });

    test('should leave an already dashed string the same', () => {
        // given
        const input = "iAmVeryDashed";

        // test
        const output = dashToCamelCase(input);

        // expect
        expect(output).to.equal("iAmVeryDashed");
    });

    test('should leave normal string the same', () => {
        // given
        const input = "i have nothing to do with dashes";

        // test
        const output = dashToCamelCase(input);

        // expect
        expect(output).to.equal("i have nothing to do with dashes");
    });

});