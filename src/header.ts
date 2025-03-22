import {css, CSSResultGroup, html, LitElement, nothing, TemplateResult} from "lit";
import {customElement, property} from "lit/decorators.js";
import "./switch.ts";
import "@altshiftab/web_components/switch";
import "@altshiftab/web_components/box";
import {toggledSwitchEventType} from "@altshiftab/web_components/switch";

const themeTogglerElementName = "theme-toggler";

@customElement(themeTogglerElementName)
class ThemeToggler extends LitElement {
    @property({type: Boolean, reflect: true})
    useDarkTheme = false;

    render() {
        return html`
            <altshift-switch-labelled
                .toggledRight=${this.useDarkTheme}
                left="light"
                right="dark"
            ></altshift-switch-labelled>
        `;
    }
}

function setDocumentElementTheme(useDarkTheme: boolean) {
    if (useDarkTheme) {
        document.documentElement.classList.add('dark-theme');
    } else {
        document.documentElement.classList.remove('dark-theme');
    }
}

function toggleRootStyles() {
    const documentElement = document.documentElement;
    const rootStyle = getComputedStyle(documentElement);

    [
        'main-color',
        'text-color',
        'border-color',
        'complement-color',
        'box-color'
    ].forEach(attribute => {
        const current_value = rootStyle.getPropertyValue(`--altshift-${attribute}`);
        const opposite_value = rootStyle.getPropertyValue(`--altshift-opposite-${attribute}`);

        documentElement.style.setProperty(`--altshift-${attribute}`, opposite_value);
        documentElement.style.setProperty(`--altshift-opposite-${attribute}`, current_value);
    });
}

function getThemeIsDark(): boolean {
    const theme_value = localStorage.getItem('theme');
    const prefers_dark_color_scheme = Boolean(window.matchMedia('(prefers-color-scheme: dark)').matches);

    switch (theme_value) {
        case 'light':
            if (prefers_dark_color_scheme)
                toggleRootStyles();
            return false;
        case 'dark':
            if (!prefers_dark_color_scheme)
                toggleRootStyles();
            return true;
        default:
            return prefers_dark_color_scheme;
    }
}


const headerNavElementName = "altshift-header-nav"

@customElement(headerNavElementName)
export class AltShiftHeaderNav extends LitElement {
    @property()
    homeUrl: string = "/"

    @property({type: Boolean, reflect: true})
    open: boolean = false;

    @property({type: Boolean, reflect: true})
    noMenu: boolean = false

    @property({type: Boolean, reflect: true})
    compact: boolean = false

    static styles = css`
        :host {
            --border-color: var(--altshift-border-color, #252525);
            --border-width: var(--altshift-border-width, 0.125rem);
            --main-color: var(--altshift-main-color,  #E1DEDE);
            --complement-color: var(--altshift-complement-color, #F8F8F8);
            --text-color: var(--altshift-text-color, #252525);
            --opposite-main-color: var(--altshift-opposite-main-color, #252525);
            --opposite-text-color: var(--altshift-opposite-text-color, #F8F8F8);

            position: relative;
        }

        :host([compact]) {
            altshift-box {
                --offset-top: 0;
                --offset-left: 0;
                border-top: unset;
            }
        }

        :host([compact][open]) ::slotted(*) {
            display: block;
            flex: 1;
            width: 100%;
        }

        :host([noMenu]) .expand-button-container {
            display: none;
        }

        :host(:not([open])) {
            .nav-menu {
                display: none;
            }
        }

        :host([open]) .nav-menu {
            position: absolute;
            width: 100%;

            display: flex;
            flex-direction: column;
            margin-top: 1rem;
        }

        ::slotted(*) {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100%;
        }
 
        .container {
            display: flex;
            width: 100%;

            > .logo-container {
                font-size: 2rem;
                font-weight: 900;
                display: flex;
                user-select: none;

                > .logo-a {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 0.5rem 1rem;

                    color: var(--text-color);
                    text-decoration: none;

                    &:hover, &:focus-visible {
                        background-color: var(--opposite-main-color);
                        color: var(--opposite-text-color);
                    }

                    &:focus-visible {
                        outline: none;
                    }

                    &:last-of-type {
                        border-left: var(--border-width) solid var(--border-color);
                        border-right: var(--border-width) solid var(--border-color);
                    }
                }
            }

            > .nav-bar {
                display: flex;
                justify-content: flex-end;
                width: 100%;
            }

            > .expand-button-container {
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 0 1rem;
                margin-left: auto;

                > svg {
                    cursor: pointer;
                    height: 1.75rem;
                    stroke: var(--text-color);
                }
            }
        }
    ` as CSSResultGroup;

    expand_button_click(event: Event) {
        this.open = !this.open;
    }

    render() {
        let expandButtonContainer: TemplateResult | null = null;
        let navBar: TemplateResult | null = null
        let navMenu: TemplateResult | null = null;

        if (this.compact) {
            navMenu = html`<nav class="nav-menu"><slot></slot></nav>`;

            let expandButton: TemplateResult | null;

            if (this.open) {
                expandButton = html`
                    <svg class="cross-svg" viewBox="0 0 26 26">
                        <path d="M25.9966 1.51489L24.4849 0.00317383L0.00268936 24.4854L1.5144 25.9971L25.9966 1.51489Z"/>
                        <path d="M26 24.4883L1.51171 0L0 1.51172L24.4883 26L26 24.4883Z"/>
                    </svg>
                `;
            } else {
                expandButton = html`
                    <svg class="burger-svg" viewBox="0 0 28 24">
                        <line y1="1" x2="28" y2="1" stroke-width="2"/>
                        <line y1="12" x2="28" y2="12" stroke-width="2"/>
                        <line y1="23" x2="28" y2="23" stroke-width="2"/>
                    </svg>
                `;
            }

            expandButtonContainer = html`
                <div class="expand-button-container" @click=${this.expand_button_click}>${expandButton}</div>`
            ;
        } else {
            navBar = html`<nav class="nav-bar"><slot></slot></nav>`;
        }

        return html`
            <altshift-box>
                <div class="container">
                    <div class="logo-container">
                        <a class="logo-a" href="${this.homeUrl}">alt</a>
                        <a class="logo-a" href="${this.homeUrl}">shift</a>
                    </div>
                    ${navBar || nothing}
                    ${expandButtonContainer || nothing}
                </div>
            </altshift-box>
            ${navMenu || nothing}
        `;
    }
}

const headerElementName = "altshift-header";

@customElement(headerElementName)
export default class AltShiftHeader extends LitElement {
    @property()
    homeUrl: string = "/"

    @property({type: Boolean, reflect: true})
    compact: boolean = window.matchMedia("(max-width: 1280px)").matches

    @property({type: Boolean})
    noMenu: boolean = false

    @property({type: Boolean})
    useDarkTheme: boolean = getThemeIsDark()

    static styles = css`
        altshift-header-nav[open] + div > theme-toggler {
            visibility: hidden;
        }

        .theme-toggler-container {
            position: relative;
            width: 100%;
            display: flex;
            justify-content: flex-end;
            padding-top: 1rem;
        }
    `;

    connectedCallback() {
        setDocumentElementTheme(this.useDarkTheme);

        this.addEventListener(toggledSwitchEventType, event => {
            toggleRootStyles();
            localStorage.setItem('theme', event.detail.value);
            setDocumentElementTheme(event.detail.value === "dark");
        });

        const compactMediaQuery = window.matchMedia("(max-width: 1280px)");
        compactMediaQuery.addEventListener("change", event => {
            this.compact = event.matches;
        });

        super.connectedCallback();
    }

    render() {
        return html`
            <altshift-header-nav homeUrl=${this.homeUrl} ?compact=${this.compact} ?noMenu=${this.noMenu}>
                <slot></slot>
            </altshift-header-nav>
            <div class="theme-toggler-container"><theme-toggler ?useDarkTheme=${this.useDarkTheme}/></div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [themeTogglerElementName]: ThemeToggler,
        [headerElementName]: AltShiftHeader
    }
}
