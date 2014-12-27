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
        var bitmap;

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
            if(background.width > 0 && background.height > 0) {
                ctx.drawImage(background, 0, 0, background.width, background.height);
                if(bitmap === undefined) {
                    parseMap();
                }
            }
        };

        var parseMap = function() {
            bitmap = [];
            var imgData = ctx.getImageData(0, 0, background.width, background.height).data;
            for(var y = 0; y < background.height; y++) {
                for(var x = 0; x < background.width; x++) {
                    var i = y * background.height * 3 + x * 3;
                    var hasWall = imgData[i + 0] < 255 || imgData[i + 0] < 255 || imgData[i + 0] < 255;
                    bitmap[y * background.height + x] = hasWall;
                }
            }
        };

        init();
        return self;
    };

    return RootView;
});