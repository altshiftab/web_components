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
 * This is a legal document served by every Alt-Shift site from one source, so what is asserted is
 * that the parts the GDPR requires are present and that the addresses in it still point somewhere
 * -- not how it reads. A dropped section or a mangled mailto is the failure mode that matters, and
 * it would otherwise ship to every site at once.
 */
test("the privacy policy carries the sections it has to", async () => {
    const result = await page.evaluate<{headings: string[]; links: string[]; text: string}>(
        "harness.privacyPolicy()",
    );

    assert.deepEqual(result.headings, [
        "Privacy policy",
        "Who we are",
        "What we process",
        "Why, and on what legal basis",
        "Retention",
        "Where the data goes",
        "Your rights",
        "Changes",
    ], "every required section is present, in order");

    assert.deepEqual(result.links, [
        "mailto:privacy@altshift.se",
        "https://www.imy.se",
    ], "the contact address and the supervisory authority are both reachable");
});

test("the policy names the controller and the retention period", async () => {
    const {text} = await page.evaluate<{text: string}>("harness.privacyPolicy()");

    const required: {name: string; needle: string}[] = [
        {name: "controller identity", needle: "Alt-Shift AB"},
        {name: "organisation number", needle: "559380-8404"},
        {name: "legal basis for logs", needle: "Article 6(1)(f) GDPR"},
        {name: "retention period", needle: "deleted automatically after 30 days"},
        {name: "the Article 11 caveat on rights", needle: "Article 11 GDPR"},
        {name: "last-updated date", needle: "Last updated:"},
    ];

    for (const item of required)
        assert.ok(text.includes(item.needle), `${item.name}: expected to find "${item.needle}"`);
});
