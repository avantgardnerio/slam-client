define([
], function Robot(
) {
    var Robot = function Robot() {
        var self = {};

        var pos = [0,0];
        var dir = 0;

        self.drive = function(dist, cb) {
            pos[0] += Math.cos(dir) * dist;
            pos[1] += Math.sin(dir) * dist;
            if(cb) {
                cb(dist);
            }
        };

        self.turn = function(radians, cb) {
            dir += radians;
            if(cb) {
                cb(radians);
            }
        };

        return self;
    };

    return Robot;
});