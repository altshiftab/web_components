/*
 * The component tests' page, in a headless Chromium.
 *
 * These components are custom elements whose behaviour is shadow DOM, computed styles and pointer
 * semantics, so there is nothing a DOM-less assertion can reach: a stub that reports back the
 * cursor string it was handed would pass a stylesheet that never applies. The package therefore
 * tests end to end against a real browser, driven by @altshiftab/utils/testing/chromium.
 */

import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {Page, serveDirectory} from "@altshiftab/utils/testing/chromium";

export type {Page};

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Opens the page at the path, served from the package directory so that it reaches the built
 * components at /dist and lit at /node_modules through the import map it declares. The page sets
 * window.ready once its module has defined the elements it exports for testing.
 */
export async function openHarness(path: string): Promise<Page> {
    const served = await serveDirectory(PACKAGE_ROOT);
    return Page.open(`${served.origin}${path}`, {ready: "window.ready === true", close: served.close});
}
