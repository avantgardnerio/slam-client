define([
    'jquery',
    'slam/MockServer',
    'slam/SlamClient'
], function(
    $,
    server,
    SlamClient
) {
    var RootView = function() {
        var self = {};

        var PX_PER_FT = 40; // TODO: Un hard code
        var IN_PER_FT = 12;
        var PX_PER_IN = PX_PER_FT / IN_PER_FT; // TODO: Sane scaling system

        var cnvMain;
        var ctx;
        var background;

        var client;

        var init = function() {

            // Create the canvas
            cnvMain = $('<canvas/>')[0];
            ctx = cnvMain.getContext("2d");

            // Load the background image
            background = new Image();
            background.onload = onImgLoad;
            background.src = 'img/floor_plan_example.png'; // TODO: Un hard code

            // Handle window resizing
            $(window).resize(onResize);
            onResize();
        };

        self.getElement = function() {
            return cnvMain;
        };

        self.onLoad = function() {
            self.invalidate();
        };

        self.invalidate = function() {
            window.requestAnimationFrame(draw);
        };

        // -------------------------------------- private methods -----------------------------------------------------
        var draw = function() {
            if(client === undefined) {
                return;
            }

            // Image
            ctx.drawImage(background, 0, 0, background.width, background.height);

            // Have the server draw itself (no-op on the real server, because it doesn't know where it is!)
            client.draw(ctx);
            server.draw(ctx);
        };

        // ---------------------------------------- helper methods ----------------------------------------------------
        var onImgLoad = function() {
            ctx.drawImage(background, 0, 0, background.width, background.height);
            parseMap();
        };

        var parseMap = function() {
            var imgData = ctx.getImageData(0, 0, background.width, background.height);
            server.setMap(imgData);
            client = new SlamClient(background.width, background.height);
            client.invalidate.add(self.invalidate);

            self.invalidate();
            client.start();
        };

        var onResize = function() {
            $(cnvMain).attr('width', $(window).innerWidth());
            $(cnvMain).attr('height', $(window).innerHeight());
            self.invalidate();
        };

        init();
        return self;
    };

    return RootView;
});