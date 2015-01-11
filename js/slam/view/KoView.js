define([
	'knockout',
	'jquery',
	'slam/view/TemplateView'
], function(
	ko,
	$,
	TemplateView
) {

	// ---------------------------------------------- class definition ------------------------------------------------
	var KoView = function() {
		var self = new TemplateView();

		var bound = false;

		// ------------------------------ knockout.js binding defs ----------------------------------------------------
		ko.bindingHandlers.stopBinding = {
			init: function() {
				return { controlsDescendantBindings: true };
			}
		};

		ko.virtualElements.allowedBindings.stopBinding = true;

		// --------------------------------------------- overrides ----------------------------------------------------
		var onLoad = self.onLoad;
		self.onLoad = function(url) {
			onLoad(url);
			if(bound === false) {
				ko.applyBindings(self, self.getElement());
				bound = true;
			}
		};

		var onUnload = self.onUnload;
		self.onUnload = function(){
			// clean up after ourselves
			if(bound === true) {
				ko.unapplyBindings(self.getElement());
				bound = false;
			}

			// do any parent stuff last
			onUnload();
		};

		// Fix KO so that it doesn't leak memory
		// http://www.mberkompas.com/2012/11/knockoutjs-unapply-bindings/
		ko.unapplyBindings = function (node, remove) {
			var $node = $(node);

			// unbind events
			$node.find('*').each(function () {
				$(this).unbind();
			});

			// Remove KO subscriptions and references
			if (remove) {
				ko.removeNode($node[0]);
			} else {
				ko.cleanNode($node[0]);
			}
		};

		return self;
	};
	
	return KoView;
});