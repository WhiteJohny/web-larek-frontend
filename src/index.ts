// Импорт стилей и модулей
import './scss/styles.scss';
import { CDN_URL, API_URL, settings } from './utils/constants';
import { EventEmitter } from './components/base/events';
import { ShopAPI } from './components/special/ShopApi';
import { AppStateModelEvents, AppStateModel } from './models/global/AppState';
import { IOrder, IProduct, TOrderStep } from './types';
import { ProductsView } from './components/catalog/Products';
import { cloneTemplate, ensureElement, formatPrice, getKeyByValueTranslation } from './utils/utils';
import { ProductView, TProductRenderArgs } from './components/catalog/Product';
import { TViewNested } from './components/base/View';
import { PageView } from './components/global/Page';
import { HeaderView } from './components/global/Header';
import { ModalView, ModalViewEvents } from './components/global/Modal';
import { ProductPreviewView, TProductPreviewRenderArgs } from './components/catalog/ProductPreview';
import { BasketItemView, TBasketItemRenderArgs } from './components/basket/BasketItem';
import { BasketView, TBasketRenderArgs } from './components/basket/Basket';
import { OrderShipmentView, TOrderShipmentRenderArgs } from './components/order/OrderShipment';
import { OrderContactsView, TOrderContactsRenderArgs } from './components/order/OrderContacts';
import { OrderSuccessView, TOrderSuccessRenderArgs } from './components/order/OrderSuccess';

// Инициализация основных компонентов приложения
// ----------------------------------------------------------------

/**
 * Глобальный шин событий для коммуникации между компонентами
 */
const eventEmitter = new EventEmitter();

/**
 * API клиент для взаимодействия с сервером
 */
const api = new ShopAPI(CDN_URL, API_URL);

/**
 * Глобальное состояние приложения
 */
const appStateModel = new AppStateModel({}, eventEmitter);

// Инициализация основных UI компонентов
// ----------------------------------------------------------------

/**
 * Контроллер страницы (блокировка/разблокировка скролла)
 */
const pageView = new PageView({
  element: ensureElement('.page'),
  eventEmitter,
});

/**
 * Хедер приложения (отображение количества товаров в корзине)
 */
const headerView = new HeaderView({
  element: ensureElement('.header'),
  eventEmitter,
  eventHandlers: {
    onClick: () => appStateModel.initBasket(),
  },
});

/**
 * Модальное окно (управление вложенными модальными представлениями)
 */
const modalView = new ModalView({
  element: ensureElement('#modal-container'),
  eventEmitter,
});

/**
 * Представление каталога товаров
 */
const productsView = new ProductsView({
  element: ensureElement('main.gallery'),
  eventEmitter,
});

/**
 * Представление корзины с товарами
 */
const basketView = new BasketView({
  element: cloneTemplate('#basket'),
  eventEmitter,
  eventHandlers: {
    onClick: () => appStateModel.initOrder(),
  },
});

// Обработка глобальных событий приложения
// ----------------------------------------------------------------

// Блокировка страницы при открытии модального окна
eventEmitter.on(ModalViewEvents.OPEN, () => {
  pageView.isLocked = true;
});

// Разблокировка страницы при закрытии модального окна
eventEmitter.on(ModalViewEvents.CLOSE, () => {
  pageView.isLocked = false;
});

// Обновление счетчика товаров в хедере
eventEmitter.on<{ data: { items: IProduct[] } }>(
  RegExp(`${AppStateModelEvents.BASKET_UPDATE}|${AppStateModelEvents.BASKET_RESET}`),
  ({ data }) => {
    headerView.render({ counter: data.items.length });
  }
);

// Обновление содержимого корзины
eventEmitter.on<{ data: { items: IProduct[] } }>(
  RegExp(`${AppStateModelEvents.BASKET_UPDATE}|${AppStateModelEvents.BASKET_INIT}`),
  ({ data }) => {
    const basketTotalPrice = appStateModel.getBasketPrice();
    const basketItems = data.items.map(createBasketItemView);

    modalView.render<TBasketRenderArgs<TBasketItemRenderArgs>>({
      content: {
        view: basketView,
        renderArgs: {
          isDisabled: data.items.length === 0,
          price: basketTotalPrice ? formatPrice(basketTotalPrice, settings.CURRENCY_TITLES) : '',
          items: basketItems,
        },
      },
    });
  }
);

// Просмотр деталей товара
eventEmitter.on<{ data: { item: IProduct } }>(
  AppStateModelEvents.PREVIEW_UPDATE,
  ({ data }) => {
    const previewView = createProductPreviewView(data.item);
    modalView.render<TProductPreviewRenderArgs>({ content: previewView });
  }
);

// Обновление каталога товаров
eventEmitter.on<{ data: { items: IProduct[] } }>(
  AppStateModelEvents.PRODUCTS_UPDATE,
  ({ data }) => {
    const productViews = data.items.map(createProductView);
    productsView.render<TProductRenderArgs>({ items: productViews });
  }
);

// Обработка этапов оформления заказа
eventEmitter.on<{ data: { step: TOrderStep } }>(
  AppStateModelEvents.ORDER_STEP,
  ({ data }) => {
    switch (data.step) {
      case 'shipment':
        handleShipmentStep();
        break;
      case 'contacts':
        handleContactsStep();
        break;
    }
  }
);

// Вспомогательные функции
// ----------------------------------------------------------------

/** Создание представления товара в корзине */
function createBasketItemView(item: IProduct, index: number) {
  const view = new BasketItemView({
    element: cloneTemplate('#card-basket'),
    eventEmitter,
    eventHandlers: { onClick: () => appStateModel.removeBasketItem(item.id) },
  });

  return {
    view,
    renderArgs: {
      ...item,
      index: index + 1,
      price: formatPrice(item.price, settings.CURRENCY_TITLES),
    } as TBasketItemRenderArgs,
  };
}

/** Создание представления превью товара */
function createProductPreviewView(item: IProduct) {
  const isInBasket = appStateModel.getBasketIsContains(item.id);
  const previewView = new ProductPreviewView({
    element: cloneTemplate('#card-preview'),
    eventEmitter,
    eventHandlers: {
      onClick: () => toggleBasketItem(item, isInBasket),
    },
  });

  return {
    view: previewView,
    renderArgs: {
      ...item,
      color: getKeyByValueTranslation(item.category.toLowerCase(), settings.CATEGORY_COLORS_TITLES),
      isDisabled: !item.price,
      price: formatPrice(item.price, settings.CURRENCY_TITLES),
      buttonText: isInBasket ? 'Удалить из корзины' : 'Купить',
    } as TProductPreviewRenderArgs,
  };
}

/** Переключение состояния товара в корзине */
function toggleBasketItem(item: IProduct, isInBasket: boolean) {
  isInBasket 
    ? appStateModel.removeBasketItem(item.id) 
    : appStateModel.addBasketItem(item);
}

/** Создание представления товара в каталоге */
function createProductView(item: IProduct) {
  const view = new ProductView({
    element: cloneTemplate('#card-catalog'),
    eventEmitter,
    eventHandlers: { onClick: () => appStateModel.setPreview(item) },
  });

  return {
    view,
    renderArgs: {
      ...item,
      color: getKeyByValueTranslation(item.category.toLowerCase(), settings.CATEGORY_COLORS_TITLES),
      price: formatPrice(item.price, settings.CURRENCY_TITLES),
    } as TProductRenderArgs,
  };
}

/** Обработка этапа оформления доставки */
function handleShipmentStep() {
  const shipmentView = new OrderShipmentView({
    element: cloneTemplate('#order'),
    eventEmitter,
    eventHandlers: createOrderHandlers('contacts'),
  });

  modalView.render<TOrderShipmentRenderArgs>({
    content: {
      view: shipmentView,
      renderArgs: getOrderRenderArgs(),
    },
  });
}

/** Обработка этапа оформления контактов */
function handleContactsStep() {
  const contactsView = new OrderContactsView({
    element: cloneTemplate('#contacts'),
    eventEmitter,
    eventHandlers: createOrderHandlers('submit'),
  });

  modalView.render<TOrderContactsRenderArgs>({
    content: {
      view: contactsView,
      renderArgs: getOrderRenderArgs(),
    },
  });
}

/** Создание обработчиков для формы заказа */
function createOrderHandlers(nextStep: TOrderStep | 'submit') {
    return {
      onSubmit: () => {
        nextStep === 'submit' 
          ? submitOrder() 
          : appStateModel.setStep(nextStep);
      },
      onInput: (args: { 
        _event: InputEvent; 
        field: string; 
        value: unknown 
      }) => {
        // Добавляем проверку типа для value
        if (typeof args.value === 'string') {
          appStateModel.setOrderField(
            args.field as keyof IOrder, 
            args.value
          );
        }
      }
    };
  }

/** Получение данных для рендеринга формы заказа */
function getOrderRenderArgs() {
  return {
    ...appStateModel.getOrderInvoice(),
    errors: appStateModel.getOrderErrors(),
    isDisabled: !appStateModel.getOrderIsValid(),
  };
}

/** Отправка заказа на сервер */
function submitOrder() {
  api.createOrder(appStateModel.getOrderInvoice())
    .then(handleOrderSuccess)
    .catch(handleOrderError);
}

/** Обработка успешного оформления заказа */
function handleOrderSuccess(data: { total: number }) {
  appStateModel.resetOrder();
  appStateModel.resetBasket();

  const successView = new OrderSuccessView({
    element: cloneTemplate('#success'),
    eventEmitter,
    eventHandlers: { onClick: () => modalView.close() },
  });

  modalView.render<TOrderSuccessRenderArgs>({
    content: {
      view: successView,
      renderArgs: {
        description: `Списано ${formatPrice(data.total, settings.CURRENCY_TITLES)}`,
      },
    },
  });
}

/** Обработка ошибки оформления заказа */
function handleOrderError(error: Error) {
  console.error('Ошибка оформления заказа:', error);
  // Реализовать отображение ошибки пользователю
}

// Инициализация приложения
// ----------------------------------------------------------------
api.getProducts()
  .then(products => appStateModel.setProductsItems(products))
  .catch(error => console.error('Ошибка загрузки товаров:', error));
