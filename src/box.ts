import {css, CSSResultGroup, html, LitElement, TemplateResult, nothing, PropertyValues} from "lit";
import {customElement, property, query} from "lit/decorators.js"

const elementName = "altshift-box";

const allTextStateName = "text"

@customElement(elementName)
export default class AltShiftBox extends LitElement {

    @property({type: Boolean, reflect: true})
    animated: boolean = false;

    @property({type: Boolean, reflect: true})
    selectable: boolean = false;

    @property({type: Boolean, reflect: true})
    contracted: boolean = false;

    @property({type: Boolean, reflect: true})
    unbordered: boolean = false;

    @property({type: Boolean, reflect: true})
    textBox: boolean = false;

    @query('slot')
    private defaultSlot!: HTMLSlotElement;

    get _allText() {
        return this._internals.states.has(allTextStateName);
    }

    set _allText(flag) {
        if (flag) {
            this._internals.states.add(allTextStateName);
        } else {
            this._internals.states.delete(allTextStateName);
        }
    }

    private _internals: ElementInternals;

    static styles= css`
        :host {
            --offset-top: var(--altshift-box-offset-top, 0.5rem);
            --offset-left: var(--altshift-box-offset-left, 0.625rem);
            --border-width: var(--altshift-border-width, 0.125rem);
            --border-color: var(--altshift-border-color, #252525);

            --filler-top-height: calc(100% - var(--offset-top));
            --filler-bottom-height: var(--offset-top);

            --text-color: var(--altshift-text-color, #252525);
            --complement-color: var(--altshift-complement-color, #F8F8F8);
            --main-color: var(--altshift-main-color,  #E1DEDE);

            --ease-time: 0.3s;

            display: flex;
            border-top: var(--border-width) solid var(--border-color);
            width: 100%;
        }

        *, *::before, *::after {
            box-sizing: border-box;
        }

        .outer {
            display: flex;
            width: 100%;
            height: 100%;
        }

        .box-container {
            margin-top: var(--offset-top);
            border: var(--border-width) solid var(--border-color);
            width: 100%;
        }

        .filler {
            display: flex;
            flex-direction: column;
            min-height: 100%;
            width: var(--offset-left);
        }

        .filler__top {
            border-left: var(--border-width) solid var(--border-color);
            height: var(--filler-top-height);
        }

        .filler__bottom {
            height: var(--filler-bottom-height);
            width: 100%;
            stroke-width: var(--border-width);
            stroke: var(--border-color);
        }

        :host([animated]) {
            display: inline-block;
            width: max-content;
            height: max-content;

            border-top: unset;

            .filler {
                display: inline-flex;
            }

            .outer {
                display: inline-flex;
                background-color: var(--main-color);
                width: fit-content;
                border-top: var(--border-width) solid var(--border-color);
            }

            .box-container {
                display: inline-flex;
                width: unset;
            }

            .compensate-left {
                display: inline-flex;
                width: 0;
            }

            .compensate-bottom {
                display: flex;
                width: 100%;
            }

            .compensate-bottom__space {
                height: 0;
            }

            .compensate-bottom__box {
                height: 0;
                width: 0;
                stroke-width: var(--border-width);
                stroke: var(--border-color);
            }
        }

        @media not (prefers-reduced-motion) {
            :host([animated]) {
                .filler {
                    transition: width ease var(--ease-time);
                }

                .outer:hover > .box-container {
                    margin-top: calc(-1 * var(--border-width));
                }

                .outer:hover > .filler {
                    width: 0;
                }

                .box-container {
                    transition: margin-top ease var(--ease-time);
                }

                .compensate-left {
                    transition: width ease var(--ease-time);
                }

                .compensate-bottom__space {
                    transition: height ease var(--ease-time);
                }

                .compensate-bottom__box {
                    transition: width ease var(--ease-time), height ease var(--ease-time);
                }

                .outer:hover ~ .compensate-left {
                    width: var(--offset-left);
                }

                .outer:hover ~ .compensate-bottom > .compensate-bottom__box {
                    width: var(--offset-left);
                }

                .outer:hover ~ .compensate-bottom > .compensate-bottom__space {
                    height: calc(var(--offset-top) + var(--border-width));
                    width: 100%;
                }
            }
        }

        :host([selectable]) {
            ::slotted(:hover) {
                background-color: var(--complement-color);
            }

            ::slotted(:focus-visible) {
                background-color: var(--complement-color);
                outline: none;
            }
        }

        :host([selectable]:state(text)) {
            .box-container:hover {
                background-color: var(--complement-color);
            }

            .box-container:focus-visible {
                background-color: var(--complement-color);
                outline: none;
            }
        }

        :host([textBox]) {
            display: inline-block;
            width: max-content;
            height: max-content;

            .box-container {
                text-decoration: none;
                color: var(--text-color);

                font-weight: 700;
                font-size: 1.125rem;
                text-align: center;
                text-transform: uppercase;
                user-select: none;
                white-space: nowrap;
            }

            ::slotted(*) {
                padding: 0.75rem 2rem;
                text-decoration: none;
                color: var(--text-color);
            }
        }

        :host([textBox]:state(text)) {
            .box-container {
                padding: 0.75rem 2rem;
            }
        }

        :host([contracted]) {
            .box-container {
                margin-top: unset;
                border-top: unset;
            }
        }

        :host([unbordered]) {
            border: unset;

            .box-container {
                border: unset;
            }
        }
    ` as CSSResultGroup;

    private _onSlotChange() {
        this._allText = this.defaultSlot.assignedNodes({flatten: true}).every(node => node.nodeType === Node.TEXT_NODE);
    }

    protected firstUpdated(_changedProperties: PropertyValues) {
        super.firstUpdated(_changedProperties);
        this._onSlotChange();
    }

    constructor() {
        super();
        this._internals = this.attachInternals();
    }

    render() {
        let compensateElements: TemplateResult | null = null;
        if (this.animated) {
            compensateElements = html`
                <div class="compensate-left"></div>
                <div class="compensate-bottom">
                    <div class="compensate-bottom__space"></div>
                    <div class="compensate-bottom__box"></div>
                </div>
            `;
        }

        let filler: TemplateResult | null = html`
            <div class="filler">
                <div class="filler__top"></div>
                <svg class="filler__bottom">
                    <line x1="0" y1="0" x2="100%" y2="100%"/>
                </svg>
            </div>
        `;

        if (this.contracted) {
            filler = null
            compensateElements = null;
        }

        return html`
            <div part="outer" class="outer">
                ${filler || nothing}
                <div part="box-container" class="box-container">
                    <slot @slotchange=${this._onSlotChange}></slot>
                </div>
            </div>
            ${compensateElements || nothing}
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [elementName]: AltShiftBox
    }
}