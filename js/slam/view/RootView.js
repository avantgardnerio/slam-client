define([
    'jquery',
    'slam/MockRobot',
    'slam/Map'
], function(
    $,
    Robot,
    Map
) {
    var RootView = function() {
        var self = {};

        var PX_PER_FT = 40; // TODO: Un hard code
        var IN_PER_FT = 12;
        var PX_PER_IN = PX_PER_FT / IN_PER_FT;

        var cnvMain;
        var ctx;
        var background;
        var robot = new Robot();
        var map;
        var timer;

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
            if(background.width <= 0 || background.height <= 0) {
                console.log('No image yet!');
                return;
            }

            // Image
            ctx.drawImage(background, 0, 0, background.width, background.height);

            // Map
            if(map === undefined) {
                if(timer === undefined) {
                    timer = setTimeout(parseMap, 1);
                }
            } else {
                //map.draw(ctx, PX_PER_IN);
                robot.draw(ctx, PX_PER_IN);
            }
        };

        var tick = function() {
            robot.turn(1, self.invalidate);
            robot.drive(36 * PX_PER_IN, self.invalidate);
            self.invalidate();
        };

        var parseMap = function() {
            var imgData = ctx.getImageData(0, 0, background.width, background.height).data;
            map = new Map(imgData, background.width, background.height);
            self.invalidate();
            setInterval(tick, 100);
        };

        init();
        return self;
    };

    return RootView;
});