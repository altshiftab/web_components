import {customElement, property} from "lit/decorators.js";
import {html, LitElement} from "lit";

export const localStorageThemeKey = "theme";
export const darkClassName = "dark";
export const darkThemeValue = "dark";
export const lightThemeValue = "light";

export function setThemeClassName(useDarkTheme: boolean, ...elements: HTMLElement[]) {
    for (const element of elements) {
        if (useDarkTheme) {
            element.classList.add(darkClassName);
        } else {
            element.classList.remove(darkClassName);
        }
    }
}

export function prefersDarkTheme(): boolean {
    const themeValue = localStorage.getItem(localStorageThemeKey);
    const prefersDarkColorScheme = Boolean(window.matchMedia("(prefers-color-scheme: dark)").matches);

    switch (themeValue) {
        case lightThemeValue:
            return false;
        case darkThemeValue:
            return true;
        default:
            return prefersDarkColorScheme;
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
