define([
    'jquery'
], function(
    $
) {
    var RootView = function() {
        var self = {};

        var cnvMain = $('<canvas/>');

        self.getElement = function() {
            return cnvMain;
        };

        self.onLoad = function() {

        };

        return self;
    };

    return RootView;
});