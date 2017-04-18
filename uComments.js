
/*!
    uComments v0.1 release
    (c) 2016 Korchevskiy Evgeniy (aka ReSLeaR-)
    ---
    vk.com/reslear | upost.su | github.com/reslear
    Released under the MIT @license.
!*/

/*

var comments = new uComments('stuff');
comments.get('/stuff/45?comments', function( nodes ) {

});

---
только после get:

    comments.add(entry_id, message, pid);
                                                              soc_type:'', sdata:''
    comments.edit(com_id, message);         /index/37-135    s: 135 (id комментари)   a:37, t:1, ssid:'', message: 1, answer:'ответ'   reply (Отправить ответ по e-mail) pending Не выводить комментарий
    comments.remove(com_id);       ssid:'8LIde8BO',a:'38',s:id,as_spam:(as_spam?1:0)

comments.update();


nodes = [
    {node: node, id: 7, level: 2}
]

comm = [
    {value: '', link: '', active: ''},
    {value: '', link: '', active: ''},
]

*/

(function() {

    'use strict';

    window.uComments = function(module) {

        this.module = module || 'stuff';

        this.result = {};
        this.url    = '';
    };


    /* public
    ---------------------------------------------------------------------------------- */

    // get
    uComments.prototype.get = function(url, cb, cbe) {

        var _this = this;
        return xhrAsync([url], function(text) {

            _this.url = url;
            _this.result = parseAll(text);

            if(cb) cb.call(this, _this.result);
        }, cbe || null);
    }


    uComments.prototype.add = function(entry_id, message, pid) {

        if(!this.result || !this.url || !message) return false;

        return xhrAsync([url, {}], function(text) {

            _this.url = url;
            _this.result = parseAll(text);

            if(cb) cb.call(this, _this.result);
        });

    }

    uComments.prototype.postHandler = function() {
        postHandler.apply(this, arguments);
    }

    /* private
    ---------------------------------------------------------------------------------- */

    const POST_VAR = {
        module: {
            stuff : {m: 8},
            load : {m: 5}
        },
        type: {
            'add': {
                a: 36,
                soc_type: '',
                data: '',
            },
            'edit': {
                a:37,
                answer: '',
                t: 1,
                pending: 0,
                reply: 0,
                soc_type:'',
                sdata:''
            },
            'remove': {
                a: 38,
                as_spam: 0
            }
        }
    }

/*
        postHandler('add', {id: 0, pid: 0, message:''})
        postHandler('edit', {s: 0, message:''})
        postHandler('remove', {s: 0})
*/

    var postHandler = function(type, user_options) {

        const _this = this;
        const options = extend(POST_VAR.type[type], this.ssid, user_options);

        if(!this.result || !this.url) return false;

        var callback = function(text) {

            // TODO: parse

            var message = text;
            var content = '';

            if(options.cb) options.cb.call(this, message, content);
        }

        return xhrAsync([this.url, options], callback, callback);
    };

    var parseSsid = function (text) {

        // sos
        var regexp_sos = new RegExp('_dS\\(\'(.*?)\'\\);', 'i');
        var sos = regexp_sos.test(text) ? _dS(text.match(regexp_sos)[1]) : '';
        sos = /\d+/.test(sos) ? sos.match(/\d+/)[0] : '';

        // ssid
        var regexp_ssid = new RegExp('name="ssid"\\svalue="(.*?)"', '');
        var ssid = regexp_ssid.test(text) ? text.match(regexp_ssid)[1] : '';

        return {sos: sos, ssid: ssid};
    };

    var parseAll = function(text) {

        var html = document.createElement('html');
        html.innerHTML = text;

        var object = {
            nodes: parseNodes(html),
            swtch: parseSwtch(html),
            ssid : parseSsid(text)
        }

        return object;
    }


    // xhrAsync(['/ghhh',{a:1}], function(){}, function(){});
    function xhrAsync(array, cb, cbe) {

        if(!array[0]) return false;

        var type = array[1] ? 'POST' : 'GET';
        var request = new XMLHttpRequest();
        var formdata = new FormData();

        request.onerror = function() {
            if(cbe) cbe.call(this);
        }

        request.onload = function() {
            if( this.status === 200 ) cb.call(this, this.responseText); else request.onerror.call(this);
        };

        if(array[1]) {
            for(var key in array[1]) {
                formdata.append(key, array[1][key]);
            }
        }

        request.open(type, array[0], true);
        request.send(array[1] ? formdata : null);

        return request;
    }


    // Парсинг комментариев
    function _dS(s) {
        var i, r='', l=s.length-1, k=s.substr(l,1);
    	for (i = 0; i < l; i++) {
    		c = s.charCodeAt(i) - k;
    		if (c < 32) {
    			c = 127 - (32 - c);
    		}
    		r += String.fromCharCode(c);
    	}
    	return r;
    };

    function parseNodes(html) {
        var nodes = html.querySelectorAll('#allEntries > .comEnt'), object = {};

        for(var index in nodes) {

            if( !nodes.hasOwnProperty(index) ) continue;
            var node = nodes[index];

            var id = node.getAttribute('id').replace('comEnt', '');
            var level = parseInt(node.style.marginLeft || 0) / 20;

            object[id] = {node: node.firstChild, level: level, index: parseInt(index) };
        };

        return object;
    };

    function parseSwtch(html) {
        var nodes = html.querySelectorAll('[class^="swchItem"]'), object = {};

        var regexp_id = new RegExp('\\d+','');
        var regexp_url = new RegExp(',\'(.*?)\'', '');

        for(var index in nodes) {

            if( !nodes.hasOwnProperty(index) ) continue;
            var node = nodes[index];

            var value = node.querySelector('span');
            value = value ? value.innerHTML : '';

            if( value == '»' || value == '«' ) continue;

            if( node.tagName == 'A' ) {

                var data = node.getAttribute('onclick');
                if( !regexp_url.test(data) || !regexp_id.test(data) ) continue;

                var id = data.match(regexp_id)[0];
                var url = data.match(regexp_url)[1];

                object[id] = {value: value, url: atob(url)};

            } else if( node.tagName == 'B' ) {
                object.active = {value: value};
            }

        }

        return object;
    }


    function extend(obj) {

        for(var i = 1; i < arguments.length; i++) {
            var obj1 = arguments[i];

            for( var key in obj1){
                if( obj1.hasOwnProperty(key) ) obj[key] = obj1[key];
            }
        }

        return obj;
    }

})();
