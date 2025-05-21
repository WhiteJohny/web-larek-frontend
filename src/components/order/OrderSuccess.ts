import { TViewConstructionArgs, View } from '../base/View';

type TOrderSuccessRenderArgs = {
	description: string;
};

type TOrderSuccessEventHandlers = {
	onClick?: (args: { _event: MouseEvent }) => void;
};

class OrderSuccess extends View<
	HTMLElement,
	TOrderSuccessRenderArgs,
	TOrderSuccessEventHandlers
> {
	protected _descriptionElement: HTMLElement;
	protected _buttonElement: HTMLButtonElement;

	constructor(
		args: TViewConstructionArgs<HTMLElement, TOrderSuccessEventHandlers>
	) {
		super(args);

		this._descriptionElement = this._element.querySelector(
			'.order-success__description'
		);

		this._buttonElement = this._element.querySelector('.order-success__close');

		if (this._eventHandlers.onClick instanceof Function) {
			this._buttonElement.addEventListener(
				'click',
				this._handleClick.bind(this)
			);
		}
	}

	protected _handleClick(event: MouseEvent) {
		this._eventHandlers.onClick({
			_event: event,
		});
	}

	set description(value: string) {
		this._descriptionElement.textContent = String(value);
	}
}

export {
	OrderSuccess as OrderSuccessView,
	TOrderSuccessRenderArgs,
	TOrderSuccessEventHandlers,
};
