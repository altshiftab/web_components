import {css, CSSResultGroup, html, LitElement} from "lit";
import {customElement, property} from "lit/decorators.js";

const footerNavElementName = "altshift-footer-nav"

@customElement(footerNavElementName)
export class AltShiftFooterNav extends LitElement {
    @property()
    homeUrl: string = "/"

    static styles = css`
        :host {
            --border-width: var(--altshift-border-width, 0.125rem);
            --border-color: var(--altshift-border-color, #252525);
            --opposite-main-color: var(--altshift-opposite-main-color, #252525);
            --opposite-text-color: var(--altshift-opposite-text-color, #F8F8F8);
            --complement-color: var(--altshift-complement-color, #F8F8F8);

            display: grid;
            grid-auto-rows: 1fr;
            grid-template-columns: 1fr min-content;

            border: var(--border-width) solid var(--border-color);

            > .logo-container {
                display: flex;

                grid-row: 1;
                grid-column: 1;

                font-size: 2rem;
                font-weight: 900;
                user-select: none;
                border-bottom: var(--border-width) solid var(--border-color);
                border-bottom: var(--border-width) solid var(--border-color);

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

            > nav {
                display: grid;
                grid-row: 1 / 3;
                grid-auto-rows: 1fr;
                justify-content: end;
                direction: rtl;
            }
        }

        :host([compact]) {
            > .logo-container {
                border-bottom: unset;
            }

            > nav {
                display: none;
            }
        }

        *, *::before, *::after {
            box-sizing: border-box;
        }

        ::slotted(*) {
            display: flex;
            justify-content: center;
            align-items: center;
            height: auto;
            width: auto;
        }

        ::slotted(.first-row) {
            grid-row: 1;
            border-bottom: var(--border-width) solid var(--border-color);
        }

        ::slotted(.second-row) {
            grid-row: 2;
        }
    ` as CSSResultGroup;

    render() {
        return html`
            <div class="logo-container">
                <a class="logo-a" href="${this.homeUrl}">alt</a>
                <a class="logo-a" href="${this.homeUrl}">shift</a>
            </div>
            <nav><slot></slot></nav>
        `;
    }
}

const footerElementName = "altshift-footer";

@customElement(footerElementName)
export default class AltShiftFooter extends LitElement {
    @property()
    homeUrl: string = "/"

    @property({type: Boolean, reflect: true})
    compact: boolean = false

    static styles = css`
        :host([compact]) {
           .org-text {
               display: flex;
               flex-direction: column;
           } 
        }

        :host(:not([compact])) {
            .org-text > span:not(:last-of-type)::after {
                content: ' | ';
            }
        }

        .text-section {
            display: flex;
            justify-content: space-between;
            padding-top: 3rem;
            padding-bottom: 3rem;
        }

        .copyright-text {
            display: flex;
            align-items: end;
        }
    ` as CSSResultGroup;

    connectedCallback() {
        const compactMediaQuery = window.matchMedia("(max-width: 1280px)");
        compactMediaQuery.addEventListener("change", event => {
            this.compact = event.matches;
        })

        this.compact = compactMediaQuery.matches;

        super.connectedCallback();
    }

    render() {
        return html`
            <altshift-footer-nav homeUrl="${this.homeUrl}" ?compact=${this.compact}><slot></slot></altshift-footer-nav>
            <section class="text-section">
                <div class="org-text">
                    <span>Alt-Shift AB</span>
                    <span>Stockholm, Sweden</span>
                    <span>559380-8404</span>
                </div>
                <div class="copyright-text">Copyright © 2025</div>
            </section>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [footerNavElementName]: AltShiftFooterNav,
        [footerElementName]: AltShiftFooter
    }
}
