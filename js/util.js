var querystring = require('querystring')
var once = require('once')
var util = require('./util')

var JSONP_TIMEOUT = 10000

/**
 * Make a JSONP request. Server must support JSONP with callback name specified as a  GET
 * parameter with the name `callback`. Callback function will be called when data arrives.
 * If request times out, callback is called with an Error object.
 * @param  {string}   uri
 * @param  {Object}   params Object of url params. Gets transformed into ?key1=value1&key2=value2
 * @param  {function} cb
 */
exports.jsonp = function (uri, params, cb) {
    cb = once(cb)

    // pick a globally-unique id
    var id;
    do {
        id = '__jsonp_' + Math.round(Math.random() * 10000000);
    } while (window[id] !== undefined);

    uri += uri[uri.length - 1] === '/'
        ? ''
        : '/';

    uri += '?' + querystring.stringify(params) + '&callback=' + id;

    var script = document.createElement('script');
    script.src = uri;

    var timeout = window.setTimeout(function () {
        cb(new Error('jsonp request timed out'));
    }, JSONP_TIMEOUT);

    function cleanup () {
        script.parentNode.removeChild(script); // cleanup script tag
        delete window[id]; // cleanup global handler function
        clearTimeout(timeout); // cleanup timeout
    }

    function cancel () {
        if (window[id]) {
            cleanup();
            window[id] = function () {}; // noop
        }
    }

    script.onerror = function () {
        cleanup();
        cb(new Error('jsonp error'));
    };

    window[id] = function (response) {
        cleanup();
        cb(null, response);
    };

    document.body.appendChild(script);

    return cancel;
};