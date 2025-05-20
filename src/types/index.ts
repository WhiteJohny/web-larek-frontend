// Товар

interface IProduct {
	id: string;
    description: string;
    image: string;
    title: string;
	category: string;
    price: number | null;
}

// Заказ

type TOrderPayment = 'cash' | 'card';

interface IOrder {
	items: IProduct[];
	payment: TOrderPayment;
	address: string;
	email: string;
	phone: string;
}

type TOrderStep = 'shipment' | 'contacts';

type TOrderInvoice = Omit<IOrder, 'items'> & {
	items: string[];
	total: number;
};

interface IOrderResult {
	id: string;
	total: number;
}

export { IProduct, TOrderInvoice, TOrderPayment, TOrderStep, IOrder, IOrderResult };
