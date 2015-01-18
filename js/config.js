var config = {
    baseUrl: 'js',
    paths: {
        jquery: '../bower_components/jquery/dist/jquery',
        signals: '../bower_components/signals/dist/signals',
        knockout: '../bower_components/knockout/dist/knockout',
        glmat: '../bower_components/gl-matrix/dist/gl-matrix',
        alea: '../bower_components/Alea/alea',
        text: '../bower_components/requirejs-text/text'
    },
    shim: {
        'jquery': {
            exports: '$'
        },
        'alea': {
            exports: 'alea'
        }
    }
};