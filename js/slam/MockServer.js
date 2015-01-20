define([
    'slam/Map'
], function(
    Map
) {
    var MockServer = function MockServer() {
        var self = {};

        var SENSOR_STDDEV = 0.5;
        var DRIVE_ERROR = 0.2;
        var TURN_ERROR = 0.2 * Math.PI / 180;
        var TURN_TIME = 0;
        var DRIVE_TIME = 0;
        var SCAN_TIME = 0;
        var PX_PER_FT = 40; // TODO: Un hard code
        var IN_PER_FT = 12;
        var PX_PER_IN = PX_PER_FT / IN_PER_FT; // TODO: Sane scaling system

        self.SIZE = [6, 6];      // Inches
        self.SENSOR_RANGE_MIN = 6;  // Inches
        self.SENSOR_RANGE_MAX = 36;  // Inches

        var SAMPLE_COUNT = 2 * Math.PI * self.SENSOR_RANGE_MAX; // Take a sample every inch at worst
        var SAMPLE_RAD = 2 * Math.PI / SAMPLE_COUNT;

        var pos = [800,700];
        var dir = -Math.PI / 2;

        var map;

        var ctor = function() {
        };

        // ------------------------------------- public methods -------------------------------------------------------
        self.setMap = function(imgData) {
            map = new Map(imgData.width, imgData.height);
            map.fromImage(imgData.data);
        };

        self.scan = function(cb) {
            var samples = [];
            for(var mastRad = -Math.PI; mastRad <= Math.PI; mastRad += SAMPLE_RAD) {
                var absRad = mastRad + dir;
                var vec = [Math.cos(absRad), Math.sin(absRad)];
                var dist = undefined;
                for(var d = self.SENSOR_RANGE_MIN; d < self.SENSOR_RANGE_MAX; d += 0.5) {
                    var x = Math.floor(pos[0] + vec[0] * d * PX_PER_IN);
                    var y = Math.floor(pos[1] + vec[1] * d * PX_PER_IN);
                    if(map.getPixel(x, y)
                        || map.getPixel(x+1, y)
                        || map.getPixel(x, y+1)
                        || map.getPixel(x+1, y+1)
                    ) {
                        dist = Math.nextGaussian(d, SENSOR_STDDEV);
                        break;
                    }
                }
                samples.push({radians: mastRad, inches: dist});
            }
            setTimeout(function() {cb(samples)}, SCAN_TIME);
        };

        self.drive = function(dist, cb) {
            var d = Math.nextGaussian(dist, DRIVE_ERROR * PX_PER_IN);
            pos[0] += Math.cos(dir) * d;
            pos[1] += Math.sin(dir) * d;
            setTimeout(function() {cb(dist)}, DRIVE_TIME);
        };

        self.turn = function(radians, cb) {
            var r = Math.nextGaussian(radians, TURN_ERROR);
            dir += r;
            setTimeout(function() {cb(radians)}, TURN_TIME);
        };

        // --------------------------------------- test methods -------------------------------------------------------
        self.setPos = function(val) {
            pos = val.slice();
        };

        self.getPos = function() {
            return pos;
        };

        self.getAngle = function() {
            return dir;
        };

        self.drawSamples = function(ctx, samples) {
            var oldFill = ctx.fillStyle;

            ctx.fillStyle = '#FF4444';
            for(var i = 0; i < samples.length; i++) {
                var sample = samples[i];
                if(sample.inches === undefined) {
                    continue;
                }
                var x = pos[0] + Math.cos(dir + sample.radians) * sample.inches * PX_PER_IN;
                var y = pos[1] + Math.sin(dir + sample.radians) * sample.inches * PX_PER_IN;
                ctx.fillRect(Math.round(x), Math.round(y), 2, 2);
            }

            ctx.fillStyle = oldFill;
        };

        self.draw = function(ctx) {
            //map.draw(ctx);
            if(!isFinite(pos[0]) || !isFinite(pos[1]) || !isFinite(dir)) {
                return;
            }
            if(isNaN(pos[0]) || isNaN(pos[1]) || isNaN(dir)) {
                return;
            }
            if(!parseFloat(pos[0]) || !parseFloat(pos[1]) || !parseFloat(dir)) {
                return;
            }

            var oldStroke = ctx.strokeStyle;
            ctx.translate(pos[0], pos[1]);
            ctx.rotate(dir);

            try {
                ctx.strokeStyle = '#000000';
                ctx.strokeRect(-self.SIZE[0]/2*PX_PER_IN, -self.SIZE[1]/2*PX_PER_IN, self.SIZE[0]*PX_PER_IN, self.SIZE[1]*PX_PER_IN);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(self.SIZE[1]/2*PX_PER_IN, 0);
                ctx.stroke();
            } catch(ex) {

            }

            ctx.rotate(-dir);
            ctx.translate(-pos[0], -pos[1]);
            ctx.strokeStyle = oldStroke;
        };

        ctor();
        return self;
    };

    var instance = new MockServer();
    return instance;
});