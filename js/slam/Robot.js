define([
    'slam/Map',
    'slam/MockServer'
], function Robot(Map,
                  server) {
    var Robot = function Robot(width, height) {
        var self = {};

        var PX_PER_FT = 40; // TODO: Un hard code
        var IN_PER_FT = 12;
        var PX_PER_IN = PX_PER_FT / IN_PER_FT; // TODO: Sane scaling system

        var pos = [800,700]; // TODO: Hide this knowledge from the robot
        var dir = 0;
        var map = new Map(width, height);

        self.drive = function (dist, cb) {
            pos[0] += Math.cos(dir) * dist;
            pos[1] += Math.sin(dir) * dist;
            if (cb) {
                cb(dist);
            }
        };

        self.turn = function (radians, cb) {
            dir += radians;
            if (cb) {
                cb(radians);
            }
        };

        self.applySamples = function (samples) {

            // Scan a box that overlaps with the range of the senser
            for(var y = -server.SENSOR_RANGE_MAX * PX_PER_IN; y < server.SENSOR_RANGE_MAX * PX_PER_IN; y++) {
                for(var x = -server.SENSOR_RANGE_MAX * PX_PER_IN; x < server.SENSOR_RANGE_MAX * PX_PER_IN; x++) {

                    // Exclude anything out of range
                    var dist = Math.sqrt(x*x+y*y);
                    if(dist < server.SENSOR_RANGE_MIN * PX_PER_IN || dist > server.SENSOR_RANGE_MAX * PX_PER_IN) {
                        continue;
                    }

                    // Find the closest samples and interpolate
                    var ang = Math.atan2(x, y);
                    var normAng = (ang + Math.PI) / (Math.PI*2);
                    var idx = normAng * (samples.length-1);
                    var idxLo = Math.max(Math.floor(idx), 0);
                    var idxHi = Math.min(Math.ceil(idx), samples.length-1);
                    var sampleLo = samples[idxLo].inches;
                    var sampleHi = samples[idxHi].inches;
                    if(sampleLo === undefined && sampleHi === undefined) {
                        continue;
                    }
                    var sample = sampleLo ? sampleLo : sampleHi;
                    if(sampleLo !== undefined && sampleHi !== undefined) {
                        sample = sampleLo * (1-Math.abs(idx - idxLo)) + sampleHi * (1-Math.abs(idx - idxHi));
                    }

                    // TODO: PDF
                    var val = Math.max(Math.min(Math.abs(dist - sample), 1), 0);
                    map.setPixel(pos[0]+x, pos[1]+y, val);
                }
            }
        };

        self.draw = function (ctx) {
            map.draw(ctx);
        };

        return self;
    };

    return Robot;
});