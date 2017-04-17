
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
    comments.edit(com_id, message);
    comments.remove(com_id);

comments.update();


nodes = [
    {node: node, id: 7, level: 2}
]

*/

(function() {

    'use strict';

    window.uComments = function(module) {

        this.module = module || 'stuff';

        this.nodes  = [];
        this.ssid   = 0;
        this.sos    = 0;
        this.url    = null;
    };


    /* public
    ---------------------------------------------------------------------------------- */


    // get
    uComments.prototype.get = function(url, cb) {

        this.url = url;

        xhrAsync([url], function(text) {

            var result = comments.parseAll(text);
            cb.call(this, result);
        });
    }


    uComments.prototype.ssid = function(isUpdate, cb) {

        var ssid = this.ssid;
        var sos = this.sos;

        if( isUpdate || !ssid || !sos ) {

        }

        return {ssid: ssid, sos: sos};
    }




    uComments.prototype.add = function(entry_id, message, pid) {

        if( !entry_id && !message ) return false;

        var _this = this;
        var data = {id: entry_id, message: message, ssid: this.object.ssid, sos: this.object.sos};

        if( this.module == 'stuff' ) {
            data = Gu.extend(data, {a: 36, m: 8});
        }

        // если ответ
        if(this.answer_pid.dataset.pid) {
            data.pid = this.answer_pid.dataset.pid;
        }

        // post
        Gu.post('/index/', data, function(xml) {

            var message = xml.querySelector('cmd[t="eMessage"]'), commentry = '';
            message = message ? message.textContent : '';

            if( /myWinSuccess/.test(message) ) {
                commentry = xml.querySelector('cmd[t="newEntryB"]');
                commentry = commentry ? commentry.textContent : '';
                commentry = Gu.parseHTML(commentry)[0];
                commentry = commentOnly.parse([commentry]);
            }

            printComments.addToContainer(commentry, PROTO_THIS.container);
            PROTO_THIS.message.value = '';

            if(cb) cb.call(this, message, commentry);
        });
    };

   // private

    // xhrAsync(['/ghhh',{a:1}], function(){}, function(){});
   function xhrAsync(array, cb, cbe) {

        var type = array[1] ? 'POST' : 'GET';
        var request = new XMLHttpRequest();

        request.onerror = function() {
            if(cbe) cbe.call(this);
        }

        request.onload = function() {
            if( this.status === 200 ) cb.call(this, this.responseText); else request.onerror.call(this);
        };

        request.open(type, array[0], true);
        request.send(array[1] || null);

        return request;
   }


    var comments = (function() {


        var _dS = function(s) {
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

        var parseSossid = function(text) {

            // sos
            var regexp = new RegExp('_dS\(\'(.*?)\'\);', 'i'), input;

            if( regexp.test(text) ) {
                input = _dS(text.match(regexp)[1]).match(/\d+/g);
            }

            // ssid

            return input[0] || 0;
        };

        function parseNodes(html) {
            html.querySelectorAll('#allEntries > .comEnt');
        }
        function parseSwitches(html) {
            html.querySelectorAll('[class^="swchItem"]');
        }

        function parseAll(text) {

            var html = parseHTML(text);

            var object = {
                nodes   : parseNodes(html),
                switches: parseSwitches(html),
                sosssid : parseSossid(text)
            }

            return object;
        }

        return {parseAll: parseAll};
    })();

    var allEvents = {

        bindBodyClick: function() {
            var _this = this;

            document.body.addEventListener('click', function(e) {

                var el = e.target;

                if(e.target === _this.button_update) {

                    e.preventDefault();

                    var surl = e.target.dataset.switchUrl;
                    if(surl) _this.load(surl, true);

                } else if( e.target === _this.button ) {
                    e.preventDefault();

                    if( _this.message && _this.message.value ) {
                        _this.post.call(_this, _this.options.id, _this.message.value);
                    } else {
                        console.log('Ошибка');
                    }
                } else if(el == _this.answer_pid) {

                    e.preventDefault();
                    if(!_this.answer_pid.dataset.pid) return;

                    var comFocused = document.getElementById('ent'+_this.answer_pid.dataset.pid);
                    if(!comFocused) return;

                    comFocused.scrollIntoView();


                } else if(el.id == 'comm-answer-cancel') {

                    e.preventDefault();
                    if(!_this.answer_container && !_this.answer_pid) return;

                    _this.answer_container.style.display = 'none';
                    _this.answer_pid.dataset.pid = '';

                } else if( el.id == 'commt-text') {

                    var pid = e.target.dataset.id;
                    if(!pid && !_this.answer_container && !_this.answer_pid ) return;

                    _this.answer_pid.dataset.pid = pid;
                    _this.answer_pid.innerText = '#'+pid;
                    _this.answer_container.style.display = '';

                    _this.message.focus();
                    _this.message.scrollIntoView();
                    _this.message.classList.add('active');

                }

            });
        }

    };

    var pageLinks = {
        parse: function(items){

            if( !items.length ) return false;

            var pages = {};

            var regexp_id = new RegExp('\\d+','i');
            var regexp_url = new RegExp(",\\'(.*?)\\'", 'i');

            Gu.each(items, function(item) {

                var val = item.getAttribute('onclick');

                if( regexp_url.test(val) && regexp_id.test(val) ) {
                    var id = val.match(regexp_id)[0];
                    var url = val.match(regexp_url)[1];

                    pages[id] = atob(url);
                }

                if(item.tagName == 'B') {
                    var active_id = item.querySelector('span').innerHTML;
                    pages[active_id] = 'active';
                    pages.active = active_id;
                }

            });

            return pages;
        }
    };


    var get_sos = function(all) {

        all = all.innerHTML || '';

        var regexp = new RegExp("_dS\\('(.*?)'\\);",'i');
        var _dS = function(s) {
        	var i;  var r="";  var l=s.length-1;  var k=s.substr(l,1);
        	for (i = 0; i < l; i++) {
        		c = s.charCodeAt(i) - k;
        		if (c < 32) {
        			c = 127 - (32 - c);
        		}
        		r += String.fromCharCode(c);
        	}
        	return r;
        };

        if( !regexp.test(all) ) return 0;

        var input = _dS(all.match(regexp)[1]);
        input = input.match(/\d+/g);

        return input[0] || 0;

    };

    var commentOnly = {
        parse: function(items) {


            Gu.each(items, function(item) {
                var id = item.getAttribute('id').replace('comEnt', '');
                coms[id] = item.innerHTML;
            });

            return coms;
        }
    };

    var allEntries = (function() {

        var parseComments = function(nodes) {

            var return_nodes = [];

            [].forEach.call(nodes, function(node) {
                return_nodes.push(node.firstChild);
            });

            return return_nodes;
        };

        return {
            parseComments: parseComments,
            getAsync :  function(url, cb) {
                Gu.get( url+'?comments', function(html) {
                    cb.call(this, html);
                });
            },
            parse: function(all) {

                if(!all) return console.log('error parse', all);

                var comments = all.querySelectorAll('#allEntries > .comEnt');
                var pages = all.querySelectorAll('[class^="swchItem"]');
                var ssid = all.querySelector('input[name="ssid"]');
                var sos = get_sos(all);

                pages = pages ? pageLinks.parse(pages) : false;
                ssid = ssid ? ssid.value : false;
                comments = parseComments(comments);

                return {
                    nodes: comments,
                    switches: pages,
                    ssid : ssid,
                    sos: sos
                };
            }
        };
    })();

    function check(is, re) {
        return is ? is : re;
    }

    var printComments = (function() {

        var showComment = function(comment) {
            setTimeout(function() {
                comment.classList.remove('animate');
            }, 20);
        };

        return {

            toContainer: function(nodes, container) {

                var content = document.createDocumentFragment();

                [].forEach.call(nodes, function(node) {
                    content.appendChild(node);
                });

                container.appendChild(content);

            },

            addToContainer: function(object, container, isPrepend) {

                isAppend = !isPrepend || !container.firstChild;

                var keys = Object.keys(object);
                keys = isAppend ? keys : keys.reverse();

                keys.forEach(function(key, index) {

                    var comment = Gu.parseHTML(object[key])[0];
                    if(!comment) return;

                    comment.classList.add('animate');

                    if( isAppend ) {
                        container.appendChild(comment);
                    } else {
                        container.insertBefore(comment, container.firstChild);
                    }

                    showComment(comment);
                });

            },

            pages: function(object) {

                var output = '';

                for( var id in object.switches ) {

                    var link = object.switches[id];
                    var isActive = link == 'active';

                    output += '<a '+ (!isActive ? 'href="'+ link +'"' : '') +' class="comments-link'+ (isActive ? ' active' : '')+'">' + id + '</a>';
                }

                return output;
            }
        };

    })();


})();
