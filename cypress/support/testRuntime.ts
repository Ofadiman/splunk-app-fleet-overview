import * as matchers from '@testing-library/jest-dom/matchers';
import { configure } from '@testing-library/react';
import {
    ASYMMETRIC_MATCHERS_OBJECT,
    GLOBAL_EXPECT,
    JestAsymmetricMatchers,
    JestChaiExpect,
    JestExtend,
    chai,
    setState,
} from '@vitest/expect';
import type { ExpectStatic } from '@vitest/expect';
import { disableComponentDoubles, enableComponentDoubles } from '../../src/testing/doubles';

export const { afterEach, beforeEach, describe, it } = globalThis;

if (Cypress.browser.name === 'webkit') {
    configure({ asyncUtilTimeout: Cypress.config('defaultCommandTimeout') });
}

chai.use(JestExtend);
chai.use(JestChaiExpect);
chai.use(JestAsymmetricMatchers);

export const expect = Object.assign(
    (value: unknown, message?: string) => chai.expect(value, message),
    chai.expect,
) as ExpectStatic;

Reflect.set(globalThis, ASYMMETRIC_MATCHERS_OBJECT, {});
Reflect.set(globalThis, GLOBAL_EXPECT, expect);
setState({ assertionCalls: 0 }, expect);
const chaiExpect = chai.expect as typeof chai.expect & {
    extend(target: ExpectStatic, definitions: typeof matchers): void;
};
chaiExpect.extend(expect, matchers);

beforeEach(enableComponentDoubles);
afterEach(disableComponentDoubles);
