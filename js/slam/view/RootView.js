define([
    'jquery'
], function(
    $
) {
    var RootView = function() {
        var self = {};

        var PX_PER_FT = 40; // TODO: Un hard code
        var IN_PER_FT = 12;

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
                    setTimeout(parseMap, 1);
                }
            }
        };

        var parseMap = function() {
            bitmap = [];
            var imgData = ctx.getImageData(0, 0, background.width, background.height).data;
            for(var y = 0; y < background.height; y++) {
                for(var x = 0; x < background.width; x++) {
                    var i = y * background.width * 4 + x * 4;
                    var hasWall = imgData[i + 0] < 50 && imgData[i + 1] < 50 && imgData[i + 2] < 50;
                    bitmap[y * background.width + x] = hasWall;
                }
            }

            ctx.fillStyle = '#0000FF';
            for(var y = 0; y < background.height; y++) {
                for(var x = 0; x < background.width; x++) {
                    var hasWall = bitmap[y * background.width + x];
                    if(hasWall) {
                        ctx.fillRect(x, y, 1, 1);
                    }
                }
            }
        };

        init();
        return self;
    };

    return RootView;
});