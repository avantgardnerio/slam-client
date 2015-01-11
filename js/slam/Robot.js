define([
    'slam/Map',
    'slam/MockServer'
], function Robot(Map,
                  server) {
    var Robot = function Robot(width, height) {
        var self = {};

        var SENSOR_STDDEV = 3;
        var PX_PER_FT = 40; // TODO: Un hard code
        var IN_PER_FT = 12;
        var PX_PER_IN = PX_PER_FT / IN_PER_FT; // TODO: Sane scaling system
        var WALL_PROBABILITY = 0.05; // From sample data

        var pos = [800,700]; // TODO: Hide this knowledge from the robot
        var dir = 0;
        var map = new Map(width, height);

        self.drive = function (dist, cb) {
            dist = nextGaussian(dist, 2 * PX_PER_IN);
            pos[0] += Math.cos(dir) * dist;
            pos[1] += Math.sin(dir) * dist;
            if (cb) {
                cb(dist);
            }
        };

        self.turn = function (radians, cb) {
            radians = nextGaussian(radians, 0.0872664626); // 5 deg
            dir += radians;
            if (cb) {
                cb(radians);
            }
        };

        self.applySamples = function (samples) {

            // Scan a box that overlaps with the range of the sensor
            var count = 0;
            for(var y = -server.SENSOR_RANGE_MAX * PX_PER_IN; y < server.SENSOR_RANGE_MAX * PX_PER_IN; y++) {
                for(var x = -server.SENSOR_RANGE_MAX * PX_PER_IN; x < server.SENSOR_RANGE_MAX * PX_PER_IN; x++) {

                    // Exclude anything out of range
                    var dist = Math.sqrt(x*x+y*y);
                    if(dist < server.SENSOR_RANGE_MIN * PX_PER_IN || dist > server.SENSOR_RANGE_MAX * PX_PER_IN) {
                        continue;
                    }

                    // Find the closest samples and interpolate
                    var ang = norm(Math.atan2(y, x) - dir);
                    var normAng = (ang + Math.PI) / (Math.PI*2);
                    var idx = normAng * (samples.length-1);
                    var idxLo = Math.max(Math.floor(idx), 0);
                    var idxHi = Math.min(Math.ceil(idx), samples.length-1);
                    var sampleLo = samples[idxLo].inches;
                    var sampleHi = samples[idxHi].inches;

                    var observation;
                    if(sampleLo === undefined && sampleHi === undefined) {
                        observation = 0;
                    } else {
                        var sample = sampleLo ? sampleLo : sampleHi;
                        if(sampleLo !== undefined && sampleHi !== undefined) {
                            sample = sampleLo * (1-Math.abs(idx - idxLo)) + sampleHi * (1-Math.abs(idx - idxHi));
                        }
                        sample *= PX_PER_IN;
                        observation = pdf(dist, sample);
                    }
                    if(observation === undefined) {
                        continue;
                    }
                    var prior = map.getPixel(pos[0]+x, pos[1]+y);
                    var posterior = conditionalProb(observation, prior, WALL_PROBABILITY);
                    posterior = Math.min(posterior, 0.9999); // Never allow full certainty
                    posterior = Math.max(posterior, 0.0001); // Never allow full certainty
                    map.setPixel(pos[0]+x, pos[1]+y, posterior);
                    count++;
                }
            }
            console.log('Applied ' + count + ' samples');
        };

        // Based on the prior values in our map, how likely would it be that the robot returned the given readings?
        self.fitness = function(samples) {
            var total = 0;
            var count = 0;
            for(var i = 0; i < samples.length; i++) {
                var sample = samples[i];
                if(sample.inches === undefined) {
                    continue;
                }
                var absRad = sample.radians + dir;
                var vec = [Math.cos(absRad), Math.sin(absRad)];
                var norm = 0;
                for(var d = server.SENSOR_RANGE_MIN; d < server.SENSOR_RANGE_MAX; d += 0.5) {
                    var x = pos[0] + vec[0] * d * PX_PER_IN;
                    var y = pos[1] + vec[1] * d * PX_PER_IN;
                    norm += oversample(x, y);
                }
                var x = pos[0] + vec[0] * sample.inches * PX_PER_IN;
                var y = pos[1] + vec[1] * sample.inches * PX_PER_IN;
                var probability = oversample(x, y);
                total += probability / norm;
                count++;
            }
            total /= count;
            self.cachedFitness = total;
            return total;
        };

        var oversample = function(x, y) {
            x = Math.floor(x);
            y = Math.floor(y);
            var total = 0;
            total += map.getPixel(x, y);
            total += map.getPixel(x+1, y);
            total += map.getPixel(x, y+1);
            total += map.getPixel(x+1, y+1);
            total /= 4;
            return total;
        };

        // TODO: Linear time impl
        var norm = function(ang) {
            while(ang < -Math.PI) ang += Math.PI*2;
            while(ang > Math.PI) ang -= Math.PI*2;
            return ang;
        };

        var conditionalProb = function(observation, prior, general) {
            var posterior = observation * prior / general;
            return posterior;
        };

        var normDist = function(x, mean, stddev) {
            var res = 1 / (stddev * Math.sqrt(2 * Math.PI)) * Math.pow(Math.E, -sq(x - mean) / (2 * sq(stddev)));
            return res;
        };

        var sq = function(val) {
            return val * val;
        };

        var pdf = function(dist, sample) {
            var val = normDist(dist, sample, SENSOR_STDDEV);
            if(dist > sample) {
                val = Math.max(val, WALL_PROBABILITY);
            }
            return val;
        };

        var rnd_snd = function () {
            return (Math.random()*2-1)+(Math.random()*2-1)+(Math.random()*2-1);
        };

        var nextGaussian = function (mean, stdev) {
            return rnd_snd()*stdev+mean;
        };

        self.draw = function (ctx) {
        };

        self.drawMap = function(ctx) {
            map.draw(ctx);
        };

        self.drawRobot = function(ctx) {
            var oldStroke = ctx.strokeStyle;
            ctx.translate(pos[0], pos[1]);
            ctx.rotate(dir);

            ctx.strokeStyle = self.bestFit ? '#000000' : '#FF0000';
            ctx.strokeRect(-server.SIZE[0]/2*PX_PER_IN, -server.SIZE[1]/2*PX_PER_IN, server.SIZE[0]*PX_PER_IN, server.SIZE[1]*PX_PER_IN);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(server.SIZE[1]/2*PX_PER_IN, 0);
            ctx.stroke();

            ctx.rotate(-dir);
            ctx.translate(-pos[0], -pos[1]);
            ctx.strokeStyle = oldStroke;

            if(self.cachedFitness !== undefined) {
                ctx.fillText(self.cachedFitness.toFixed(3), pos[0] + server.SIZE[0]*2, pos[1] + server.SIZE[1]*2);
            }
        };

        return self;
    };

    return Robot;
});