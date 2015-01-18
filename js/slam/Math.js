define(['alea'], function(Alea) {

    var prng = new Alea(42);

    Math.stddev = function(ar) {
        var mean = Math.avg(ar);
        ar = ar.map(function(val) {
            return Math.sq(val - mean);
        });
        mean = Math.avg(ar);
        var stddev = Math.sqrt(mean);
        return stddev;
    };

    Math.avg = function(ar) {
        var sum = 0;
        ar.forEach(function(val) {
            sum += val;
        });
        return sum / ar.length;
    };

    // TODO: Linear time impl
    Math.angNorm = function(ang) {
        while(ang < -Math.PI) ang += Math.PI*2;
        while(ang > Math.PI) ang -= Math.PI*2;
        return ang;
    };

    Math.conProb = function(observation, prior, general) {
        var posterior = observation * prior / general;
        return posterior;
    };

    Math.normDist = function(x, mean, stddev) {
        var res = 1 / (stddev * Math.sqrt(2 * Math.PI)) * Math.pow(Math.E, -Math.sq(x - mean) / (2 * Math.sq(stddev)));
        return res;
    };

    Math.sq = function(val) {
        return val * val;
    };

    Math.rnd_snd = function () {
        return (prng()*2-1)+(prng()*2-1)+(prng()*2-1);
    };

    Math.nextGaussian = function (mean, stdev) {
        return Math.rnd_snd()*stdev+mean;
    };

    return Math;
});