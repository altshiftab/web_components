import {html, LitElement, css} from "lit";
import {customElement, property} from "lit/decorators.js";
import "@altshiftab/web_components/box";

const elementName = "altshift-button";

@customElement(elementName)
export default class AltShiftButton extends LitElement {
    static formAssociated = true;

    @property()
    type: string = ""

    private _internals: ElementInternals;

    static styles = css`
        :host {
            cursor: pointer;
        }
        input {
            display: none;
        }
    `;

    constructor() {
        super();
        this._internals = this.attachInternals();
        this.role = "button";

        this.addEventListener("click", () => {
            switch (this.type) {
            case "submit":
                return void this._internals.form?.submit();
            case "reset":
                return void this._internals.form?.reset();
            }
        });
    }

    render() {
        return html`
            <altshift-box animated selectable textBox>
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
