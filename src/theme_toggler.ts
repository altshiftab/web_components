import {customElement, property} from "lit/decorators.js";
import {html, LitElement} from "lit";

export const localStorageThemeKey = "theme";
export const darkClassName = "dark";
export const lightClassName = "light";
export const darkThemeValue = "dark";
export const lightThemeValue = "light";

export function prefersDarkTheme(): boolean {
    switch (localStorage.getItem(localStorageThemeKey)) {
        case lightThemeValue:
            return false;
        case darkThemeValue:
            return true;
        default:
            return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
}

const themeTogglerElementName = "theme-toggler";

@customElement(themeTogglerElementName)
class ThemeToggler extends LitElement {
    @property({type: Boolean, reflect: true})
    useDarkTheme = false;

    render() {
        return html`<altshift-switch-labelled ?toggledRight=${this.useDarkTheme} left="${lightThemeValue}" right="${darkThemeValue}"></altshift-switch-labelled>`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [themeTogglerElementName]: ThemeToggler,
    }
}
