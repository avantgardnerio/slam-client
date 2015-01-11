define([
	'jquery',
	'slam/view/BaseView'
], function(
	$,
	BaseView
) {

	// ---------------------------------------------- class definition ------------------------------------------------
	var BasePage = function() {
		var self = new BaseView();
		
		// ------------------------------------------ private members -------------------------------------------------
		var el;
		
		// ------------------------------------------ protected methods -----------------------------------------------
		self.getElement = function() {
			if(el === undefined) {
				var template = self._getTemplate();
				el = $.parseHTML(template)[0];
			}
			return el;
		};

		self._destroy = function() {
			el = undefined;
		};
		
		// ------------------------------------------- virtual methods ------------------------------------------------
		self._getTemplate = function() {
			throw new NotImplementedException();
		};
		
		return self;
	};
	
	return BasePage;
});