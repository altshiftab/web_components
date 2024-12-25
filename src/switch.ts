import {css, CSSResultGroup, html, LitElement} from "lit";
import {customElement, property, query} from "lit/decorators.js";

const switchElementName = "altshift-switch";

export const toggledSwitchEventType = "switchToggled";

interface ToggledEventDetails {
    toggled: boolean;
    value?: string;
}

export class ToggledEvent extends CustomEvent<ToggledEventDetails> {
    constructor(toggled: boolean, value?: string) {
        super(toggledSwitchEventType, {
            detail: {toggled, value},
            bubbles: true,
            cancelable: true,
            composed: true
        });
    }
}

@customElement(switchElementName)
export class AltShiftSwitch extends LitElement {
    @property({type: Boolean, reflect: true})
    toggled: boolean = false;

    static styles = css`
        :host {
            --border-width: var(--altshift-border-width, 0.125rem);
            --border-color: var(--altshift-border-color, #252525);
            --opposite-main-color: var(--altshift-opposite-main-color, #252525);
            --ease-time: 0.3s;

            cursor: pointer;
            height: calc(10* var(--border-width));
            width: calc(2 * 10 * var(--border-width));
            border: var(--border-width) solid var(--border-color);
            padding: calc(1.5 * var(--border-width)) calc(1.5 * var(--border-width));
        }

        :host([toggled]) .button-segment {
            left: 50%;
        }

        :host(:focus-visible) {
            outline: var(--border-color) solid calc(0.5 * var(--border-width));
        }

        .button-segment {
            position: relative;
            left: 0;
            height: 100%;
            width: 50%;
        }
        @media not (prefers-reduced-motion) {
            .button-segment {
                transition: left ease var(--ease-time);
            }
        }

        .button-segment__content {
            height: 100%;
            background-color: var(--opposite-main-color);
        }
    ` as CSSResultGroup;

    _click() {
        this.toggled = !this.toggled;
        this.dispatchEvent(new ToggledEvent(this.toggled));
    }

    constructor() {
        super();
        this.tabIndex = 1;
        this.role = "button";

        this.addEventListener("click", this._click.bind(this));

        this.addEventListener("keydown", (event: KeyboardEvent) => {
            if (event.key === 'Enter' || event.key === ' ') {
                this._click();
                event.preventDefault();
            }
        });
    }

    render() {
        return html`
            <div class="button-segment">
                <div class="button-segment__content"></div>
            </div>
        `;
    }
}

const switchLabelledElementName = "altshift-switch-labelled";

@customElement(switchLabelledElementName)
export class AltShiftSwitchLabelled extends LitElement {
    @property({type: Boolean, reflect: true})
    get toggledRight(): boolean {
        return this._switch?.toggled ?? false;
    }

    set toggledRight(value: boolean) {
        if (this._switch) {
            this._switch.toggled = value;
        }
    }

    @property()
    left: string = "";

    @property()
    right: string = "";

    @query(switchElementName)
    private _switch!: AltShiftSwitch

    static styles = css`
        :host {
            display: flex;
        }

        .text-container {
            display: flex;
            justify-content: center;
            align-items: center;

            font-size: 0.625rem;
            letter-spacing: 0.1rem;
            font-weight: 700;
            line-height: 0.8125rem;
            text-transform: uppercase;
            user-select: none;
            white-space: nowrap;

            &:first-of-type {
                padding: 0 0.5rem;
            }

            &:last-of-type {
                padding: 0 0 0 0.5rem;
            }
        }
    ` as CSSResultGroup;

    get value(): string {
        return this.toggledRight ? this.right : this.left;
    }

    constructor() {
        super();
        this.addEventListener(toggledSwitchEventType, (event: ToggledEvent) => {
            event.detail.value = this.value;
        });
    }

    render() {
        return html`
            <div class="text-container">${this.left}</div>
            <altshift-switch></altshift-switch>
            <div class="text-container">${this.right}</div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [switchElementName]: AltShiftSwitch,
        [switchLabelledElementName]: AltShiftSwitchLabelled
    }

    interface HTMLElementEventMap {
        [toggledSwitchEventType]: CustomEvent;
    }
}
