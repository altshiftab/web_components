import {after, before, test} from "node:test";
import assert from "node:assert/strict";
import {openHarness, type Page} from "./browser.ts";

interface FooterState {
    compact: boolean;
    hasNav: boolean;
    legalSlotted: string[];
}

let page: Page;

before(async () => {
    page = await openHarness("/test/pages/harness.html");
}, {timeout: 60_000});

after(async () => {
    await page?.close();
});

test("the footer renders its nav and keeps the legal slot addressable", async () => {
    await page.resize(1600);
    const state = await page.evaluate<FooterState>("harness.mountFooter()");

    assert.equal(state.hasNav, true, "the nav element is rendered");
    // Every Alt-Shift site puts its privacy policy link in this slot; losing it would be silent.
    assert.deepEqual(state.legalSlotted, ["Legal"], "named slot content is assigned");
});

/*
 * Same rule as the header: a compact set on the element pins it, one left alone follows the width.
 * Worth asserting separately, because the two components implement it in their own copies of
 * connectedCallback rather than sharing one.
 */
test("the footer follows the viewport unless it was told what to be", async () => {
    await page.resize(1600);
    const wide = await page.evaluate<FooterState>("harness.mountFooter()");
    assert.equal(wide.compact, false, "wide viewport is not compact");

    await page.resize(600);
    const narrowed = await page.evaluate<FooterState>("harness.readFooter()");
    assert.equal(narrowed.compact, true, "narrowing makes it compact");

    await page.resize(400);
    const pinned = await page.evaluate<FooterState>("harness.mountFooter({compact: true})");
    assert.equal(pinned.compact, true, "explicitly compact");

    await page.resize(1600);
    const widened = await page.evaluate<FooterState>("harness.readFooter()");
    assert.equal(widened.compact, true, "and a wide viewport does not undo it");
});
