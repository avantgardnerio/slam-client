define([
], function(
) {
    var MockRobot = function MockRobot() {
        var self = {};

        var SIZE = [6, 6];      // Inches
        var SENSOR_RANGE = 36;  // Inches

        var actualPos = [700,700];
        var actualDir = 0;

        self.drive = function(dist, cb) {
            actualPos[0] += Math.cos(actualDir) * dist;
            actualPos[1] += Math.sin(actualDir) * dist;
            cb();
        };

        self.turn = function(radians, cb) {
            actualDir += radians;
            cb();
        };

        self.draw = function(ctx, scale) {
            //scale = 1/scale;
            var oldStroke = ctx.strokeStyle;
            ctx.translate(actualPos[0], actualPos[1]);
            ctx.rotate(actualDir);

            ctx.strokeStyle = '#FF0000';
            ctx.strokeRect(-SIZE[0]/2*scale, -SIZE[1]/2*scale, SIZE[0]*scale, SIZE[1]*scale);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(SIZE[1]/2*scale, 0);
            ctx.stroke();

            ctx.rotate(-actualDir);
            ctx.translate(-actualPos[0], -actualPos[1]);
            ctx.strokeStyle = oldStroke;
        };

        return self;
    };

    return MockRobot;
});