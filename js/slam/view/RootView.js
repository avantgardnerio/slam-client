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
        self.selectedBot = ko.observable({
            cachedFitness: 1
        });
        self.showAll = ko.observable(true);
        self.autoDrive = ko.observable(false);

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
            self.showAll.subscribe(allChange);
            self.autoDrive.subscribe(driveChange);
        };


        // --------------------------------------------- public methods -----------------------------------------------
        var onLoad = self.onLoad;
        self.onLoad = function() {
            onLoad();
            self.invalidate();
        };

        self.invalidate = function() {
            window.requestAnimationFrame(draw);
        };

        self.step = function() {
            client.step();
            self.robots(client.getRobots());
        };

        // -------------------------------------- private methods -----------------------------------------------------
        var botChange = function(newVal) {
            if(client === undefined) {
                return;
            }
            client.showBot(newVal);
            self.invalidate();
        };

        var allChange = function(newVal) {
            if(client === undefined) {
                return;
            }
            client.showAll(newVal);
            self.invalidate();
        };

        var driveChange = function(newVal) {
            if(client === undefined) {
                return;
            }
            client.autoDrive(newVal);
        };

        var draw = function() {
            if(client === undefined) {
                return;
            }

            // Image
            ctx.drawImage(background, 0, 0, background.width, background.height);
            //ctx.fillStyle = '#FFFFFF';
            //ctx.fillRect(0, 0, background.width, background.height);

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
            var bot = client.getRobots()[0];
            self.selectedBot(bot);

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