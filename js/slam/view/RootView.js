define([
    'jquery',
    'knockout',
    'text!template/RootView.html',
    'slam/view/KoView',
    'slam/MockServer',
    'slam/SlamClient'
], function(
    $,
    ko,
    template,
    KoView,
    server,
    SlamClient
) {
    var RootView = function() {
        var self = new KoView();

        // ----------------------------------------------- constants --------------------------------------------------
        var PX_PER_FT = 40; // TODO: Un hard code
        var IN_PER_FT = 12;
        var PX_PER_IN = PX_PER_FT / IN_PER_FT; // TODO: Sane scaling system

        var cnvMain;
        var ctx;
        var background;

        var client;

        // ----------------------------------------------- observables ------------------------------------------------
        self.robots = ko.observableArray([]);
        self.selectedBot = ko.observable();

        // ----------------------------------------------- constructor ------------------------------------------------
        var init = function() {

            // Create the canvas
            cnvMain = $(self.getElement()).find('.cnvMain')[0];
            ctx = cnvMain.getContext("2d");

            // Load the background image
            background = new Image();
            background.onload = onImgLoad;
            background.src = 'img/floor_plan_example.png'; // TODO: Un hard code

            self.selectedBot.subscribe(botChange);
        };

        var onLoad = self.onLoad;
        self.onLoad = function() {
            onLoad();
            self.invalidate();
        };

        self.invalidate = function() {
            window.requestAnimationFrame(draw);
        };

        // -------------------------------------- private methods -----------------------------------------------------
        var botChange = function(newVal) {
            client.showBot(newVal);
        };

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
            $(cnvMain).attr('width', background.width);
            $(cnvMain).attr('height', background.height);
            $(cnvMain).width(background.width);
            $(cnvMain).height(background.height);

            ctx.drawImage(background, 0, 0, background.width, background.height);
            var imgData = ctx.getImageData(0, 0, background.width, background.height);
            server.setMap(imgData);
            client = new SlamClient(background.width, background.height);
            client.invalidate.add(self.invalidate);
            self.robots(client.getRobots());

            self.invalidate();
            client.start();
        };

        // ----------------------------------------- overrides --------------------------------------------------------
        self._getTemplate = function() {
            return template;
        };

        init();
        return self;
    };

    return RootView;
});