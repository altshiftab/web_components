import {css, CSSResultGroup, html, LitElement, nothing, TemplateResult} from "lit";
import {customElement, property} from "lit/decorators.js";
import "@altshiftab/web_components/box";

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

            display: block;
            position: relative;
 
            > altshift-box > .container {
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

            ::slotted(*) {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100%;
            }
        }

        :host([compact]) > altshift-box {
            --offset-top: 0;
            --offset-left: 0;
            border-top: unset;
        }

        :host([compact][open]) ::slotted(*) {
            display: block;
            flex: 1;
            width: 100%;
        }

        :host([noMenu]) > altshift-box > .container > .expand-button-container {
            display: none;
        }

        :host(:not([open])) > .nav-menu-container > .nav-menu {
            display: none;
        }

        :host([open]) > .nav-menu-container {
            display: block;
            width: 100%;
            position: absolute;
            z-index: 200;

            > .nav-menu {
                display: flex;
                flex-direction: column;
                margin-top: 1rem;
            }
        }
    ` as CSSResultGroup;

    expandButtonClick() {
        this.open = !this.open;
    }

    navMenuClick(event: Event) {
        if (!this.compact || !this.open)
            return;

        for (const target of event.composedPath()) {
            if (!(target instanceof Element))
                continue;

            const tag = target.tagName;
            if (tag === "A" || tag === "BUTTON" || target.getAttribute("role") === "menuitem") {
                this.open = false;
                break;
            }
        }
    }

    render() {
        let expandButtonContainer: TemplateResult | null = null;
        let navBar: TemplateResult | null = null
        let navMenu: TemplateResult | null = null;

        if (this.compact) {
            navMenu = html`<div class="nav-menu-container" @click=${this.navMenuClick}><nav class="nav-menu"><slot></slot></nav></div>`;

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
                <div class="expand-button-container" @click=${this.expandButtonClick}>${expandButton}</div>`
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
    compact: boolean = false;

    @property({type: Boolean, reflect: true})
    noMenu: boolean = false

    private _initialCompact: boolean = false;
    private _compactMediaQuery = window.matchMedia("(max-width: 1280px)");

    private _mediaChange = (event: MediaQueryListEvent) => {
        if (!this._initialCompact) {
            this.compact = event.matches;
        }
    }

    connectedCallback() {
        this._initialCompact = this.compact;
        this._compactMediaQuery.addEventListener("change", this._mediaChange);

        if (!this._initialCompact)
            this.compact = this._compactMediaQuery.matches;

        super.connectedCallback();
    }

    disconnectedCallback() {
        this._compactMediaQuery.removeEventListener("change", this._mediaChange);

        super.disconnectedCallback();
    }

    render() {
        return html`
            <altshift-header-nav homeUrl=${this.homeUrl} ?compact=${this.compact} ?noMenu=${this.noMenu}>
                <slot></slot>
            </altshift-header-nav>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [headerElementName]: AltShiftHeader
    }
}
