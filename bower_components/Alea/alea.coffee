((exports) ->
    _mash =  ->
        n = 0xefc8249d
        mash = (data) ->
            # Mash version 0.9
            data = data.toString()
            for i in [0..data.length - 1]
                n += data.charCodeAt i
                h = 0.02519603282416938 * n
                n = h >>> 0
                h -= n
                h *= n
                n = h >>> 0
                h -= n
                n += h* 0x100000000 # 2^32
            return (n >>> 0) * 2.3283064365386963e-10 # 2^-32
            
        mash.version = 'Mash 0.9'
        return mash

    exports.alea = ->
        # Alea PRNG
        return ((seeds = [+new Date()])->
            # Johannes Baagoe <baagoe@baagoe.com>, 2010
            # Thanks to: http://baagoe.com/en/RandomMusings/javascript/
            s0 = 0
            s1 = 0
            s2 = 0
            c = 1
            mash = _mash()
            s0 = mash ' '
            s1 = mash ' '
            s2 = mash ' '
            for seed in seeds
                s0 -= mash seed
                s0 += 1 if s0 < 0
                s1 -= mash seed
                s1 += 1 if s1 < 0
                s2 -= mash seed
                s2 += 1 if s2 < 0
            mash = null
            
            random = ->
                t = 2091639 * s0 + c * 2.3283064365386963e-10 # 2^-32
                s0 = s1;
                s1 = s2;
                return s2 = t - (c = t | 0);
                
            random.range = (min, max) ->
                return Math.round random() * (max - min) + min
                
            random.choice = (array) ->
                return array[random.range 0, array.length - 1]
            
            random.uint32 = ->
                return random() * 0x100000000 # 2^32
            
            random.fract53 = ->
                return random() + (random() * 0x200000 | 0) * 1.1102230246251565e-16 # 2^-53
                
            random.version = 'Alea 0.9'
            random.seeds = seeds
            return random
        )([arguments...])
    return
)(if typeof global is "undefined" then window else module.exports)
# Hack to allow node module loading
