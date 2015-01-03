define([
    'slam/Map'
], function(
    Map
) {
    var MockServer = function MockServer() {
        var self = {};

        var PX_PER_FT = 40; // TODO: Un hard code
        var IN_PER_FT = 12;
        var PX_PER_IN = PX_PER_FT / IN_PER_FT; // TODO: Sane scaling system

        self.SIZE = [6, 6];      // Inches
        self.SENSOR_RANGE_MIN = 6;  // Inches
        self.SENSOR_RANGE_MAX = 36;  // Inches

        var SAMPLE_COUNT = 2 * Math.PI * self.SENSOR_RANGE_MAX; // Take a sample every inch at worst
        var SAMPLE_RAD = 2 * Math.PI / SAMPLE_COUNT;

        var actualPos = [800,700];
        var actualDir = 0;

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
                var absRad = mastRad + actualDir;
                var vec = [Math.cos(absRad), Math.sin(absRad)];
                var dist = undefined;
                for(var d = self.SENSOR_RANGE_MIN; d < self.SENSOR_RANGE_MAX; d += 0.5) {
                    var x = Math.floor(actualPos[0] + vec[0] * d * PX_PER_IN);
                    var y = Math.floor(actualPos[1] + vec[1] * d * PX_PER_IN);
                    if(map.getPixel(x, y)
                        || map.getPixel(x+1, y)
                        || map.getPixel(x, y+1)
                        || map.getPixel(x+1, y+1)
                    ) {
                        dist = d;
                        break;
                    }
                }
                samples.push({radians: mastRad, inches: dist});
            }
            setTimeout(function() {cb(samples)}, 1000);
        };

        self.drive = function(dist, cb) {
            actualPos[0] += Math.cos(actualDir) * dist;
            actualPos[1] += Math.sin(actualDir) * dist;
            setTimeout(function() {cb(dist)}, 1000);
        };

        self.turn = function(radians, cb) {
            actualDir += radians;
            setTimeout(function() {cb(radians)}, 1000);
        };

        // --------------------------------------- test methods -------------------------------------------------------
        self.drawSamples = function(ctx, samples) {
            var oldFill = ctx.fillStyle;

            ctx.fillStyle = '#FF4444';
            for(var i = 0; i < samples.length; i++) {
                var sample = samples[i];
                if(sample.inches === undefined) {
                    continue;
                }
                var x = actualPos[0] + Math.cos(actualDir + sample.radians) * sample.inches * PX_PER_IN;
                var y = actualPos[1] + Math.sin(actualDir + sample.radians) * sample.inches * PX_PER_IN;
                ctx.fillRect(Math.round(x), Math.round(y), 2, 2);
            }

            ctx.fillStyle = oldFill;
        };

        self.draw = function(ctx) {
            //map.draw(ctx);

            var oldStroke = ctx.strokeStyle;
            ctx.translate(actualPos[0], actualPos[1]);
            ctx.rotate(actualDir);

            ctx.strokeStyle = '#FF0000';
            ctx.strokeRect(-self.SIZE[0]/2*PX_PER_IN, -self.SIZE[1]/2*PX_PER_IN, self.SIZE[0]*PX_PER_IN, self.SIZE[1]*PX_PER_IN);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(self.SIZE[1]/2*PX_PER_IN, 0);
            ctx.stroke();

            ctx.rotate(-actualDir);
            ctx.translate(-actualPos[0], -actualPos[1]);
            ctx.strokeStyle = oldStroke;
        };

        ctor();
        return self;
    };

    var instance = new MockServer();
    return instance;
});