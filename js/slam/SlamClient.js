define([
    'slam/Robot',
    'slam/Map'
], function SlamClient(
    Robot,
    Map
) {
    var SlamClient = function SlamClient(server, width, height) {
        var self = {};

        var ROBOT_COUNT = 1;

        var robots = [];
        var history = [];
        var map = new Map(width, height);

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