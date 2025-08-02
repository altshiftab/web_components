import {html, LitElement, css} from "lit";
import {customElement, property} from "lit/decorators.js";
import "@altshiftab/web_components/box";

const elementName = "altshift-button";

@customElement(elementName)
export default class AltShiftButton extends LitElement {
    static formAssociated = true;

    @property()
    type: string = "submit"

    @property()
    formMethod: string | null = null;

    @property({type: Boolean})
    formNoValidate: boolean = false;

    @property()
    formAction: string | null = null;

    @property({type: Boolean, reflect: true})
    disabled: boolean = false;

    private _internals: ElementInternals;

    static styles = css`
        :host {
            --complement-color: var(--altshift-complement-color, #F8F8F8);

            display: block;
            cursor: pointer;
            width: 100%;

            > altshift-box {
                @media screen and (max-width: 1280px) {
                    &::part(box-container) {
                        font-size: unset;
                        margin-top: unset;
                        border-top: unset;
                    }

                    &::part(compensate-left), &::part(compensate-bottom), &::part(filler) {
                        display: none;
                    }
                }
            }
        }

        :host(:focus-visible) {
            outline: none;

            > altshift-box::part(box-container) {
                background-color: var(--complement-color);
            }
        }

        :host([disabled]) {
            cursor: not-allowed;
            pointer-events: none;
        }

        ::slotted(a) {
            width: 100%;
            display: block;
            @media screen and (max-width: 1280px) {
                padding: 0.65625rem 1.75rem;
            }
        }
    `;

    constructor() {
        super();
        this._internals = this.attachInternals();
        this.role = "button";
        this.tabIndex = 0;

        this.addEventListener("click", event => {
            if (this.disabled)
                return void event.preventDefault();

            if (this.formMethod === "dialog") {
                const dialog = this.closest("dialog");
                if (dialog) {
                    dialog.returnValue = this.formAction || "";
                    return void dialog.close();
                }
            }

            switch (this.type) {
            case "submit":
                return void this._internals.form?.requestSubmit();
            case "reset":
                return void this._internals.form?.reset();
            }
        });
    }

    render() {
        return html`
            <altshift-box part="box" animated selectable textBox>
                <slot></slot>
            </altshift-box>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [elementName]: AltShiftButton
    }
}
