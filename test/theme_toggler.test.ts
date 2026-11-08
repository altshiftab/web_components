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

interface ThemeResult {
    stored: string | null;
    storedThemeValue: string | null;
    prefersDark: boolean;
    systemPrefersDark: boolean;
    probeClasses: string[];
}

function themeCall(options: {stored?: string | null; action?: string | null; actionValue?: string | null}): string {
    return `harness.theme(${JSON.stringify({stored: null, action: null, actionValue: null, ...options})})`;
}

/*
 * The subtle rule in this module: agreeing with the system is stored as the *absence* of a value,
 * so that a choice which happens to match today keeps following the system tomorrow instead of
 * freezing today's preference. Both branches need the system preference put where the test wants
 * it, which is what the media emulation is for.
 */
test("choosing the theme the system already prefers stores nothing", async () => {
    const testCases: {name: string; system: "light" | "dark"; choose: string; stored: string | null}[] = [
        {name: "dark under a dark system", system: "dark", choose: "dark", stored: null},
        {name: "light under a light system", system: "light", choose: "light", stored: null},
        {name: "dark under a light system", system: "light", choose: "dark", stored: "dark"},
        {name: "light under a dark system", system: "dark", choose: "light", stored: "light"},
    ];

    for (const testCase of testCases) {
        await page.emulateColorScheme(testCase.system);
        const result = await page.evaluate<ThemeResult>(
            themeCall({action: "store", actionValue: testCase.choose}),
        );

        assert.equal(result.systemPrefersDark, testCase.system === "dark", `${testCase.name}: emulation took`);
        assert.equal(result.stored, testCase.stored, `${testCase.name}: what ends up in localStorage`);
        // Either way the effective theme is the one that was chosen.
        assert.equal(result.prefersDark, testCase.choose === "dark", `${testCase.name}: effective theme`);
    }
});

test("a stored choice overrides the system, and anything else falls back to it", async () => {
    const testCases: {name: string; system: "light" | "dark"; stored: string | null; value: string | null; prefersDark: boolean}[] = [
        {name: "nothing stored follows a dark system", system: "dark", stored: null, value: null, prefersDark: true},
        {name: "nothing stored follows a light system", system: "light", stored: null, value: null, prefersDark: false},
        {name: "stored dark beats a light system", system: "light", stored: "dark", value: "dark", prefersDark: true},
        {name: "stored light beats a dark system", system: "dark", stored: "light", value: "light", prefersDark: false},
        {name: "junk is not a choice", system: "dark", stored: "purple", value: null, prefersDark: true},
        {name: "an empty value is not a choice", system: "light", stored: "", value: null, prefersDark: false},
    ];

    for (const testCase of testCases) {
        await page.emulateColorScheme(testCase.system);
        const result = await page.evaluate<ThemeResult>(themeCall({stored: testCase.stored}));

        assert.equal(result.storedThemeValue, testCase.value, `${testCase.name}: recognised stored value`);
        assert.equal(result.prefersDark, testCase.prefersDark, `${testCase.name}: effective theme`);
    }
});

/*
 * A theme that is merely followed from the system is left unclassed, so the prefers-color-scheme
 * rules keep doing the work and keep up with a system that changes under the page.
 */
test("only an explicit choice puts a class on the element", async () => {
    const testCases: {name: string; system: "light" | "dark"; stored: string | null; classes: string[]}[] = [
        {name: "stored dark", system: "light", stored: "dark", classes: ["dark"]},
        {name: "stored light", system: "dark", stored: "light", classes: ["light"]},
        {name: "following a dark system", system: "dark", stored: null, classes: []},
        {name: "following a light system", system: "light", stored: null, classes: []},
        {name: "junk classes nothing", system: "dark", stored: "purple", classes: []},
    ];

    for (const testCase of testCases) {
        await page.emulateColorScheme(testCase.system);
        const result = await page.evaluate<ThemeResult>(themeCall({stored: testCase.stored, action: "apply"}));

        assert.deepEqual(result.probeClasses, testCase.classes, testCase.name);
    }
});

/*
 * A page can hold more than one toggler -- a header and a menu one, say -- and they must not end up
 * disagreeing. The togglers read the theme back rather than keeping it, and the themeChanged event
 * on window is what tells the other one to look again.
 */
test("two togglers on a page stay in agreement", async () => {
    await page.emulateColorScheme("light");

    const result = await page.evaluate<{
        before: {one: boolean; two: boolean};
        after: {one: boolean; two: boolean};
        stored: string | null;
        documentClasses: string[];
        label: string;
    }>("harness.themeTogglersAgree()");

    assert.deepEqual(result.before, {one: false, two: false}, "both start on the system's light theme");
    assert.deepEqual(result.after, {one: true, two: true}, "pressing one moves both");
    assert.equal(result.stored, "dark", "the choice departs from the system, so it is stored");
    assert.ok(result.documentClasses.includes("dark"), "and is applied to the document");
    assert.equal(result.label, "Switch to the light theme", "the label offers the press, not the state");
});

/*
 * The mark names the theme in force rather than the one a press would bring, which is the opposite
 * of what the label says, and easy to swap by accident.
 */
test("the icon shows the theme in force", async () => {
    const testCases: {name: string; system: "light" | "dark"; stored: string | null; icon: string; label: string}[] = [
        {name: "dark in force", system: "light", stored: "dark", icon: "moon", label: "Switch to the light theme"},
        {name: "light in force", system: "dark", stored: "light", icon: "sun", label: "Switch to the dark theme"},
        {name: "following a dark system", system: "dark", stored: null, icon: "moon", label: "Switch to the light theme"},
        {name: "following a light system", system: "light", stored: null, icon: "sun", label: "Switch to the dark theme"},
    ];

    for (const testCase of testCases) {
        await page.emulateColorScheme(testCase.system);
        const result = await page.evaluate<{useDarkTheme: boolean; icon: string; label: string}>(
            `harness.themeTogglerIcon(${JSON.stringify({stored: testCase.stored})})`,
        );

        assert.equal(result.icon, testCase.icon, `${testCase.name}: icon`);
        assert.equal(result.label, testCase.label, `${testCase.name}: label`);
        assert.equal(result.useDarkTheme, testCase.icon === "moon", `${testCase.name}: state`);
    }
});
