import {html, LitElement, css} from "lit";
import {customElement, property} from "lit/decorators.js";
import "@altshiftab/web_components/box";

const elementName = "altshift-button";

@customElement(elementName)
export default class AltShiftButton extends LitElement {
    static formAssociated = true;

    @property()
    type: string = ""

    @property({attribute: "formmethod"})
    formMethod: string | null = null;

    @property({attribute: "formnovalidate", type: Boolean})
    formNoValidate: boolean = false;

    @property({attribute: "formaction"})
    formAction: string | null = null;

    private _internals: ElementInternals;

    static styles = css`
        :host {
            cursor: pointer;

            > altshift-box {
                @media screen and (max-width: 1280px) {
                    &::part(box-container) {
                        font-size: unset;
                        margin-top: unset;
                        border-top: unset;
                    }

                    &::part(compensate-left), &::part(comensate-bottom), &::part(filler) {
                        display: none;
                    }
                }
            }
        }

        ::slotted(a) {
            @media screen and (max-width: 1280px) {
                padding: 0.65625rem 1.75rem;
            }
        }
    `;

    constructor() {
        super();
        this._internals = this.attachInternals();
        this.role = "button";

        this.addEventListener("click", () => {
            if (this.formMethod === "dialog") {
                const dialog = this.closest("dialog");
                if (dialog) {
                    dialog.returnValue = this.formAction || "";
                    return void dialog.close();
                }
            }

            switch (this.type) {
            case "submit":
                return void this._internals.form?.dispatchEvent(
                    new Event("submit", {cancelable: true, bubbles: true})
                );
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
