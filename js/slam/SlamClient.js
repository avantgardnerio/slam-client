define([
    'signals',
    'slam/Robot',
    'slam/MockServer'
], function SlamClient(signals,
                       Robot,
                       server) {
    var SlamClient = function SlamClient(width, height) {
        var self = {};

        // --------------------------------------------- constants ----------------------------------------------------
        var ROBOT_COUNT = 1;

        // --------------------------------------------- events -------------------------------------------------------
        self.invalidate = new signals.Signal();

        // ------------------------------------------- private vars ---------------------------------------------------
        var robots = [];
        var history = [];

        // ------------------------------------------ constructor -----------------------------------------------------
        var ctor = function () {
            for (var i = 0; i < ROBOT_COUNT; i++) {
                robots.push(new Robot(width, height));
            }
        };

        // ------------------------------------------ public methods --------------------------------------------------
        self.start = function () {
            server.scan(onScanComplete);
        };

        self.draw = function (ctx) {
            robots[0].draw(ctx);
        };

        // ----------------------------------------- private methods --------------------------------------------------
        var onScanComplete = function (samples) {
            history.push({action: 'scan', data: samples});
            robots.forEach(function (robot) {
                robot.applySamples(samples);
            });
            self.invalidate.dispatch();
        };

        ctor();
        return self;
    };

    return SlamClient;
});