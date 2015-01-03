define([
    'slam/Robot'
], function SlamClient(
    Robot
) {
    var SlamClient = function SlamClient(server) {
        var self = {};

        var ROBOT_COUNT = 1;

        var robots = [];

        var ctor = function() {
            for(var i = 0; i < ROBOT_COUNT; i++) {
                robots.push(new Robot());
            }
        };

        ctor();
        return self;
    };

    return SlamClient;
});