import {html, LitElement} from "lit";
import {customElement} from "lit/decorators.js";
import AltShiftBox from "./box.js";

const elementName = "altshift-button";

@customElement(elementName)
export default class AltShiftButton extends LitElement {
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
