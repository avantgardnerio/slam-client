define([
    'signals',
    'glmat',
    'slam/Map',
    'slam/Math',
    'slam/Robot',
    'slam/MockServer'
], function SlamClient(signals,
                       glmat,
                       Map,
                       Math,
                       Robot,
                       server) {
    var SlamClient = function SlamClient(width, height) {
        var self = {};

        // --------------------------------------------- constants ----------------------------------------------------
        var ROBOT_COUNT = 100;
        var PX_PER_FT = 30; // TODO: Un hard code
        var IN_PER_FT = 12;
        var PX_PER_IN = PX_PER_FT / IN_PER_FT; // TODO: Sane scaling system
        var MAX_DRIVE = 6 * PX_PER_IN;

        var waypoints = [
            [800, 700], // By bottom right door
            [800, 200], // Top Right of map
            [550, 200], // between door and counter
            [550, 300],
            [350, 300],
            [350, 200],
            [200, 200],
            [200, 300],
            [250, 300],
            [250, 500],
            [250, 840],
            [800, 830]
        ];
        var waypointIdx = 1;

        var doing = false;
        var curBot;
        var deadBots = [];
        self.allBots = true;
        self.autoStep = false;
        var map = new Map(width, height);

        // --------------------------------------------- events -------------------------------------------------------
        self.invalidate = new signals.Signal();

        // ------------------------------------------- private vars ---------------------------------------------------
        var robots = [];
        var history = [];
        var iterations = 0;

        // ------------------------------------------ constructor -----------------------------------------------------
        var ctor = function () {
            server.setPos(waypoints[0]);
            for (var i = 0; i < ROBOT_COUNT; i++) {
                var bot = new Robot('' + i, width, height, map);
                bot.setPos(waypoints[0]);
                robots.push(bot);
            }
        };

        // ------------------------------------------ public methods --------------------------------------------------
        self.showBot = function (bot) {
            curBot = bot;
        };

        self.showAll = function (val) {
            self.allBots = val;
        };

        self.autoDrive = function (val) {
            self.autoStep = val;
        };

        self.start = function () {
            server.scan(onScanComplete);
        };

        self.draw = function (ctx) {
            robots.forEach(function (robot) {
                if (curBot === robot) {
                    robot.drawMap(ctx);
                    robot.drawSamples(ctx);
                }
                if (self.allBots === true || curBot === robot) {
                    robot.drawRobot(ctx);
                }
            });
            deadBots.forEach(function (robot) {
                ctx.strokeStyle = '#FF0000';
                var pos = robot.pos;
                var dir = robot.ang;
                ctx.translate(pos[0], pos[1]);
                ctx.rotate(dir);

                ctx.strokeRect(-server.SIZE[0] / 2 * PX_PER_IN, -server.SIZE[1] / 2 * PX_PER_IN, server.SIZE[0] * PX_PER_IN, server.SIZE[1] * PX_PER_IN);
                ctx.beginPath();
                ctx.moveTo(-server.SIZE[0] / 2 * PX_PER_IN, -server.SIZE[1] / 2 * PX_PER_IN);
                ctx.lineTo(server.SIZE[0] / 2 * PX_PER_IN, server.SIZE[1] / 2 * PX_PER_IN);
                ctx.moveTo(server.SIZE[0] / 2 * PX_PER_IN, -server.SIZE[1] / 2 * PX_PER_IN);
                ctx.lineTo(-server.SIZE[0] / 2 * PX_PER_IN, server.SIZE[1] / 2 * PX_PER_IN);
                ctx.stroke();

                ctx.rotate(-dir);
                ctx.translate(-pos[0], -pos[1]);
            });
            if (self.autoStep) {
                self.step();
            }
        };

        self.turn = function (radians) {
            console.log('' + iterations + ' turning');
            server.turn(radians, onTurnComplete);
        };

        self.drive = function (inches) {
            console.log('' + iterations + ' driving ' + inches);
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

            var curPos = server.getPos();
            var nxtPos = waypoints[waypointIdx];

            // At destination, pick next waypoint
            if (glmat.vec2.dist(curPos, nxtPos) < 3 * PX_PER_IN) {
                waypointIdx = (waypointIdx + 1) % waypoints.length;
                nxtPos = waypoints[waypointIdx];
            }

            // Turn
            var delta = glmat.vec2.sub([], nxtPos, curPos);
            var curAng = server.getAngle();
            var nxtAng = Math.atan2(delta[1], delta[0]);
            if (Math.abs(curAng - nxtAng) > 0.01) {
                self.turn(nxtAng - curAng);
                return;
            }

            // Drive
            var dist = glmat.vec2.length(delta);
            var stepCount = Math.ceil(dist / MAX_DRIVE);
            var stepDist = dist / stepCount;
            self.drive(stepDist);
        };

        var onTurnComplete = function (measuredRads) {
            //console.log('' + iterations + ' finished turn');
            robots.forEach(function (robot) {
                robot.turn(measuredRads);
            });
            server.scan(onScanComplete);
        };

        var onDriveComplete = function (measuredDist) {
            //console.log('' + iterations + ' finished drive');
            robots.forEach(function (robot) {
                robot.drive(measuredDist);
            });
            server.scan(onScanComplete);
        };

        var getStats = function (robots) {
            // Figure out distance and standard deviation
            var meanPos = robots.reduce(function (meanPos, robot) {
                return glmat.vec2.add(meanPos, meanPos, robot.getPos());
            }, [0, 0]);
            glmat.vec2.scale(meanPos, meanPos, 1 / robots.length);
            var dists = robots.map(function (robot) {
                return glmat.vec2.distance(meanPos, robot.getPos());
            });
            var distMean = Math.avg(dists);
            var distStdDv = Math.stddev(dists);

            // Figure out fitness stddev
            var fitnesses = robots.map(function (robot) {
                return robot.cachedFitness;
            });
            var fitMean = Math.avg(fitnesses);
            var fitStdDv = Math.stddev(fitnesses);
            return {
                meanPos: meanPos,
                distMean: distMean,
                distStdDv: distStdDv,
                fitMean: fitMean,
                fitStdDv: fitStdDv
            };
        };

        var onScanComplete = function (samples) {
            //console.log('' + iterations + ' got samples');
            //history.push({action: 'scan', data: samples});
            iterations++;

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
            //console.log('best=' + max + ' worst=' + min);
            var range = max - min;
            robots.forEach(function (robot) {
                robot.normalizedFitness = range > 0 ? (robot.cachedFitness - min) / range : 1;
            });

            // Cull the bad bots
            var stats = getStats(robots);
            console.log('distMean=' + stats.distMean + ' distStdDv=' + stats.distStdDv + ' fitMean=' + stats.fitMean + ' fitStdDv=' + stats.fitStdDv);
            if (stats.fitStdDv > 0.01) {
                var goodBots = [];
                var badBots = [];
                deadBots = [];

                // Collect bots to be killed
                var sorted = robots.slice().sort(function (a, b) {
                    return b.cachedFitness - a.cachedFitness;
                });
                var totalFitness = robots.reduce(function (prev, robot) {
                    return prev + robot.cachedFitness;
                }, 0);
                var curFitness = 0;
                for (var i = 0; i < sorted.length; i++) {
                    var robot = sorted[i];
                    curFitness += robot.cachedFitness;
                    var rnd = Math.random() * totalFitness;
                    if(curFitness < rnd) {
                        goodBots.push(robot);
                        continue;
                    }
                    var zombie = {pos: robot.getPos().slice(), ang: robot.getAngle()};
                    deadBots.push(zombie);
                    console.log('killed robot' + i
                        + ' at fitness ' + robot.cachedFitness
                        //+ ' ' + deviation + ' stddev from mean '
                        + '[' + Math.round(zombie.pos[0]) + ',' + Math.round(zombie.pos[1]) + '] '
                        + ' vs [' + Math.round(stats.meanPos[0]) + ',' + Math.round(stats.meanPos[1]) + ']'
                    );
                    badBots.push(robot);
                }

                // Regenerate bots
                if (badBots.length > 0) {
                    console.log('culled ' + badBots.length + ' robots');
                    stats = getStats(goodBots);
                    console.log('distMean=' + stats.distMean + ' distStdDv=' + stats.distStdDv + ' fitMean=' + stats.fitMean + ' fitStdDv=' + stats.fitStdDv);
                    for (var i = 0; i < badBots.length; i++) {
                        var robot = badBots[i];
                        var ang = server.getAngle(); // TODO: Randomness
                        var pos = stats.meanPos.slice();
                        var len = Math.nextGaussian(stats.distMean, stats.distStdDv);
                        pos[0] += Math.cos(ang) * len;
                        pos[1] += Math.sin(ang) * len;
                        robot.reset(pos, ang);
                    }
                }
            }

            // Tell the robots to update their maps based on the new data
            robots[0].applySamples(samples, stats.meanPos, server.getAngle(), map, stats.distStdDv);

            //robots.sort(function(a,b) {return a.cachedFitness - b.cachedFitness;});

            doing = false;
            self.invalidate.dispatch();
        };

        ctor();
        return self;
    };

    return SlamClient;
});