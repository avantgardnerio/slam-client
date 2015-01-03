define([
], function(
) {
    var MockRobot = function MockRobot() {
        var self = {};

        var SIZE = [6, 6]; // Inches

        var actualPos = [700,700];
        var actualDir = 0;

        self.draw = function(ctx, scale) {
            var oldStroke = ctx.strokeStyle;
            ctx.translate(actualPos[0], actualPos[1]);
            ctx.scale(scale, scale);
            ctx.rotate(actualDir);

            ctx.strokeStyle = '#FF0000';
            ctx.strokeRect(-SIZE[0]/2, -SIZE[1]/2, SIZE[0], SIZE[1]);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -SIZE[1]/2);
            ctx.stroke();

            ctx.rotate(actualDir);
            ctx.scale(1/scale, 1/scale);
            ctx.translate(-actualPos[0], -actualPos[1]);
            ctx.strokeStyle = oldStroke;
        };

        return self;
    };

    return MockRobot;
});