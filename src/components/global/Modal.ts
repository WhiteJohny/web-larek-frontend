import { TViewConstructionArgs, TViewNested, View } from '../base/View';

type TModalRenderArgs<T extends object> = {
	content: TViewNested<T>;
};

enum ModalEvents {
	CLOSE = 'modal:close',
	OPEN = 'modal:open',
}

class Modal extends View {
	protected _content: TViewNested;

	protected _closeButtonElement: HTMLButtonElement;
	protected _contentElement: HTMLElement;

	constructor(args: TViewConstructionArgs) {
		super(args);

		this._closeButtonElement = this._element.querySelector('.modal__close');
		this._contentElement = this._element.querySelector('.modal__content');

		this._element.addEventListener('click', this._handleClick.bind(this));

		document.addEventListener(
			'keydown',
			this._handleDocumentKeydown.bind(this)
		);
	}

	protected _handleClick(event: MouseEvent) {
		event.stopPropagation();

		if (
			this._closeButtonElement.contains(event.target as HTMLElement) ||
			event.target === this._element
		) {
			this.close();
		}
	}

	protected _handleDocumentKeydown(event: KeyboardEvent) {
		if (
			event.key === 'Escape' &&
			this._element.classList.contains('modal_active')
		) {
			this.close();
		}
	}

	open() {
		this._element.classList.add('modal_active');

		this._closeButtonElement.focus();

		this._eventEmitter.emit(ModalEvents.OPEN);
	}

	close() {
		this._element.classList.remove('modal_active');

		this.content = null;

		this._eventEmitter.emit(ModalEvents.CLOSE);
	}

	set content(value: TViewNested | null) {
		if (value) {
			this._contentElement.replaceChildren(
				value.view instanceof View
					? value.view.render(value.renderArgs)
					: (value as unknown as (string | Node)[])
			);
		} else {
			this._contentElement.replaceChildren();
		}
	}

	render<RenderArgs extends object = object>(
		args: TModalRenderArgs<RenderArgs>
	) {
		super.render(args);

		this.open();

		return this._element;
	}
}

export { Modal as ModalView, ModalEvents as ModalViewEvents, TModalRenderArgs };
