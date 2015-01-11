var config = {
    baseUrl: 'js',
    paths: {
        jquery: '../bower_components/jquery/dist/jquery',
        signals: '../bower_components/signals/dist/signals',
        knockout: '../bower_components/knockout/dist/knockout',
        text : '../bower_components/requirejs-text/text'
    },
    shim: {
        'jquery': {
            exports: '$'
        }
    }
};