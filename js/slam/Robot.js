define([
    'tinycolor',
    'slam/Math',
    'slam/Map',
    'slam/MockServer'
], function Robot(tinycolor,
                  Math,
                  Map,
                  server) {

    var DRIVE_ERROR = 0.5;
    var TURN_ERROR = 0.5 * Math.PI / 180;
    var COLOR_GOOD = Math.hsbVec(tinycolor('#00B000'));
    var COLOR_BAD = Math.hsbVec(tinycolor('#600000'));
    var PX_PER_FT = 40; // TODO: Un hard code
    var IN_PER_FT = 12;
    var PX_PER_IN = PX_PER_FT / IN_PER_FT; // TODO: Sane scaling system
    var ATAN_CACHE = [];
    var YMIN = Math.floor(-server.SENSOR_RANGE_MAX * PX_PER_IN);
    var XMIN = Math.floor(-server.SENSOR_RANGE_MAX * PX_PER_IN);
    var YMAX = Math.ceil(server.SENSOR_RANGE_MAX * PX_PER_IN);
    var XMAX = Math.ceil(server.SENSOR_RANGE_MAX * PX_PER_IN);

    var COL_SIZE = XMAX - XMIN;
    for (var y = YMIN; y < YMAX; y++) {
        for (var x = XMIN; x < XMAX; x++) {
            ATAN_CACHE[y * COL_SIZE + x] = Math.atan2(y, x);
        }
    }

    var Robot = function Robot(name, width, height) {
        var self = {};

        var SENSOR_STDDEV = 5;
        var WALL_PROBABILITY = 0.05; // From sample data

        var pos = [800, 700]; // TODO: Hide this knowledge from the robot
        var lastPos = pos.slice();
        var dir = -Math.PI / 2;
        var map = new Map(width, height);
        var history = [];

        self.name = name;

        self.getName = function () {
            return name;
        };

        self.reset = function (p, d) {
            pos = p.slice();
            dir = d;
            map = new Map(width, height);
            history = [];
        };

        self.drive = function (dist, cb) {
            var er = DRIVE_ERROR;
            if(name === '0') {
                //er = 0;
            }
            dist = Math.nextGaussian(dist, er * PX_PER_IN);
            pos[0] += Math.cos(dir) * dist;
            pos[1] += Math.sin(dir) * dist;
            if (cb) {
                cb(dist);
            }
        };

        self.turn = function (radians, cb) {
            var er = TURN_ERROR;
            if(name === '0') {
                //er = 0;
            }
            radians = Math.nextGaussian(radians, er);
            dir += radians;
            if (cb) {
                cb(radians);
            }
        };

        var lastSample;
        self.applySamples = function (samples) {
            lastSample = samples;
            // Scan a box that overlaps with the range of the sensor
            var count = 0;
            for (var y = YMIN; y < YMAX; y++) {
                for (var x = XMIN; x < XMAX; x++) {
                    // Exclude anything out of range
                    var dist = Math.sqrt(x * x + y * y);
                    if (dist < server.SENSOR_RANGE_MIN * PX_PER_IN || dist > server.SENSOR_RANGE_MAX * PX_PER_IN) {
                        continue;
                    }

                    // Find the closest samples and interpolate
                    var ang = ATAN_CACHE[y * COL_SIZE + x];
                    ang = Math.angNorm(ang - dir);
                    var normAng = (ang + Math.PI) / (Math.PI * 2);
                    var idx = normAng * (samples.length - 1);
                    var idxLo = Math.max(Math.floor(idx), 0);
                    var idxHi = Math.min(Math.ceil(idx), samples.length - 1);
                    var sampleLo = samples[idxLo].inches;
                    var sampleHi = samples[idxHi].inches;

                    var observation;
                    if (sampleLo === undefined && sampleHi === undefined) {
                        observation = 0;
                    } else {
                        var sample = sampleLo ? sampleLo : sampleHi;
                        if (sampleLo !== undefined && sampleHi !== undefined) {
                            sample = sampleLo * (1 - Math.abs(idx - idxLo)) + sampleHi * (1 - Math.abs(idx - idxHi));
                        }
                        sample *= PX_PER_IN;
                        observation = pdf(dist, sample);
                    }
                    if (observation === undefined) {
                        continue;
                    }
                    var prior = map.getPixel(pos[0] + x, pos[1] + y);
                    var posterior = Math.conProb(observation, prior, WALL_PROBABILITY);
                    posterior = Math.min(posterior, 0.9999); // Never allow full certainty
                    posterior = Math.max(posterior, 0.0001); // Never allow full certainty
                    map.setPixel(pos[0] + x, pos[1] + y, posterior);
                    count++;
                }
            }
            //console.log('Applied ' + count + ' samples');
        };

        self.drawSamples = function (ctx) {
            if(!lastSample) {
                return;
            }
            var samples = lastSample;
            for (var i = 0; i < samples.length; i++) {
                var sample = samples[i];
                if (sample.inches === undefined) {
                    continue;
                }
                var absRad = sample.radians + dir;
                var vec = [Math.cos(absRad), Math.sin(absRad)];
                var x = pos[0] + vec[0] * sample.inches * PX_PER_IN;
                var y = pos[1] + vec[1] * sample.inches * PX_PER_IN;

                // Ignore samples outside our previously observable space
                var lastDist = Math.sqrt(Math.sq(x - lastPos[0]) + Math.sq(y - lastPos[1]));
                if(lastDist > server.SENSOR_RANGE_MAX * PX_PER_IN) {
                    continue;
                }
                ctx.fillStyle = 'rgba(255, 0, 0, 1)';
                ctx.fillRect(x, y, 1, 1);
            }
        };

        // Based on the prior values in our map, how likely would it be that the robot returned the given readings?
        self.fitness = function (samples) {
            var total = 0;
            var count = 0;
            for (var i = 0; i < samples.length; i++) {
                var sample = samples[i];
                if (sample.inches === undefined) {
                    continue;
                }
                var absRad = sample.radians + dir;
                var vec = [Math.cos(absRad), Math.sin(absRad)];
                var x = pos[0] + vec[0] * sample.inches * PX_PER_IN;
                var y = pos[1] + vec[1] * sample.inches * PX_PER_IN;

                // Ignore samples outside our previously observable space
                var lastDist = Math.sqrt(Math.sq(x - lastPos[0]) + Math.sq(y - lastPos[1]));
                if(lastDist > server.SENSOR_RANGE_MAX * PX_PER_IN) {
                    continue;
                }
                var probability = oversample(x, y);
                total += probability;
                count++;
            }
            total /= count;
            history.push(total);
            var hs = history.reduce(function(val, prev) {return prev + val;}, 0);
            var runningAvg = 0;
            var cnt = 0;
            for(var i = history.length-1; i >= Math.max(history.length-4, 0); i--) {
                runningAvg += history[i];
                cnt++;
            }
            runningAvg /= cnt;
            self.cachedFitness = total; // runningAvg //hs / history.length;

            lastPos = pos.slice();

            return total;
        };

        var oversample = function (x, y) {
            x = Math.floor(x);
            y = Math.floor(y);
            var total = 0;
            total += map.getPixel(x, y);
            total += map.getPixel(x + 1, y);
            total += map.getPixel(x, y + 1);
            total += map.getPixel(x + 1, y + 1);
            total /= 4;
            return total;
        };

        var pdf = function (dist, sample) {
            var val = Math.normDist(dist, sample, SENSOR_STDDEV);
            if (dist > sample) {
                val = Math.max(val, WALL_PROBABILITY);
            }
            return val;
        };

        self.getAge = function() {
            return history.length;
        };

        self.setPos = function(val) {
            pos = val.slice();
        };

        self.getPos = function () {
            return pos;
        };

        self.getAngle = function () {
            return dir;
        };

        self.draw = function (ctx) {
        };

        self.drawMap = function (ctx) {
            map.draw(ctx);
        };

        self.drawRobot = function (ctx) {
            if(!isFinite(pos[0]) || !isFinite(pos[1]) || !isFinite(dir)) {
                return;
            }
            if(isNaN(pos[0]) || isNaN(pos[1]) || isNaN(dir)) {
                return;
            }
            if(!parseInt(pos[0]) || !parseInt(pos[1]) || !parseInt(dir)) {
                return;
            }

            var oldStroke = ctx.strokeStyle;
            ctx.translate(pos[0], pos[1]);
            ctx.rotate(dir);

            try {
                ctx.strokeStyle = Math.hsbColor(Math.lerp(COLOR_BAD, COLOR_GOOD, self.normalizedFitness)).toRgbString();
                ctx.strokeRect(-server.SIZE[0] / 2 * PX_PER_IN, -server.SIZE[1] / 2 * PX_PER_IN, server.SIZE[0] * PX_PER_IN, server.SIZE[1] * PX_PER_IN);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(server.SIZE[1] / 2 * PX_PER_IN, 0);
                ctx.stroke();
            } catch(ex) {

            }

            ctx.rotate(-dir);
            ctx.translate(-pos[0], -pos[1]);
            ctx.strokeStyle = oldStroke;
        };

        return self;
    };

    return Robot;
});