import {after, before, test} from "node:test";
import assert from "node:assert/strict";
import {Page} from "./browser.ts";

const BREAKPOINT = 1280;

interface HeaderState {
    compact: boolean;
    hasNav: boolean;
    navMenu: boolean;
    navBar: boolean;
    slotted: string[];
}

let page: Page;

before(async () => {
    page = await Page.open("/test/pages/harness.html");
}, {timeout: 60_000});

after(async () => {
    await page?.close();
});

/*
 * The header decides its own layout from the viewport, and the rule has a subtlety: `compact` set
 * on the element at mount pins it, while one left alone follows the width and goes on following it.
 * That distinction is the whole of connectedCallback, and nothing about it is visible from reading
 * the attribute once.
 */
test("the header follows the viewport unless it was told what to be", async () => {
    const testCases: {name: string; width: number; compact: boolean}[] = [
        {name: "wide", width: BREAKPOINT + 200, compact: false},
        {name: "at the breakpoint", width: BREAKPOINT, compact: true},
        {name: "narrow", width: BREAKPOINT - 200, compact: true},
    ];

    for (const testCase of testCases) {
        await page.resize(testCase.width);
        const state = await page.evaluate<HeaderState>("harness.mountHeader()");

        assert.equal(state.compact, testCase.compact, `${testCase.name}: compact`);
        assert.equal(state.navMenu, testCase.compact, `${testCase.name}: collapses into a menu`);
        assert.equal(state.navBar, !testCase.compact, `${testCase.name}: lays out as a bar`);
        assert.deepEqual(state.slotted, ["A"], `${testCase.name}: light DOM reaches the nav`);
    }
});

test("a header told to be compact stays compact however wide the window gets", async () => {
    await page.resize(400);
    const mounted = await page.evaluate<HeaderState>("harness.mountHeader({compact: true})");
    assert.equal(mounted.compact, true, "starts compact");

    await page.resize(BREAKPOINT + 400);
    const widened = await page.evaluate<HeaderState>("harness.readHeader()");

    assert.equal(widened.compact, true, "an explicit compact is not undone by a wide viewport");
    assert.equal(widened.navMenu, true, "and it keeps the menu layout");
});

test("a header left alone keeps following the viewport after it is mounted", async () => {
    await page.resize(BREAKPOINT + 400);
    const wide = await page.evaluate<HeaderState>("harness.mountHeader()");
    assert.equal(wide.compact, false, "starts wide");

    await page.resize(600);
    const narrowed = await page.evaluate<HeaderState>("harness.readHeader()");

    assert.equal(narrowed.compact, true, "the media query listener is live, not read once at mount");
    assert.equal(narrowed.navMenu, true, "and the layout follows it");
});
