define([
    'signals',
    'glmat',
    'slam/Math',
    'slam/Robot',
    'slam/MockServer'
], function SlamClient(signals,
                       glmat,
                       Math,
                       Robot,
                       server) {
    var SlamClient = function SlamClient(width, height) {
        var self = {};

        var PX_PER_FT = 40; // TODO: Un hard code
        var IN_PER_FT = 12;
        var PX_PER_IN = PX_PER_FT / IN_PER_FT; // TODO: Sane scaling system

        var doing = false;
        var curBot;
        self.allBots = true;

        // --------------------------------------------- constants ----------------------------------------------------
        var ROBOT_COUNT = 20;

        // --------------------------------------------- events -------------------------------------------------------
        self.invalidate = new signals.Signal();

        // ------------------------------------------- private vars ---------------------------------------------------
        var robots = [];
        var history = [];

        // ------------------------------------------ constructor -----------------------------------------------------
        var ctor = function () {
            for (var i = 0; i < ROBOT_COUNT; i++) {
                robots.push(new Robot('' + i, width, height));
            }
        };

        // ------------------------------------------ public methods --------------------------------------------------
        self.showBot = function (bot) {
            curBot = bot;
        };

        self.showAll = function(val) {
            self.allBots = val;
        };

        self.start = function () {
            server.scan(onScanComplete);
        };

        self.draw = function (ctx) {
            robots.forEach(function (robot) {
                if (curBot === robot) {
                    robot.drawMap(ctx);
                    //robot.drawSamples(ctx);
                }
                if(self.allBots === true || curBot === robot) {
                    robot.drawRobot(ctx);
                }
            });
        };

        self.turn = function (radians) {
            console.log('' + history.length + ' turning');
            server.turn(radians, onTurnComplete);
        };

        self.drive = function (inches) {
            console.log('' + history.length + ' driving');
            server.drive(inches, onDriveComplete);
        };

        self.getRobots = function () {
            return robots;
        };

        // ----------------------------------------- private methods --------------------------------------------------
        self.step = function () {
            if (doing) {
                return;
            }
            doing = true;

            // TODO: Un hard code
            if (history.length === 0) {

            } else if (history.length <= 24) {
                self.drive(6 * PX_PER_IN);
            } else if (history.length <= 25) {
                self.turn(-Math.PI / 2);
            } else if (history.length <= 55) {
                self.drive(6 * PX_PER_IN);
            } else if (history.length <= 56) {
                self.turn(-Math.PI / 2);
            } else if (history.length <= 84) {
                self.drive(6 * PX_PER_IN);
            } else if (history.length <= 85) {
                self.turn(-Math.PI / 2);
            } else if (history.length <= 110) {
                self.drive(6 * PX_PER_IN);
            }
        };

        var onTurnComplete = function (measuredRads) {
            console.log('' + history.length + ' finished turn');
            robots.forEach(function (robot) {
                robot.turn(measuredRads);
            });
            server.scan(onScanComplete);
        };

        var onDriveComplete = function (measuredDist) {
            console.log('' + history.length + ' finished drive');
            robots.forEach(function (robot) {
                robot.drive(measuredDist);
            });
            server.scan(onScanComplete);
        };

        var onScanComplete = function (samples) {
            console.log('' + history.length + ' got samples');
            history.push({action: 'scan', data: samples});

            // Calculate fitness based on how well each robot would have guessed these samples
            robots.forEach(function (robot) {
                robot.fitness(samples);
            });
            var min = robots.reduce(function (prev, robot) {
                return Math.min(prev, robot.cachedFitness)
            }, Number.POSITIVE_INFINITY);
            var max = robots.reduce(function (prev, robot) {
                return Math.max(prev, robot.cachedFitness)
            }, Number.NEGATIVE_INFINITY);
            console.log('best=' + max + ' worst=' + min);
            var range = max - min;
            robots.forEach(function (robot) {
                robot.normalizedFitness = range > 0 ? (robot.cachedFitness - min) / range : 1;
            });

            // Tell the robots to update their maps based on the new data
            robots.forEach(function (robot) {
                robot.applySamples(samples);
            });

            // Find mean position
            var meanPos = robots.reduce(function (meanPos, robot) {
                return glmat.vec2.add(meanPos, meanPos, robot.getPos());
            }, [0, 0]);
            glmat.vec2.scale(meanPos, meanPos, robots.length);

            // Figure out distance and standard deviation
            var dists = robots.map(function (robot) {
                return glmat.vec2.distance(meanPos, robot.getPos());
            });
            var distMean = Math.avg(dists);
            var distStdDv = Math.stddev(dists);
            console.log('distMean=' + distMean + ' distStdDv=' + distStdDv);

            robots.sort(function(a,b) {return a.cachedFitness - b.cachedFitness;});

            doing = false;
            self.invalidate.dispatch();
        };

        ctor();
        return self;
    };

    return SlamClient;
});