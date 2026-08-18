import {customElement, property} from "lit/decorators.js";
import {css, html, LitElement} from "lit";

export const localStorageThemeKey = "theme";
export const darkClassName = "dark";
export const lightClassName = "light";
export const darkThemeValue = "dark";
export const lightThemeValue = "light";

export const themeChangedEventType = "themeChanged";

const darkThemeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

export function systemPrefersDarkTheme(): boolean {
    return darkThemeMediaQuery.matches;
}

/**
 * The stored theme, or null when none is stored and the system preference decides.
 */
export function storedThemeValue(): string | null {
    switch (localStorage.getItem(localStorageThemeKey)) {
        case lightThemeValue:
            return lightThemeValue;
        case darkThemeValue:
            return darkThemeValue;
        default:
            return null;
    }
}

export function prefersDarkTheme(): boolean {
    const themeValue = storedThemeValue();
    return themeValue === null ? systemPrefersDarkTheme() : themeValue === darkThemeValue;
}

/**
 * Store a theme, but only one that departs from the system preference. Agreeing with the system is
 * stored as the absence of a value, so that such a choice goes on following the system rather than
 * freezing today's system preference into storage.
 */
export function storeTheme(themeValue: string): void {
    const useDarkTheme = themeValue === darkThemeValue;

    if (useDarkTheme === systemPrefersDarkTheme()) {
        localStorage.removeItem(localStorageThemeKey);
        return;
    }

    localStorage.setItem(localStorageThemeKey, useDarkTheme ? darkThemeValue : lightThemeValue);
}

/**
 * Reflect the stored theme onto an element as a class. A theme that is merely followed from the
 * system is left unclassed, leaving it to the prefers-color-scheme rules, which keep up with the
 * system on their own.
 */
export function applyTheme(element: Element = document.documentElement): void {
    const themeValue = storedThemeValue();

    element.classList.toggle(darkClassName, themeValue === darkThemeValue);
    element.classList.toggle(lightClassName, themeValue === lightThemeValue);
}

/*
 * Material Symbols "light_mode" and "dark_mode", filled, at 24dp (Apache-2.0). The sun and crescent
 * pairing is the convention every icon set of note settles on for this, so it needs no label to be
 * read. Their viewBox is Material's, whose y axis runs from -960 to 0.
 */
const sunIcon = html`
    <svg viewBox="0 -960 960 960" aria-hidden="true">
        <path d="M338.5-338.5Q280-397 280-480t58.5-141.5Q397-680 480-680t141.5 58.5Q680-563 680-480t-58.5 141.5Q563-280 480-280t-141.5-58.5ZM200-440H40v-80h160v80Zm720 0H760v-80h160v80ZM440-760v-160h80v160h-80Zm0 720v-160h80v160h-80ZM256-650l-101-97 57-59 96 100-52 56Zm492 496-97-101 53-55 101 97-57 59Zm-98-550 97-101 59 57-100 96-56-52ZM154-212l101-97 55 53-97 101-59-57Z"/>
    </svg>
`;

const moonIcon = html`
    <svg viewBox="0 -960 960 960" aria-hidden="true">
        <path d="M480-120q-150 0-255-105T120-480q0-150 105-255t255-105q14 0 27.5 1t26.5 3q-41 29-65.5 75.5T444-660q0 90 63 153t153 63q55 0 101-24.5t75-65.5q2 13 3 26.5t1 27.5q0 150-105 255T480-120Z"/>
    </svg>
`;

const themeTogglerElementName = "theme-toggler";

@customElement(themeTogglerElementName)
class ThemeToggler extends LitElement {
    @property({type: Boolean, reflect: true})
    useDarkTheme = false;

    static styles = css`
        :host {
            --border-width: var(--altshift-border-width, 0.125rem);
            --border-color: var(--altshift-border-color, #252525);
            --text-color: var(--altshift-text-color, #252525);
            --icon-size: var(--altshift-theme-toggler-icon-size, 1.5rem);
            --ease-time: 0.3s;

            display: inline-flex;
        }

        button {
            display: inline-flex;
            align-items: center;
            justify-content: center;

            /* The button takes the whole of whatever it is given rather than sitting in the middle
               of it, so that a host stretched to fill a menu row is pressable across that row and
               not only where the mark happens to be. */
            flex: 1 0 auto;

            /* Padding rather than a larger icon, so that the pointer target stays big enough to
               hit while the mark itself stays small enough to keep quiet. */
            padding: var(--altshift-theme-toggler-padding, 0.25rem);

            border: unset;
            background: unset;
            cursor: pointer;

            /* The mark carries the text's own colour: it is small and unadorned enough to keep
               quiet without being dimmed, and dimming would only cost it contrast. The press is
               answered by easing it back instead. */
            @media not (prefers-reduced-motion) {
                transition: opacity ease var(--ease-time);
            }

            &:hover, &:focus-visible {
                opacity: 0.7;
            }

            &:focus-visible {
                outline: var(--border-color) solid calc(0.5 * var(--border-width));
            }

            > svg {
                display: block;
                width: var(--icon-size);
                height: var(--icon-size);

                fill: var(--text-color);
            }
        }
    `;

    // A page may hold more than one toggler (a header and a menu one, say), and the system
    // preference may change under all of them, so the displayed state is read back from the theme
    // rather than kept.
    private _readTheme = () => {
        this.useDarkTheme = prefersDarkTheme();
    };

    private _toggle = (event: Event) => {
        // Changing the theme is not navigation, and an enclosing menu that dismisses itself on a
        // press would otherwise take the press for it and close over the change it just made.
        event.stopPropagation();

        storeTheme(this.useDarkTheme ? lightThemeValue : darkThemeValue);
        applyTheme();

        this.useDarkTheme = prefersDarkTheme();
        window.dispatchEvent(new Event(themeChangedEventType));
    };

    connectedCallback() {
        super.connectedCallback();

        this._readTheme();
        darkThemeMediaQuery.addEventListener("change", this._readTheme);
        window.addEventListener(themeChangedEventType, this._readTheme);
    }

    disconnectedCallback() {
        darkThemeMediaQuery.removeEventListener("change", this._readTheme);
        window.removeEventListener(themeChangedEventType, this._readTheme);

        super.disconnectedCallback();
    }

    render() {
        // The mark names the theme in force, not the one a press would bring, so that it reads as
        // a statement of where you are. The label carries what the press does, which a mark cannot.
        const label = this.useDarkTheme ? "Switch to the light theme" : "Switch to the dark theme";

        return html`
            <button type="button" aria-label="${label}" title="${label}" @click=${this._toggle}>
                ${this.useDarkTheme ? moonIcon : sunIcon}
            </button>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [themeTogglerElementName]: ThemeToggler,
    }
}
