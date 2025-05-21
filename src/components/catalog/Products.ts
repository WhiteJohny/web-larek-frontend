import { TViewNested, View } from '../base/View';

type TProductsRenderArgs<T extends object> = {
	items: TViewNested<T>[];
};

class Products extends View {
	set items(value: TViewNested[]) {
		this._element.replaceChildren(
			...value.map(({ view, renderArgs }) =>
				view instanceof View ? view.render(renderArgs) : view
			)
		);
	}

	render<RenderArgs extends object = object>(
		args: TProductsRenderArgs<RenderArgs>
	) {
		super.render(args);

		return this._element;
	}
}

export { Products as ProductsView, TProductsRenderArgs };
