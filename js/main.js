require.config(config);

require([
    'jquery',
    'slam/SlamClientApp'
], function(
    $,
    SlamClientApp
) {
    window.app = new SlamClientApp(document.body);
    window.app.start();
});
