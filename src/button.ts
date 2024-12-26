import {html, LitElement, css, nothing} from "lit";
import {customElement, property, query} from "lit/decorators.js";
import "@altshiftab/web_components/box";

const elementName = "altshift-button";

@customElement(elementName)
export default class AltShiftButton extends LitElement {
    @property()
    type: string = ""

    @query("input")
    private _inputElement: HTMLElement | null;

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
        this.role = "button";

        this._inputElement = null;

        this.addEventListener("click", () => {
            this._inputElement?.click();
        });
    }

    render() {
        const inputElement = this.type === "submit" || this.type === "reset"
            ? html`<input type="${this.type}"/>`
            : null
        ;

        return html`
            <altshift-box animated selectable textBox>
                <slot></slot>
            </altshift-box>
            ${inputElement || nothing}
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [elementName]: AltShiftButton
    }
}
