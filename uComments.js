
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
                            /index/58-140
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

        this.post_cb  = false;
        this.post_cbe = false;

        this.result = {};
        this.url    = '';
    };

    const POST_VAR = {
        module: {
            'stuff' : {m: 8},
            'load' : {m: 5}
        },
        add: {
            a: 36,
            soc_type: '',
            data: '',
        },
        edit: {
            a:37,
            answer: '',
            t: 1,
            pending: 0,
            reply: 0,
            soc_type:'',
            sdata:''
        },
        remove:{
            a: 38,
            as_spam: 0
        }
    }


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


    // syntax suggar
    uComments.prototype.add = function(entry_id, message) {
        return postHandler.call(this, {id: entry_id, message: message});
    }
    uComments.prototype.addSub = function(comment_id, message) {
        return postHandler.call(this, {pid: comment_id, message: message});
    }
    uComments.prototype.edit = function(comment_id, message, answer) {
        return postHandler.call(this, {s: comment_id, message: message, answer: answer});
    }
    uComments.prototype.remove = function(comment_id) {
        return postHandler.call(this, {s: comment_id});
    }

    // post
    uComments.prototype.post = function() {
        return postHandler.apply(this, arguments);
    }




    /* private
    ---------------------------------------------------------------------------------- */

/*
        postHandler('add', {id: 0, pid: 0, message:''})
        postHandler('add', {pid: 0, message:''})
        postHandler('edit', {s: 0, message:''})
        postHandler('remove', {s: 0})
*/

    var postHandler = function(type, user_options) {

        const _this = this;
        const options = extend(POST_VAR[type], POST_VAR.module[this.module], this.result.ssid, user_options);

        if(!this.result || !this.url) return false;

        var callback = function(text) {

            text = text || '';
            var cb_options = {status: 0,message: '',content: ''};

            var xml = this.responseXML;

            if (!xml || !xml.documentElement) {
                if(options.cbe) options.cbe.call(this);
                return false;
            }

            var message = xml.querySelector('[p="innerHTML"]');
            message = message ? message.textContent : '';

            var message_error = message ? /myWinError/.test(message) : false;

            if(type == 'add') {

                var content = xml.querySelector('[p="innerHTML+"]');

                cb_options = extend(cb_options, {
                    status: message && content && !message_error ? 1 : 0,
                    message: message,
                    content: content ? content.textContent : ''
                });

            } else if(type == 'edit') {

                cb_options = extend(cb_options, {
                    status: message && !message_error && /myWinLoadSD/.test(message) ? 1 : 0,
                    message: message
                });

            } else if(type == 'remove') {
                cb_options.status = /comEnt/.test(text) ? 1 : 0;
            }

            if(options.cb) options.cb.call(this, cb_options);
        }

        return xhrAsync(['/index/', options], callback, callback);
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

        var data = array[1];
        var formdata = new FormData();

        var type = data ? 'POST' : 'GET';
        var request = new XMLHttpRequest();

        request.onerror = function() {
            if(cbe) cbe.call(this);
        }

        request.onload = function() {
            if( this.status === 200 ) cb.call(this, this.responseText); else request.onerror.call(this);
        };

        if( data ) {
            for(var key in data) {
                if( !data.hasOwnProperty(key) ) continue;
                formdata.append(key, data[key]);
            }
        }

        request.open(type, array[0], true);
        request.send( data ? formdata : '');

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
                if( obj1[key] && obj1.hasOwnProperty(key) ) obj[key] = obj1[key];
            }
        }

        return obj;
    }

})();
