import {after, before, test} from "node:test";
import assert from "node:assert/strict";
import {Page} from "./browser.ts";

let page: Page;

before(async () => {
    page = await Page.open("/test/pages/harness.html");
}, {timeout: 60_000});

after(async () => {
    await page?.close();
});

/*
 * The button is form-associated: it is not a <button>, so nothing about submitting or resetting a
 * form comes for free. Every case below is counted on the form rather than read off the element.
 */
test("a button drives the form it is associated with", async () => {
    const testCases: {
        name: string;
        type: string;
        disabled: boolean;
        submits: number;
        resets: number;
        fieldValue: string;
    }[] = [
        {name: "submit", type: "submit", disabled: false, submits: 1, resets: 0, fieldValue: "changed"},
        {name: "reset", type: "reset", disabled: false, submits: 0, resets: 1, fieldValue: "typed"},
        {name: "button does neither", type: "button", disabled: false, submits: 0, resets: 0, fieldValue: "changed"},
        {name: "disabled submit", type: "submit", disabled: true, submits: 0, resets: 0, fieldValue: "changed"},
        {name: "disabled reset", type: "reset", disabled: true, submits: 0, resets: 0, fieldValue: "changed"},
    ];

    for (const testCase of testCases) {
        const result = await page.evaluate<{
            submits: number;
            resets: number;
            fieldValue: string;
            role: string | null;
            reflectsDisabled: boolean;
        }>(`harness.button({type: ${JSON.stringify(testCase.type)}, disabled: ${testCase.disabled}})`);

        assert.equal(result.submits, testCase.submits, `${testCase.name}: submits`);
        assert.equal(result.resets, testCase.resets, `${testCase.name}: resets`);
        // A reset that fired puts the field back to its default; one that did not, does not.
        assert.equal(result.fieldValue, testCase.fieldValue, `${testCase.name}: field value`);
        assert.equal(result.role, "button", `${testCase.name}: role`);
        assert.equal(result.reflectsDisabled, testCase.disabled, `${testCase.name}: disabled reflected`);
    }
});

/*
 * Enter acts on keydown and Space on keyup, with Space's keydown suppressed so the page does not
 * scroll under the press. Getting that wrong is invisible with a mouse and immediate with a
 * keyboard, which is exactly the kind of thing that ships.
 */
test("a button answers the keyboard the way a native one does", async () => {
    const testCases: {
        name: string;
        key: string;
        disabled: boolean;
        submits: number;
        keydownDefaultPrevented: boolean;
    }[] = [
        {name: "enter activates", key: "Enter", disabled: false, submits: 1, keydownDefaultPrevented: false},
        {name: "space activates on keyup", key: " ", disabled: false, submits: 1, keydownDefaultPrevented: true},
        {name: "another key does nothing", key: "a", disabled: false, submits: 0, keydownDefaultPrevented: false},
        {name: "disabled ignores enter", key: "Enter", disabled: true, submits: 0, keydownDefaultPrevented: false},
        {name: "disabled ignores space", key: " ", disabled: true, submits: 0, keydownDefaultPrevented: false},
    ];

    for (const testCase of testCases) {
        const result = await page.evaluate<{submits: number; keydownDefaultPrevented: boolean}>(
            `harness.buttonKey({key: ${JSON.stringify(testCase.key)}, disabled: ${testCase.disabled}})`,
        );

        assert.equal(result.submits, testCase.submits, `${testCase.name}: submits`);
        assert.equal(
            result.keydownDefaultPrevented,
            testCase.keydownDefaultPrevented,
            `${testCase.name}: space must not scroll the page on keydown`,
        );
    }
});

/*
 * A disabled press has to be stopped, not merely ignored. `button.click()` cannot show this: the
 * platform makes click() a no-op on a disabled form-associated element, so it never reaches the
 * element's handler at all. A dispatched click does -- as a click on slotted content would -- and
 * the guard has to catch it and stop it going any further.
 */
test("a disabled button stops a dispatched click rather than ignoring it", async () => {
    const testCases: {name: string; disabled: boolean; submits: number; reachedOuterListener: number}[] = [
        {name: "enabled", disabled: false, submits: 1, reachedOuterListener: 1},
        {name: "disabled", disabled: true, submits: 0, reachedOuterListener: 0},
    ];

    for (const testCase of testCases) {
        const result = await page.evaluate<{submits: number; reachedOuterListener: number}>(
            `harness.buttonDispatchedClick({disabled: ${testCase.disabled}})`,
        );

        assert.equal(result.submits, testCase.submits, `${testCase.name}: submits`);
        assert.equal(
            result.reachedOuterListener,
            testCase.reachedOuterListener,
            `${testCase.name}: a consumer's own click handler`,
        );
    }
});

test("formMethod=dialog closes the dialog and reports formAction back", async () => {
    const testCases: {name: string; formAction: string; disabled: boolean; open: boolean; returnValue: string}[] = [
        {name: "closes with its action", formAction: "confirm", disabled: false, open: false, returnValue: "confirm"},
        {name: "empty action still closes", formAction: "", disabled: false, open: false, returnValue: ""},
        {name: "disabled leaves it open", formAction: "confirm", disabled: true, open: true, returnValue: ""},
    ];

    for (const testCase of testCases) {
        const result = await page.evaluate<{open: boolean; returnValue: string}>(
            `harness.buttonDialog({formAction: ${JSON.stringify(testCase.formAction)}, disabled: ${testCase.disabled}})`,
        );

        assert.equal(result.open, testCase.open, `${testCase.name}: dialog open`);
        assert.equal(result.returnValue, testCase.returnValue, `${testCase.name}: returnValue`);
    }
});
