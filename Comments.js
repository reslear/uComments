
(function(){

    window.Comments = function(user_options) {

        var options = Gu.extend({
            module: 'stuff',
            container: '#comments',
            switches: '#comment-switches',
            button: '#comment-button',
            button_update: '#comment-button_update',
            message: '#comment-message',
            id: 0,
            insert: 'beforeend'
        }, user_options);

        this.options = options;
        this.object = false;


        this.container = options.container ? document.querySelector(options.container) : false;
        this.switches = options.switches ? document.querySelector(options.switches) : false;
        this.button = options.button ? document.querySelector(options.button) : false;
        this.button_update = options.button_update ? document.querySelector(options.button_update) : false;
        this.message = options.message ? document.querySelector(options.message) : false;

        this.answer_pid = document.getElementById('comm-answer-pid');
        this.answer_container = document.getElementById('comm-answer-container');
    };

    Comments.prototype.init = function(url) {

        this.load(url || location.origin + location.pathname);
        allEvents.bindBodyClick.call(this);
    };

    Comments.prototype.load = function(url, isPrepend) {

        var _this = this;
        if(!url) return false;

        allEntries.getAsync(url, function(all) {

            var object = allEntries.parse(all);
            _this.object = object;

            if( _this.button_update ) {

                var nextSwitchUrl = object.switches[parseInt(object.switches.active)+1];
                var isSwitch = object.switches.active && nextSwitchUrl;

                _this.button_update.style.display = isSwitch ? '' : 'none';
                _this.button_update.dataset.switchUrl = isSwitch ? nextSwitchUrl : null;
            }

            if(_this.container) {
                printComments.toContainer(object.nodes, _this.container, isPrepend);

            }

            if(_this.switches) {
                _this.switches.innerHTML = printComments.pages(object);
            }

            console.log(object);
        });
    };

    Comments.prototype.post = function(id, _message, cb) {

        if(!_message.length) return console.log('пустое сообщение');

        var PROTO_THIS = this;
        var data = {id: id, message: _message, ssid: this.object.ssid, sos: this.object.sos};

        if( this.options.module == 'stuff') {
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
