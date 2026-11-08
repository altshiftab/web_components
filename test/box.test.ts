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
 * The box is nearly all styling, so what is worth pinning is its interface: the flags it reflects,
 * which consuming sites style and query on, and the parts they reach through. A reflected property
 * that stops reflecting breaks a selector in another repository, silently.
 */
test("a box reflects the flags it is given", async () => {
    // Property names, not attribute names: setting the property is what reflection has to answer.
    const testCases: {name: string; properties: string[]}[] = [
        {name: "none", properties: []},
        {name: "animated", properties: ["animated"]},
        {name: "selectable", properties: ["selectable"]},
        {name: "contracted", properties: ["contracted"]},
        {name: "unbordered", properties: ["unbordered"]},
        {name: "textBox", properties: ["textBox"]},
        {name: "several at once", properties: ["animated", "unbordered", "contracted"]},
    ];

    for (const testCase of testCases) {
        const result = await page.evaluate<{reflected: string[]; slotted: string[]; hasPart: boolean}>(
            `harness.box(${JSON.stringify(testCase.properties)})`,
        );

        assert.deepEqual(result.reflected, testCase.properties, `${testCase.name}: reflected`);
        assert.deepEqual(result.slotted, ["content"], `${testCase.name}: light DOM passes through the slot`);
        // Consuming sites style the interior through ::part(box-container).
        assert.equal(result.hasPart, true, `${testCase.name}: box-container part is exposed`);
    }
});
