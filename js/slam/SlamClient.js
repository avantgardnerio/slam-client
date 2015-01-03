define([
    'signals',
    'slam/Robot',
    'slam/Map'
], function SlamClient(
    signals,
    Robot,
    Map
) {
    var SlamClient = function SlamClient(server, width, height) {
        var self = {};

        // --------------------------------------------- constants ----------------------------------------------------
        var ROBOT_COUNT = 1;

        // --------------------------------------------- events -------------------------------------------------------
        self.invalidate = new signals.Signal();

        // ------------------------------------------- private vars ---------------------------------------------------
        var robots = [];
        var history = [];
        var map = new Map(width, height);

        // ------------------------------------------ constructor -----------------------------------------------------
        var ctor = function() {
            for(var i = 0; i < ROBOT_COUNT; i++) {
                robots.push(new Robot());
            }
        };

        // ------------------------------------------ public methods --------------------------------------------------
        self.start = function() {
            server.scan(onScanComplete);
        };

        self.draw = function(ctx) {
            console.log('hi');
        };

        // ----------------------------------------- private methods --------------------------------------------------
        var onScanComplete = function(samples) {
            history.push({action: 'scan', data: samples});
            self.invalidate.dispatch();
        };

        ctor();
        return self;
    };

    return SlamClient;
});