/*
 * A minimal headless-Chromium driver for the component tests.
 *
 * These components are custom elements whose behaviour is shadow DOM, computed styles and pointer
 * semantics, so there is nothing a DOM-less assertion can reach: a stub that reports back the
 * cursor string it was handed would pass a stylesheet that never applies. The package therefore
 * tests end to end against a real browser, as the Dark Reader repack does, and hand-rolls the
 * driving rather than taking a dependency on one. Node supplies the WebSocket, so the Chrome
 * DevTools Protocol needs no client library.
 */

import {createReadStream, existsSync} from "node:fs";
import {mkdtemp, rm} from "node:fs/promises";
import {spawn, type ChildProcess} from "node:child_process";
import {createServer, type Server} from "node:http";
import {once} from "node:events";
import {tmpdir} from "node:os";
import {delimiter, dirname, extname, join, normalize, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const CONTENT_TYPES: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".map": "application/json; charset=utf-8",
};

const BROWSER_NAMES = ["chromium", "google-chrome-stable", "google-chrome", "chrome"];

/**
 * Resolves the browser binary. CHROME_PATH wins, so a machine without one of the usual names — or
 * CI pinning a specific build — does not need this file changed.
 */
function findBrowser(): string {
    const fromEnvironment = process.env.CHROME_PATH;
    if (fromEnvironment) {
        if (!existsSync(fromEnvironment))
            throw new Error(`CHROME_PATH is set to "${fromEnvironment}", which does not exist.`);
        return fromEnvironment;
    }

    for (const directory of (process.env.PATH ?? "").split(delimiter)) {
        if (!directory)
            continue;
        for (const name of BROWSER_NAMES) {
            const candidate = join(directory, name);
            if (existsSync(candidate))
                return candidate;
        }
    }

    throw new Error(
        `No Chromium found on PATH (looked for ${BROWSER_NAMES.join(", ")}). ` +
        "Install one or point CHROME_PATH at a binary."
    );
}

/**
 * Serves the package directory, so a test page reaches the built components at /dist and lit at
 * /node_modules through the import map it declares.
 */
function serve(): Promise<{origin: string; close: () => Promise<void>}> {
    const server: Server = createServer((request, response) => {
        const path = normalize(decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname));
        const file = join(PACKAGE_ROOT, path);

        if (!file.startsWith(PACKAGE_ROOT + "/") || !existsSync(file)) {
            response.writeHead(404).end("not found");
            return;
        }

        response.writeHead(200, {"content-type": CONTENT_TYPES[extname(file)] ?? "application/octet-stream"});
        createReadStream(file).pipe(response);
    });

    return new Promise(resolvePromise => {
        server.listen(0, "127.0.0.1", () => {
            const address = server.address();
            if (address === null || typeof address === "string")
                throw new Error("the test server did not bind a port");

            resolvePromise({
                origin: `http://127.0.0.1:${address.port}`,
                close: () => new Promise<void>(done => server.close(() => done())),
            });
        });
    });
}

type CdpMessage = {id?: number; method?: string; params?: any; result?: any; error?: {message: string}};

/** A page in a headless browser, with one call on it: evaluate an expression and get the value. */
export class Page {
    readonly #socket: WebSocket;
    readonly #pending = new Map<number, {resolve: (value: any) => void; reject: (error: Error) => void}>();
    readonly #browser: ChildProcess;
    readonly #profile: string;
    readonly #closeServer: () => Promise<void>;

    #sessionId = "";
    #nextId = 1;

    private constructor(
        socket: WebSocket,
        browser: ChildProcess,
        profile: string,
        closeServer: () => Promise<void>,
    ) {
        this.#socket = socket;
        this.#browser = browser;
        this.#profile = profile;
        this.#closeServer = closeServer;
    }

    static async open(pagePath: string): Promise<Page> {
        const {origin, close: closeServer} = await serve();
        const profile = await mkdtemp(join(tmpdir(), "altshift-web-components-"));

        // Chromium refuses its own sandbox as root, which is the one case CI tends to hit.
        const sandbox = process.getuid?.() === 0 ? ["--no-sandbox"] : [];
        const browser = spawn(findBrowser(), [
            "--headless",
            "--disable-gpu",
            "--no-first-run",
            "--no-default-browser-check",
            "--disable-extensions",
            `--user-data-dir=${profile}`,
            "--remote-debugging-port=0",
            ...sandbox,
            "about:blank",
        ], {stdio: ["ignore", "ignore", "pipe"]});

        const endpoint = await readDevToolsEndpoint(browser);
        const socket = new WebSocket(endpoint);
        await once(socket, "open");

        const page = new Page(socket, browser, profile, closeServer);
        socket.addEventListener("message", event => page.#receive(String(event.data)));

        // Target.* is addressed at the browser, so these two go out before a session exists; every
        // call after the attach carries the session id and lands in the page.
        const {targetId} = await page.#send("Target.createTarget", {url: "about:blank"});
        const {sessionId} = await page.#send("Target.attachToTarget", {targetId, flatten: true});
        page.#sessionId = sessionId;

        await page.#send("Page.enable");
        await page.#send("Runtime.enable");
        await page.#send("Page.navigate", {url: `${origin}${pagePath}`});
        await page.#waitForReady();

        return page;
    }

    #receive(data: string) {
        const message: CdpMessage = JSON.parse(data);
        if (message.id === undefined)
            return;

        const pending = this.#pending.get(message.id);
        if (pending === undefined)
            return;

        this.#pending.delete(message.id);
        if (message.error)
            pending.reject(new Error(message.error.message));
        else
            pending.resolve(message.result);
    }

    #send(method: string, params: Record<string, unknown> = {}): Promise<any> {
        const id = this.#nextId++;
        const payload: Record<string, unknown> = {id, method, params};
        if (this.#sessionId)
            payload.sessionId = this.#sessionId;

        return new Promise((resolvePromise, reject) => {
            this.#pending.set(id, {resolve: resolvePromise, reject});
            this.#socket.send(JSON.stringify(payload));
        });
    }

    /** The page sets window.ready once its module has defined the elements it exports for testing. */
    async #waitForReady() {
        const deadline = Date.now() + 20_000;
        for (;;) {
            try {
                if (await this.evaluate("window.ready === true") === true)
                    return;
            } catch {
                // The document may not have been replaced yet; keep polling until the deadline.
            }
            if (Date.now() > deadline)
                throw new Error("the test page never became ready");
            await new Promise(done => setTimeout(done, 50));
        }
    }

    /**
     * Resizes the viewport, so a width-driven media query can be moved across its breakpoint while
     * the page is up rather than only chosen before it loads.
     */
    async resize(width: number, height = 800) {
        await this.#send("Emulation.setDeviceMetricsOverride", {
            width,
            height,
            deviceScaleFactor: 1,
            mobile: false,
        });
    }

    /**
     * Forces what `prefers-color-scheme` reports, so a test can put the system preference where it
     * needs it. The MediaQueryList the page captured at load stays live, so a component listening
     * for a change hears this one.
     */
    async emulateColorScheme(scheme: "light" | "dark") {
        await this.#send("Emulation.setEmulatedMedia", {
            features: [{name: "prefers-color-scheme", value: scheme}],
        });
    }

    /** Evaluates an expression in the page and returns its value, awaiting it if it is a promise. */
    async evaluate<T = unknown>(expression: string): Promise<T> {
        const {result, exceptionDetails} = await this.#send("Runtime.evaluate", {
            expression,
            awaitPromise: true,
            returnByValue: true,
        });

        if (exceptionDetails)
            throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);

        return result.value as T;
    }

    async close() {
        this.#socket.close();
        this.#browser.kill();
        await once(this.#browser, "exit");
        await this.#closeServer();
        await rm(this.#profile, {recursive: true, force: true});
    }
}

function readDevToolsEndpoint(browser: ChildProcess): Promise<string> {
    return new Promise((resolvePromise, reject) => {
        const timer = setTimeout(() => reject(new Error("the browser never announced a DevTools endpoint")), 20_000);
        let output = "";

        browser.stderr?.on("data", chunk => {
            output += String(chunk);
            const match = output.match(/ws:\/\/\S+/);
            if (match) {
                clearTimeout(timer);
                resolvePromise(match[0]);
            }
        });

        browser.once("exit", code => {
            clearTimeout(timer);
            reject(new Error(`the browser exited with code ${code} before listening:\n${output}`));
        });
    });
}
