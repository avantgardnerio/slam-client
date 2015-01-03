define([
], function Map(
) {
    var Map = function Map(imgData, width, height) {
        var self = {};

        var WALL_THRESHOLD = 100;
        var bitmap = [];

        var ctor = function() {
            for(var y = 0; y < height; y++) {
                for(var x = 0; x < width; x++) {
                    var i = y * width * 4 + x * 4;
                    var hasWall = imgData[i + 0] < WALL_THRESHOLD
                        && imgData[i + 1] < WALL_THRESHOLD
                        && imgData[i + 2] < WALL_THRESHOLD;
                    bitmap[y * width + x] = hasWall;
                }
            }
        };

        self.testObstruction = function(x, y) {
            x = Math.round(x);
            y = Math.round(y);
            if(x < 0 || y < 0 || x > width || y > height) {
                return true;
            }
            return bitmap[y * width + x];
        };

        self.draw = function(ctx) {
            var oldFill = ctx.fillStyle;
            ctx.fillStyle = '#0000FF';
            for(var y = 0; y < height; y++) {
                for(var x = 0; x < width; x++) {
                    if(self.testObstruction(x, y)) {
                        ctx.fillRect(x, y, 1, 1);
                    }
                }
            }
            ctx.fillStyle = oldFill;
        };

        ctor();
        return self;
    };

    return Map;
});