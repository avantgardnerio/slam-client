define([
], function(
) {
	var BaseView = function() {
		var self = {};
		
		self.onLoad = function() {
		};
		
		self.onUnload = function() {
		};
		
		self.getElement = function() {
			throw 'not implemented!';
		};
		
		return self;
	};
	
	return BaseView;
});