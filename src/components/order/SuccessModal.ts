import { cloneTemplate, ensureElement } from "../../utils/utils";
import { EventEmitter } from "../base/events";

export class SuccessModal {
    private container: HTMLElement;
    private closeButton: HTMLButtonElement;
    private descriptionElement: HTMLElement;

    constructor(private emitter: EventEmitter) {
        this.container = cloneTemplate('#success');
        this.closeButton = ensureElement<HTMLButtonElement>('.order-success__close', this.container);
        this.descriptionElement = ensureElement('.order-success__description', this.container);

        this.setupCloseHandlers();
    }

    public show(total: number) {
        this.descriptionElement.textContent = `Списано ${total} синапсов`;
        document.body.appendChild(this.container);
    }

    private setupCloseHandlers() {
        this.closeButton.addEventListener('click', () => this.close());
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container) this.close();
        });
    }

    private close() {
        this.container.remove();
        this.emitter.emit('modal:close');
    }
}
