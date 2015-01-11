define([
    'signals',
    'slam/Robot',
    'slam/MockServer'
], function SlamClient(signals,
                       Robot,
                       server) {
    var SlamClient = function SlamClient(width, height) {
        var self = {};

        var PX_PER_FT = 40; // TODO: Un hard code
        var IN_PER_FT = 12;
        var PX_PER_IN = PX_PER_FT / IN_PER_FT; // TODO: Sane scaling system

        var doing = false;

        // --------------------------------------------- constants ----------------------------------------------------
        var ROBOT_COUNT = 5;

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
            robots.forEach(function(robot) {
                if(robot.bestFit) {
                    robot.drawMap(ctx);
                }
                robot.drawRobot(ctx);
            });
            doNext();
        };

        self.turn = function(radians) {
            console.log('' + history.length + ' turning');
            server.turn(radians, onTurnComplete);
        };

        self.drive = function(inches) {
            console.log('' + history.length + ' driving');
            server.drive(inches, onDriveComplete);
        };

        // ----------------------------------------- private methods --------------------------------------------------
        var doNext = function() {
            if(doing) {
                return;
            }
            doing = true;

            // TODO: Un hard code
            if(history.length === 0) {

            } else if(history.length <= 1) {
                self.turn(-Math.PI/2);
            } else if(history.length <= 14) {
                self.drive(12 * PX_PER_IN);
            } else if(history.length <= 15) {
                self.turn(-Math.PI/2);
            } else if(history.length <= 30) {
                self.drive(12 * PX_PER_IN);
            } else if(history.length <= 31) {
                self.turn(-Math.PI/2);
            } else if(history.length <= 42) {
                self.drive(12 * PX_PER_IN);
            }
        };

        var onTurnComplete = function(measuredRads) {
            console.log('' + history.length + ' finished turn');
            robots.forEach(function (robot) {
                robot.turn(measuredRads);
            });
            server.scan(onScanComplete);
        };

        var onDriveComplete = function(measuredDist) {
            console.log('' + history.length + ' finished drive');
            robots.forEach(function (robot) {
                robot.drive(measuredDist);
            });
            server.scan(onScanComplete);
        };

        var onScanComplete = function (samples) {
            console.log('' + history.length + ' got samples');
            history.push({action: 'scan', data: samples});
            var bestFit = 0;
            var bestIdx = undefined;
            for(var i = 0; i < robots.length; i++) {
                var robot = robots[i];
                var fitness = robot.fitness(samples);
                if(fitness > bestFit) {
                    bestFit = fitness;
                    bestIdx = i;
                }
                console.log('Robot' + i + ' fitness=' + fitness);
                robot.applySamples(samples);
            }
            for(var i = 0; i < robots.length; i++) {
                robots[i].bestFit = i === bestIdx;
            }
            doing = false;
            self.invalidate.dispatch();
        };

        ctor();
        return self;
    };

    return SlamClient;
});