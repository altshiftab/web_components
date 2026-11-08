import {after, before, test} from "node:test";
import assert from "node:assert/strict";
import {openHarness, type Page} from "./browser.ts";

let page: Page;

before(async () => {
    page = await openHarness("/test/pages/harness.html");
}, {timeout: 60_000});

after(async () => {
    await page?.close();
});

/*
 * What a consumer binds to is the event, so that is what these assert: it must carry the state the
 * switch moved *to*, and it is listened for on the document rather than the element, which only
 * works because the event is composed and so escapes the shadow root.
 */
test("a switch toggles and announces the state it moved to", async () => {
    const testCases: {name: string; start: boolean; by: string; toggled: boolean; events: boolean[]}[] = [
        {name: "click on", start: false, by: "click", toggled: true, events: [true]},
        {name: "click off", start: true, by: "click", toggled: false, events: [false]},
        {name: "enter", start: false, by: "Enter", toggled: true, events: [true]},
        {name: "space", start: false, by: " ", toggled: true, events: [true]},
        {name: "another key does nothing", start: false, by: "a", toggled: false, events: []},
    ];

    for (const testCase of testCases) {
        const result = await page.evaluate<{
            toggled: boolean;
            reflected: boolean;
            events: boolean[];
            role: string | null;
            tabIndex: number;
        }>(`harness.switchToggle({start: ${testCase.start}, by: ${JSON.stringify(testCase.by)}})`);

        assert.equal(result.toggled, testCase.toggled, `${testCase.name}: state`);
        assert.deepEqual(result.events, testCase.events, `${testCase.name}: events reaching the document`);
        // Reflected, so a consumer can style and query on the attribute rather than the property.
        assert.equal(result.reflected, testCase.toggled, `${testCase.name}: attribute reflects state`);
        assert.equal(result.role, "button", `${testCase.name}: role`);
        assert.equal(result.tabIndex, 0, `${testCase.name}: reachable by keyboard`);
    }
});

/*
 * The labelled switch names the side that is now selected, filling it into the event as it passes.
 * `value` is a getter over the current side, not something the element was handed, so the thing
 * worth asserting is that it follows the switch across repeated presses.
 */
test("the labelled switch reports the side now selected", async () => {
    const testCases: {name: string; clicks: number; details: {toggled: boolean; value: string}[]; value: string}[] = [
        {
            name: "one press selects the right label",
            clicks: 1,
            details: [{toggled: true, value: "on"}],
            value: "on",
        },
        {
            name: "a second press comes back to the left label",
            clicks: 2,
            details: [{toggled: true, value: "on"}, {toggled: false, value: "off"}],
            value: "off",
        },
    ];

    for (const testCase of testCases) {
        const result = await page.evaluate<{
            details: {toggled: boolean; value: string}[];
            toggledRight: boolean;
            value: string;
        }>(`harness.switchLabelled({left: "off", right: "on", clicks: ${testCase.clicks}})`);

        assert.deepEqual(result.details, testCase.details, testCase.name);
        assert.equal(result.value, testCase.value, `${testCase.name}: the element agrees with its last event`);
        assert.equal(result.toggledRight, testCase.details.at(-1)?.toggled, `${testCase.name}: side reflected`);
    }
});

test("a plain switch leaves the event's value unset", async () => {
    const result = await page.evaluate<{values: (string | null)[]}>("harness.switchPlainValue()");
    assert.deepEqual(result.values, [null], "nothing fills a value in when there are no labels");
});
