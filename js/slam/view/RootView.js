define([
    'jquery'
], function(
    $
) {
    var RootView = function() {
        var self = {};

        var PX_PER_FT = 40; // TODO: Un hard code

        var cnvMain;
        var ctx;
        var background;

        var init = function() {
            cnvMain = $('<canvas/>')[0];
            ctx = cnvMain.getContext("2d");

            background = $('<img/>')[0];
            $(background).ready(function() { self.invalidate(); });
            $(background).attr('src', 'img/floor_plan_example.png'); // TODO: Un hard code

            $(window).resize(onResize);
            onResize();
        };

        self.getElement = function() {
            return cnvMain;
        };

        self.onLoad = function() {
            self.invalidate();
        };

        self.invalidate = function() {
            window.requestAnimationFrame(draw);
        };


        var onResize = function() {
            $(cnvMain).attr('width', $(window).innerWidth());
            $(cnvMain).attr('height', $(window).innerHeight());
            self.invalidate();
        };

        var draw = function() {
            ctx.drawImage(background, 0, 0, background.width, background.height);
        };

        init();
        return self;
    };

    return RootView;
});