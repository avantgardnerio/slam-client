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

            // TODO: Un hard code
            if(history.length === 1) {
                self.turn(-Math.PI/2);
            }
            if(history.length == 2) {
                self.drive(12);
            }
        };

        self.turn = function(radians) {
            server.turn(radians, onTurnComplete);
        };

        self.drive = function(inches) {
            server.drive(inches, onDriveComplete);
        };

        // ----------------------------------------- private methods --------------------------------------------------
        var onTurnComplete = function(measuredRads) {
            robots.forEach(function (robot) {
                robot.turn(measuredRads);
            });
            server.scan(onScanComplete);
        };

        var onDriveComplete = function(measuredDist) {
            robots.forEach(function (robot) {
                robot.drive(measuredDist);
            });
            server.scan(onScanComplete);
        };

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