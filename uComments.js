
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

*/

(function() {

    'use strict';

    window.uComments = function(module) {

        this.module = module || 'stuff';

        this.post_cb  = false;
        this.post_cbe = false;

        this.result = {
            nodes: 0
        };

        this.url    = '';
    };

    var POST_VAR = {
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
    };


    /* public
    ---------------------------------------------------------------------------------- */

    // init get and local
    uComments.prototype.local = function(element, cb) {

        if(!element) return false;

        this.result = parseAll(element);
        var resultArg = this.result ? extend({}, this.result) : false;

        if(cb) cb.call(this, resultArg);
    };

    // get
    uComments.prototype.get = function(url, cb, cbe) {

        var _this = this;
        return xhrAsync([url], function(text) {

            _this.url = url;
            _this.result = parseAll(text);

            var resultArg = _this.result ? extend({}, _this.result) : false;

            if(cb) cb.call(_this, resultArg);
        }, cbe || null);
    };


    // syntax suggar
    uComments.prototype.add = function(entry_id, message, cb, cbe) {
        return postHandler.call(this, 'add', {id: entry_id, message: message}, cb, cbe);
    };

    uComments.prototype.addSub = function(comment_id, message, cb, cbe) {
        return postHandler.call(this, 'add', {pid: comment_id, message: message}, cb, cbe);
    };

    uComments.prototype.edit = function(comment_id, message, answer, cb, cbe) {
        return postHandler.call(this, 'edit', {s: comment_id, message: message, answer: answer}, cb, cbe);
    };

    uComments.prototype.remove = function(comment_id, cb, cbe) {
        return postHandler.call(this, 'remove', {s: comment_id}, cb, cbe);
    };

    // post
    uComments.prototype.post = function() {
        return postHandler.apply(this, arguments);
    };

    // utils
    uComments.prototype.extend = extend;
    uComments.prototype.isObject = isObject;

    uComments.prototype.printNodes = function(isChilds, userNodes) {
        var nodes = userNodes || this.result.nodes;
        return printNodes(nodes, isChilds);
    };

    /* private
    ---------------------------------------------------------------------------------- */

    var printNodes = function(nodes, isChilds) {

        if( !nodes || !Array.isArray(nodes) || !nodes.length ) return false;
        var fragment = document.createDocumentFragment();

        var each_cb = function(item) {

    		if(!item.node) return;

            // добавляем сам элемент
            fragment.appendChild(item.node.cloneNode(true));

            // добавляем зону для добавления комментариев
            if(item.id && item.level) {
        		var appEntry = document.createElement('div');

        		appEntry.id = 'appEntry' + item.id;
        		appEntry.style = 'margin-left:'+ (item.level * 20 + 20) +'px';

        		fragment.appendChild(appEntry);
            }

            // добавлем потомков
    		if(isChilds && item.childs.length) {
                var childsNode = printNodes(item.childs);
                if(childsNode) fragment.appendChild(childsNode);
            }
    	};

        nodes.forEach(each_cb);
    	return fragment;
    };

/*
        postHandler('add', {id: 0, pid: 0, message:''})
        postHandler('add', {pid: 0, message:''})
        postHandler('edit', {s: 0, message:''})
        postHandler('remove', {s: 0})
*/

    var postHandler = function(type, user_options, cb, cbe) {

        var _this = this;
        var options = extend(POST_VAR[type], POST_VAR.module[this.module], this.result.ssid, user_options);

        if(!this.result || !this.url) return false;

        var callback = function(text) {

            text = text || '';
            var cb_options = {status: 0,message: '',content: ''};

            var xml = this.responseXML;

            if (!xml || !xml.documentElement) {
                if(cbe) cbe.call(this);
                return false;
            }

            var message = xml.querySelector('[p="innerHTML"]');
            message = message ? message.textContent : '';

            var message_error = message ? /myWinError/.test(message) : false;

            if(type == 'add') {

                var content = xml.querySelector('[p="innerHTML+"]');
                var status = message && content && !message_error ? 1 : 0;

                if( content ) {
                    var nodesObject = parseNodes( toNode(content.textContent, 1) );
                    content = nodesObject[Object.keys(nodesObject)[0]];
                }

                cb_options = extend(cb_options, {
                    status: status,
                    message: message,
                    content: content ? content.node : 0
                });

            } else if(type == 'edit') {

                cb_options = extend(cb_options, {
                    status: message && !message_error && /myWinLoadSD/.test(message) ? 1 : 0,
                    message: message
                });

            } else if(type == 'remove') {
                cb_options.status = /comEnt/.test(text) ? 1 : 0;
            }

            if(cb && cb_options.status === 1) cb.call(this, cb_options);
            if(cbe && cb_options.status === 0) cbe.call(this);
        };

        return xhrAsync(['/index/', options], callback, callback);
    };

    var parseSsid = function(text) {
        var sos = 0, ssid = 0;

        if( text.nodeType ) {
            var inp_ssid = document.querySelector('input[name=ssid]');
            var inp_sos = document.querySelector('input[name=sos]');

            if(inp_ssid) ssid = inp_ssid.value;
            if(inp_sos) sos = inp_sos.value;
        } else {

            // sos
            var regexp_sos = new RegExp('_dS\\(\'(.*?)\'\\);', 'i');
            sos = regexp_sos.test(text) ? _dS(text.match(regexp_sos)[1]) : '';
            sos = /\d+/.test(sos) ? sos.match(/\d+/)[0] : '';

            // ssid
            var regexp_ssid = new RegExp('name="ssid"\\svalue="(.*?)"', '');
            ssid = regexp_ssid.test(text) ? text.match(regexp_ssid)[1] : '';
        }

        return {sos: sos, ssid: ssid};
    };

    function toNode(text, isFull) {

        var html = document.createElement('html');
        html.innerHTML = text;

        return isFull === undefined ? html.querySelector('body').firstChild : html;
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
        };

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
        var i, c, r='', l=s.length-1, k=s.substr(l,1);
    	for (i = 0; i < l; i++) {
    		c = s.charCodeAt(i) - k;
    		if (c < 32) {
    			c = 127 - (32 - c);
    		}
    		r += String.fromCharCode(c);
    	}
    	return r;
    }

    function parentToFragment(parent) {

        var fragment = document.createDocumentFragment();
        var clonedParent = parent.cloneNode(true);

        while(clonedParent.firstChild) fragment.appendChild(clonedParent.firstChild);
        return fragment;
    }

    function parseDataAttributes(element) {

        if(!element || !element.dataset) return false;
        var array = ['rating', 'level'], object = {};

        for(var i =0;i<array.length;i++) {
            var item = array[i];
            if(element.dataset[item]) object[item] = element.dataset[item];
        }

        return object;
    }

    var parseAll = function(text) {

        var html = text.nodeType ? text : toNode(text, true);

        var object = {
            nodes: parseNodes(html),
            swtch: parseSwtch(html),
            ssid : parseSsid(text)
        };

        return object;
    };

    var parseNodes = function(html) {

        var nodes = html.querySelectorAll('[id^="comEnt"]');
        var array = [];

        for(var index in nodes) {

            if( !nodes.hasOwnProperty(index) ) continue;
            var node = nodes[index].cloneNode(true), element = {};

            element.id = node.getAttribute('id').replace('comEnt', '');
        	element.level = parseInt(node.style.marginLeft || 0) / 20;

            //node.removeAttribute('class');
        	//node.removeAttribute('style');

        	var last = array[array.length-1];
            var dataElement = node.querySelector('#ucomments-comment');

            var dataElementSet = parseDataAttributes(dataElement) || {};
            element = extend(dataElementSet, {node: node, index: parseInt(index), childs: []}, element);

            if(element.level === 0) {
                array.push(element);
            } else if(last){
                last.childs.push(element);
            }

        }

        return array;
    };

    /*
    array.forEach(function(item, i) {
       if(item.level === 0) {
          arrayFamily.push(item);
       } else {
          arrayFamily[arrayFamily.length-1].childs.push(item);
       }
    });
    */

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

    function isObject(value) {
        return Object(value) === value && !Array.isArray(value);
    }

    function extend(obj) {

        for(var i = 1; i < arguments.length; i++) {

            var obj1 = arguments[i];
            if(!isObject(obj1)) continue;

            for( var key in obj1) {
                if( obj1[key] !== undefined && obj1.hasOwnProperty(key) ) {
                    obj[key] = isObject(obj[key]) && isObject(obj1[key]) ? extend(obj[key], obj1[key]) : obj1[key];
                }
            }
        }

        return obj;
    }

})();
