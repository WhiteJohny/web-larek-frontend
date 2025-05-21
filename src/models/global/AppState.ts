import { TOrderStep, IProduct, IOrder, TOrderPayment } from '../../types';

import { Model } from '../base/Model';

interface IAppState {
	preview: IProduct;
	basket: Set<IProduct>;
	products: IProduct[];
	order: IOrder;
}

enum AppStateEvents {
	// Событие возникающее при изменении списка товаров каталога
	PRODUCTS_UPDATE = 'products:update',
	// Событие возникающее при изменении preview
	PREVIEW_UPDATE = 'preview:update',
	// Событие возникающее при инициализации корзины
	BASKET_INIT = 'basket:init',
	// Событие возникающее при изменении товаров в корзине
	BASKET_UPDATE = 'basket:update',
	// Событие возникающее при сбросе корзины
	BASKET_RESET = 'basket:reset',
	// Событие возникающее при изменении этапа заказа
	ORDER_STEP = 'order:step',
	// Событие возникающее при изменении поля заказа
	ORDER_UPDATE = 'order:update',
	// Событие возникающее при сбросе заказа
	ORDER_RESET = 'order:reset',
}

class AppState extends Model<IAppState> {
	protected _step: TOrderStep = 'shipment';

	preview: IProduct;

	basket: IProduct[] = [];

	products: IProduct[] = [];

	order: IOrder = {
		items: [],
		payment: '' as TOrderPayment,
		address: '',
		email: '',
		phone: '',
	};

	// Установка этапа оформления заказа
	setStep(value: TOrderStep) {
		this._step = value;

		this.emitChanges(AppStateEvents.ORDER_STEP, {
			data: {
				step: this._step,
			},
		});
	}

	// Установка поля заказа
	setOrderField(field: keyof IOrder, value: unknown) {
		Object.assign(this.order, { [field]: value });

		this.emitChanges(AppStateEvents.ORDER_UPDATE, {
			data: {
				field,
				value,
			},
		});
	}

	// Проверка валидности текущего заказа в зависимости от текущего этапа оформления
	getOrderIsValid() {
		if (this._step === 'shipment') {
			if (
				this.order.address.trim().length == 0 ||
				this.order.payment.trim().length == 0
			) {
				return false;
			}
		}

		if (this._step === 'contacts') {
			if (
				this.order.email.trim().length == 0 ||
				this.order.phone.trim().length == 0
			) {
				return false;
			}
		}

		return true;
	}

	// Получение ошибок текущего заказа в зависимости от текущего этапа оформления
	getOrderErrors() {
		const errors: string[] = [];

		if (this._step === 'shipment') {
			if (this.order.address.trim().length == 0) {
				errors.push('Адрес должен быть заполен');
			}

			if (this.order.payment.trim().length == 0) {
				errors.push('Оплата должна быть выбрана');
			}

			return errors;
		}

		if (this._step === 'contacts') {
			if (this.order.email.trim().length == 0) {
				errors.push('Email должен быть заполен');
			}

			if (this.order.phone.trim().length == 0) {
				errors.push('Телефон должен быть заполнен');
			}

			return errors;
		}

		return errors;
	}

	// Получение полей заказа в виде для взаимодействия с API
	getOrderInvoice() {
		return {
			...this.order,
			items: this.order.items
				.filter((item) => item.price)
				.map((item) => item.id),
			total: this.order.items.reduce(
				(accumulator, current) => accumulator + current.price,
				0
			),
		};
	}

	// Инициализация заказа
	initOrder() {
		this.order.items = this.basket;

		this.setStep('shipment');
	}

	// Сброс всех полей заказа
	resetOrder() {
		this._step = 'shipment';

		this.order.items = [];
		this.order.payment = '' as TOrderPayment;
		this.order.address = '';
		this.order.email = '';
		this.order.phone = '';

		this.emitChanges(AppStateEvents.ORDER_RESET);
	}

	// Установка товаров каталога
	setProductsItems(value: IProduct[]) {
		this.products = value;

		this.emitChanges(AppStateEvents.PRODUCTS_UPDATE, {
			data: {
				items: this.products,
			},
		});
	}

	// Проверка на наличие товара в корзине
	getBasketIsContains(id: string) {
		return this.basket.some((item) => item.id === id);
	}

	// Добавление товара в корзину
	addBasketItem(value: IProduct) {
		if (!this.basket.some((item) => item.id === value.id)) {
			this.basket.push(value);
		}

		this.emitChanges(AppStateEvents.BASKET_UPDATE, {
			data: {
				items: this.basket,
			},
		});
	}

	// Удаление товара из корзины
	removeBasketItem(id: string) {
		this.basket = this.basket.filter((item) => item.id !== id);

		this.emitChanges(AppStateEvents.BASKET_UPDATE, {
			data: {
				items: this.basket,
			},
		});
	}

	// Сброс текущего состояния корзины
	resetBasket() {
		this.basket = [];

		this.emitChanges(AppStateEvents.BASKET_RESET, {
			data: {
				items: this.basket,
			},
		});
	}

	// Инициализация корзины
	initBasket() {
		this.emitChanges(AppStateEvents.BASKET_INIT, {
			data: {
				items: this.basket,
			},
		});
	}

	// Получение цены позиций в корзине
	getBasketPrice() {
		return [...this.basket].reduce(
			(accumulator, current) => accumulator + current.price,
			0
		);
	}

	// Установка текущего просматриваемого элемента
	setPreview(value: IProduct) {
		this.preview = value;

		this.emitChanges(AppStateEvents.PREVIEW_UPDATE, {
			data: {
				item: this.preview,
			},
		});
	}
}

export {
	AppState as AppStateModel,
	AppStateEvents as AppStateModelEvents,
	IAppState,
};
