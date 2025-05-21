import { TViewConstructionArgs } from '../base/View';

import { FormView, TFormEventHandlers, TFormRenderArgs } from '../global/Form';

type TOrderContactsRenderArgs = {
	email: string;
	phone: string;
} & TFormRenderArgs;

class OrderContacts extends FormView<
	HTMLFormElement,
	TOrderContactsRenderArgs
> {
	protected _inputEmailElement: HTMLInputElement;
	protected _inputPhoneElement: HTMLInputElement;

	constructor(
		args: TViewConstructionArgs<HTMLFormElement, TFormEventHandlers>
	) {
		super(args);

		this._inputEmailElement = this._element.querySelector(
			'input[name="email"]'
		);

		this._inputPhoneElement = this._element.querySelector(
			'input[name="phone"]'
		);
	}

	set email(value: string) {
		this._inputEmailElement.value = String(value);
	}

	set phone(value: string) {
		this._inputPhoneElement.value = String(value);
	}
}

export { OrderContacts as OrderContactsView, TOrderContactsRenderArgs };
