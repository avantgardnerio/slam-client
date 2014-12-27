define([
    'jquery',
    'slam/view/RootView'
], function(
    $,
    RootView
) {
    var SlamClientApp = function(el) {
        var self = {};

        var view = new RootView();

        self.start = function() {
            $(el).append(view.getElement());
            view.onLoad();
        };

        return self;
    };

    return SlamClientApp;
});