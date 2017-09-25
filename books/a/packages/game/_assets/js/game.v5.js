// Avoid `console` errors in browsers that lack a console.
if (!(window.console && console.log)) {
    (function () {
        var methods = ['assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error', 'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log', 'markTimeline', 'profile', 'profileEnd', 'markTimeline', 'table', 'time', 'timeEnd', 'timeStamp', 'trace', 'warn'];
        var length = methods.length;
        var console = window.console = {};
        while (length--) {
            console[methods[length]] = function () {
            };
        }
    }());
}

$game = {

    playing: [],
    sounds: [],
    soundCoords: [],
    soundTimer: null,
    root: null,
    cdTimer: null,
    ie: null,
    ios: null,
    time: null,
    iosClicked: null,
    cdCount: null,
    audio: null,
    audioloaded: false,
    audioFile: null,
    audioFormat: null,
    nav: null,
    highlightSpeed: 800,
    resources: {},
    resourcesTimer: null,
    lazyLoading: true,
    callback: {},
    vars: {},
    preloadConfig: {},
    soundSprite: {},

    load: function (callback) {
        if (callback) {
            if (typeof callback != "object")callback = {onload: callback};
        } else {
            callback = {};
        }

        this.callback = callback;
        var ua = navigator.userAgent.toLowerCase();
        this.animate = this.supports('transition');
        this.ie = (navigator.userAgent.indexOf("MSIE") > -1) ? 1 : 0;
        this.ios = (navigator.userAgent.match(/(iPad|iPhone|iPod)/g)) ? 1 : 0;
        this.android = ua.indexOf("android") > -1;
        if (this.android)this.ios = true;
        var d = new Date();
        this.time = d.getTime();

        this.root = $('#game');
        var self = this;
        if(navigator.appVersion.indexOf("Android") == -1 || (navigator.appVersion.indexOf("Android") != -1 && window.location.host.indexOf("localhost") == -1)){
            var v = this.getxmlversion();
        }
        else if(navigator.appVersion.indexOf("Android") != -1 && window.location.host.indexOf("localhost") != -1){
            var v = androidInterface.AndroidValue();
        }
        if ($game.vars.log) {
            $('<div>').attr('id', 'output').appendTo($('body'));
        }
        if(navigator.appVersion.indexOf("Android") == -1 || (navigator.appVersion.indexOf("Android") != -1 && window.location.host.indexOf("localhost") == -1)){
            var xml = (v) ? "data." + v + ".xml" : "data.xml";
        }
        else if(navigator.appVersion.indexOf("Android") != -1 && window.location.host.indexOf("localhost") != -1){
            var xml = "data." + v + ".xml";
        }
        if(navigator.appVersion.indexOf("Android") == -1 && navigator.appVersion.indexOf("iPad") == -1 && window.location.host.indexOf("localhost") == -1){
           $.get(xml, function (g) {
            var data = self.xml2obj(g);
            self.data = data.game;
            self.init();
            if (self.callback.onload)self.callback.onload(data.game);
            });
        }
        else{
        $.ajax({
                        url: xml,
                        type: 'GET',
                        dataType: 'xml'
                  })
                  .done(function(xml) {
                        var data = self.xml2obj(xml);
            JSON.stringify(data);
            
            self.data = data.game;
            self.init();
            if (self.callback.onload)self.callback.onload(data.game);
                  })
                  .fail(function() {
                        console.log("error");
                  })
                  .always(function() {
                        console.log("complete");
                  });
        }
        var self = this;

        var frame = parent.$("#game-iframe").first();
        if (frame.length) {
            frame.on("remove", function (event) {
                $game.log("unloading game");
                if (self.audio) {
                    self.audio.pause();
                }
            });
        }

    },

    getxmlversion: function () {
        var href = window.location.href;
        var h = href.split("?");
        if (h.length < 2)return false;
        var v = h[1];
        v = v.split("&");
        $game.vars = {};
        for (var n in v) {
            var w = v[n];
            w = w.split("=");
            var name = w[0];
            var val = (w.length > 1) ? w[1] : null;
            if (val.match(/^[0-9]+$/))val = parseInt(val);
            $game.vars[name] = val;
        }
        if ($game.vars.vRooftops)return $game.vars.vRooftops;

        return false;

    },

    log: function (msg) {
        console.log(msg);
        var o = $('#output').first();
        if (!o.length)return;
        var p = $('<p>').html(msg);
        o.prepend(p);
    },

    init: function () {
        var self = this;
        if (this.data.type)$('#game').addClass(this.data.type);
        if (this.data.version)$('#game-content').addClass(this.data.version);
        if (this.data.sounds)this.data.sound = this.data.sounds;
        this.addResource("../_assets/img/star.png");
        if (this.data.sound) {
            //prepare sound coords
            this.soundSprite = {};
            for (var n in this.data.sound) {
                var s = this.data.sound[n];
                s.start = parseFloat(s.start);
                s.stop = parseFloat(s.stop);
                var id = s.id;
                this.soundSprite[id] = s;
            }
            this.soundCoords = this.soundSprite;
            if (!this.data.audio)this.data.audio = "audio.mp3";

            this.audio = new spritePlayer(this.soundSprite);
            this.audio.load(this.data.audio, function () {
                self.audioloaded = true;
                if (self.callback.onaudio)self.callback.onaudio(self.data);
            });
            if (this.ios) {
                $('body').one("touchend", function (event) {
                    self.iosClicked = true;
                });
            }
        }

        if (this.data.title) {
            var t = this.data.title;
            if (typeof t != "object")t = {content: t};
            $titleSpan = $('<span>').append(t.content);
            var h = $('<h1>').html($titleSpan);
            var ht = $('<title>').first();
            document.title = t.content;

            $('#game').prepend(h);
            if (t.sound) {
                var si = $('<div class="sound-icon"></div>');
                h.prepend(si);
                si.data('sound', t.sound).click(function (event) {
                    $game.playSound($(this).data('sound'));
                });
            }

        }
        $('#game #popup').hide();
        $('#game #popup .close').click(function (event) {
            $(this).closest('#popup').hide();
            $('.popup-overlay').remove();
        });
        var close = $('<div>').attr('id', "close");
        $('#game').append(close);
        //close game
        close.on('click', function () {
            parent.window.closeGame();
            return false;
        });
        $('#game .button').each(function (n, b) {
            var $b = $(b);
            var t = $b.text();
            $b.html('');
            var s = $('<span>').html(t);
            $b.append(s);
            s.wrap('<b>');
        });
    },

    addResource: function (file, lazy, callback) {
        $game.log("add resource: " + file);
        if (typeof file != "object")file = [file];
        for (n in file) {
            var f = file[n];
            if (!this.resources[f])this.resources[f] = {file: f, loaded: 0, lazy: lazy, callback: callback, content: null};
        }
    },

    addAsset: function (file, lazy, callback) {
        switch (file) {
        case "select-players":
            this.addResource("../_assets/img/bg_players.png", lazy, callback);
            this.addResource("../_assets/img/bg_player.png", lazy, callback);
            break;
        }
    },

    preloadPopup: function (popups) {
//        var p;
        if (typeof popups == "string")popups = popups.split(",");
        for (var p in popups) {
            if (popups.hasOwnProperty(p)) {
                var pu = popups[p];
                switch (pu) {
                case "win":
                    this.addResource("../_assets/img/well-done.png", true);
                    break;
                case "start":
                    this.addResource("../_assets/img/start.png", true);
                    break;
                case "finish":
                    this.addResource("../_assets/img/finish.png", true);
                    break;
                case "timeup":
                    this.addResource("../_assets/img/time-up.png", true);
                    break;
                case "trophy":
                    this.addResource("../_assets/img/trophy.png", true);
                    break;
                case "gameOver":
                    this.addResource("../_assets/img/game-over.png", true);
                    break;
                default:
                    $game.log('Popup not defined');
                    break;
                }
            }
        }
    },

    getResource: function (file) {
        if (this.resources[file])return this.resources[file].content;
        return null;
    },

    preloadResources: function (config) {
        this.preloadConfig = $.extend({
            onComplete: null,
            onResources: null,
            hideButtons: true,
            iosTrigger: true,
            showStatus: false,
            requireAudio: true,
            showCountdown: true
        }, config);
        this.lazyLoading = false;
        var p = $('<div>').attr('id', 'game-preload').html('<img src="../_assets/img/loading.gif" />').addClass("loading");
        $('#game').append(p);
        //adapt size of preload overlay
        var h = $('#game').innerHeight() - $('#buttons').outerHeight();
        p.css({height: h + "px"});
        //hide buttons        
        var self = this;
        var s;
        if (self.preloadConfig.showStatus) {

            s = $('<div>').addClass("status").html('Loading Game');
            p.append(s);
        }
        if (self.preloadConfig.hideButtons)$('#buttons .content').css({visibility: "hidden"});

        self.loadNextResource();
    },

    loadNextResource: function () {
        var load;
        var file;
        var self = this;
        //check for resources to load
        for (var n in this.resources) {
            var r = this.resources[n];
            if (!r.loaded && ((!this.lazyLoading && !r.lazy) || (this.lazyLoading && r.lazy))) {
                load = r;
                file = n;
                break;
            }
        }
        if (load) {
            if (!load.type) {
                //try to set type
                if (load.file.match(/\.(png|jpg|gif|jpeg)$/i))load.type = "image";
            }
            //for now only images are supported
            if (load.type == "image") {
                var loadImg = new Image();
                loadImg.onload = function () {
                    self.resources[file].loaded = 1;
                    self.resources[file].content = loadImg;
                    if (load.callback)load.callback();
                    self.loadNextResource();
                }
                loadImg.src = load.file;

            }
        } else if (!this.lazyLoading) {
            var self = this;
            $game.log("resources ready");
            //no non-lazy resources left to load            
            if (this.preloadConfig.onResources)this.preloadConfig.onResources();
            resourcesTimer = setInterval(function () {
                self.checkResourcesLoaded();
            }, 50);
            //we can continue to load lazy resources
            this.lazyLoading = true;
            self.loadNextResource();
        }
    },

    checkResourcesLoaded: function () {
        var self = this;

        if (this.ios && !this.iosClicked && this.preloadConfig.iosTrigger) {
            //we still require a click to load the audio     
            clearInterval(resourcesTimer);
            var pl = $('#game-preload');
            pl.removeClass("loading");
            var btn;
            if (this.data.countdown) {
                //if countdown is not set to auto then we do so now because of the button we are adding.
                var cd = this.data.countdown;
                cd = cd.toString();
                if (!cd.match("auto"))cd = "auto:" + cd;
                this.data.countdown = cd;
            }
            //always show a start button
            var btnText = (typeof this.preloadConfig.iosTrigger == "string") ? this.preloadConfig.iosTrigger : "Play";
            btn = this.getButton(btnText, "button-big");
            pl.append(btn);
            this.center(btn);
            pl.one("click", function (event) {

                //audio.play() will be triggered... set within init()
                if (btn)btn.hide();
                pl.addClass("loading");
                resourcesTimer = setInterval(function () {
                    self.checkResourcesLoaded();
                }, 100);
            });

        } else if (this.audioloaded || !this.preloadConfig.requireAudio) {
            $game.log("all resources loaded");
            clearInterval(resourcesTimer);
            resourcesTimer = null;
            //remove preload window            
            function removePreloader() {
                $('#game-preload .status').html('Finished loading');
                $('#game-preload').remove();
                $('#buttons .content').css({visibility: "visible"});
                if (self.preloadConfig.onComplete)self.preloadConfig.onComplete();
            }

            if (self.data.countdown && this.preloadConfig.showCountdown) {
                self.countdown({
                    start: self.data.countdown,
                    element: $('#game-preload'),
                    callback: self.preloadConfig.onComplete
                });
                self.data.countdown = null; //dont show again
            } else {
                removePreloader();
            }
        }
    },

    /*
     * Function to clear up the game-content.
     */

    clear: function () {
        $('#game-content').html('');
        this.hidePopup();
        this.stopSound();
        $game.enable();
    },

    /*
     * Function to disable user input... adds an invisible layer on top of the game so the user cannot click any elements
     * The z-index of the element is set at 999
     */
    disable: function () {
        $game.log('disable');
        var d = $('#game-lock').first();
        if (!d.length) {
            d = $('<div>').attr('id', 'game-lock');
            $('#game').append(d);
        }

    },

    enable: function () {
        $game.log('enable');
        $('#game #game-lock,#game #content-lock').remove();

    },

    disableContent: function () {
        $game.log('disable content');
        var d = $('#content-lock').first();
        if (!d.length) {
            d = $('<div>').attr('id', 'content-lock');
            var b = $('#game #buttons').first().outerHeight();
            d.css({bottom: b + "px"});
            $('#game').append(d);
        }
    },

    navigation: function (num, callback) {
        if (!num || num < 2)return false;
        if (this.nav)this.nav.remove();
        var nav = $('<div>').addClass("nav");
        var ul = $('<ul>');
        nav.append(ul);
        $('#buttons .content').append(nav);
        for (var i = 0; i < num; i++) {
            var a = $('<li>').data('num', i);
            if (!i)a.addClass("active");
            ul.append(a);
        }
        var self = this;
        var btn = $('<div></div>').addClass("button").html('<b><span>Next</span></b>');
        nav.append(btn);
        btn.click(function (event) {
            if (!$(this).hasClass('active'))return;
            var num = nav.find('li.active').index() + 1;
            if (callback)callback(num);
//            $(this).hide();
            $(this).removeClass('active');

            nav.find('li.active').removeClass('active');
            var a = nav.find('li').get(num);
            $(a).addClass("active");
        });
//        btn.hide();

        if ($game.data.config) {
            //enables navigation between screens when game is in config mode
            ul.find('li').click(function (event) {
                $(this).addClass("active").siblings('li').removeClass("active");
                var num = $(this).index();

                if (callback)callback(num);
            });
        } else {
            btn.removeClass('active');
        }
        this.nav = nav;

        return btn;

    },

    next: function () {
        var btn = this.nav.find('.button').trigger("click");
    },

    nextbtn: function () {
        var nextAvailable = false;
        if (!this.nav)return false;
        var num = this.nav.find('li').length;
        var i = this.nav.find('li.active').index();
//        if (i < num - 1)this.nav.find('.button').show();
        if (i < num - 1) {
            this.nav.find('.button').addClass('active');
            nextAvailable = true;
        }
        return nextAvailable;
    },
    isLastScreen: function () {
        var $nav = $('.nav');
        return $nav.length === 0 || ($nav.length > 0 && $nav.find('li').last().hasClass('active'));
    },

    soundButton: function () {
        var b = $('<div>').addClass("sound-button").html('<div class="inner"><i></i></div>');
        return b;
    },

    getButton: function (text, c) {
        var b = $('<div>').addClass("button").html('<b><span>' + text + '</span></b>');
        if (c)b.addClass(c);
        return b;
    },

    countdown: function (start, callback) {
        var config;
        if (typeof start != "object") {
            config = {start: start, callback: callback};
        } else {
            config = start;
        }
        var startBtn = true;
        var start = config.start;
        if (typeof config.start == "string") {
            if (config.start.match(/auto/))startBtn = false;
            start = parseInt(config.start.replace(/auto:/, ""));
        }

        var cd = (config.element) ? config.element : $('<div>').attr('id', 'countdown');
        cd.addClass("countdown");
        if (!config.element)this.root.append(cd);
        $('#buttons .content').css({visibility: "hidden"});

        var num;
        var self = this;
        self.cdCount = start;

        if (startBtn) {
            var btn = this.getButton("Start game", "button-big");
            cd.append(btn);
            self.center(btn);

            self.flash(btn);
            btn.one("click", function (event) {
                btn.hide();
                startCountdown();
            });
        } else {
            startCountdown();
        }

        function endCountdown() {
            cd.fadeOut(200, function () {
                cd.remove();
                $('#buttons .content').css({visibility: "visible"});
                if (config.callback)config.callback();
            });
        }

        function startCountdown() {
            if (!start) {
                endCountdown();
            } else {
                num = $('<div>').addClass('num').html(start);
                $game.playSound('tic');
                cd.append(num);
                num.animate({top: '100%', opacity: 0}, 1000);
                self.cdTimer = setInterval(function () {
                    start--;
                    num.remove();
                    if (!start) {
                        clearInterval(self.cdTimer);
                        endCountdown();
                    } else {
                        num = $('<div>').addClass('num').html(start);
                        $game.playSound('tic');
                        cd.append(num);
                        num.animate({top: '100%', opacity: 0}, 1000);
                    }
                }, 1000);
            }
        }

    },
    //use when -webkit-transition scale fail in ubuntu (401-three-in-a-row-v2) #issue #7391
    flash_PATCH: function (el, scale, time, noClick, num){
        var stop = false;
        var scale = scale || 1.2;
        var time = time || 300;
        var flashcount = 0;

        var currentTime = 0,
            startValue = 1,
            changeInValue= scale - 1,
            duration = time/10;
                    
        var interval = setInterval(function(){transitionScale()} ,10);
        
        if (!noClick) {
            el.one("click", function (event) {
                stop = true;
            });
        }
        $('body').one('flashStop', function (event) {
            stop = true;
        })
        $(el).one('flashStop', function (event) {
            event.stopPropagation();
            stop = true;
        })
        
          function easeInOutSine (currentTime, startValue, changeInValue, duration) {
                   
                var value = -changeInValue/2 * (Math.cos(Math.PI * currentTime/duration) - 1) + startValue;
                    
                return value;
                };
            
          function transitionScale(scale, time){
                        
                        if (currentTime >= duration){
                            vector = -1; 
                        }else if(currentTime <= 0){
                            vector = 1; 
                        }
                        currentTime = currentTime + vector*1;
                        
                        var factor = easeInOutSine(currentTime, startValue, changeInValue, duration);
                        
                            el.css('-webkit-transform', 'scale('+factor+')');
                        
                        if(stop){
                            clearInterval(interval);
                        }
            };

        return el;
    },
    //param force is used in tree-in-a-row to force animate in linux player #7391
    flash: function (el, scale, time, noClick, num, force) {
        if (!$.fn.transform)$game.log('transform.js not included');
        try {
            if (el.queue('fx')[0] === 'inprogress')
                return el;
        }
        catch (err) {
            $game.log(err);
        }
        var stop = false
        var scale = scale || 1.2;
        var time = time || 300;
        var flashcount = 0;
        var flasher = function () {
	if(!force && window.location.host.indexOf("localhost") != -1 && (navigator.appVersion.indexOf("Linux") != -1 || navigator.appVersion.indexOf("X11") != -1) && navigator.appVersion.indexOf("Android") == -1){
		el.animate(time).animate(time, function () {
                flashcount++;
                if (num && flashcount >= num)stop = true;
                if (!stop)flasher();
            })
	}
	else{
            el.animate({transform: {scale: scale}}, time).animate({transform: {scale: 1}}, time, function () {
                flashcount++;
                if (num && flashcount >= num)stop = true;
                if (!stop)flasher();
            })
	    }
        };
        
    if(!force && window.location.host.indexOf("localhost") != -1 && (navigator.appVersion.indexOf("Linux") != -1 || navigator.appVersion.indexOf("X11") != -1) && navigator.appVersion.indexOf("Android") == -1){
        // flasher();
	}
	else{
	   flasher(force);
	}
        
        
            
        if (!noClick) {
            el.one("click", function (event) {
                stop = true;
            });
        }
        $('body').one('flashStop', function (event) {
            stop = true;
        })
        $(el).one('flashStop', function (event) {
            event.stopPropagation();
            stop = true;
        })

        return el;
    },

    stopflash: function (el) {
        if (!el)
            $('body').trigger('flashStop');
        if (el) {
            el.triggerHandler('flashStop');
        }
    },

    twinkle: function (el, scale) {
        el = $(el);
        var t = $('<div>').addClass("twinkle");
        var minSize = 80;
        var elSize = Math.min(el.outerWidth(), el.outerHeight());
        el.append(t);
        if (t.outerWidth() < minSize) {
            var tl = 0.5 * (t.outerWidth() - minSize);
            t.css({left: tl + "px", width: minSize});
        }
        if (t.outerHeight() < minSize) {
            var tt = 0.5 * (t.outerHeight() - minSize);
            t.css({top: tt + "px", height: minSize});
        }
        var sizes = [
            {size: 12, left: '15%', top: '24%'},
            {size: 14, left: '53%', top: '9%'},
            {size: 25, left: '59%', top: '70%'},
            {size: 12, left: '76%', top: '38%'},
            {size: 10, left: '86%', top: '-2%'},
            {size: 12, left: '100%', top: '8%'}
        ];
        var stars = [];
        var starTimer;
        var starCount = 0;
        $(sizes).each(function (n, s) {
            var star = $('<img>').attr('src', '../_assets/img/star.png');
            //var star = $('<div>').addClass("twinkle-star"); //star as background-image
            t.append(star);
            var size;
            if (scale)scale = elSize / minSize;

            var o = s.size * 0.5;
            var to = o + 'px ' + o + 'px';
            star.css({width: s.size, height: s.size, left: s.left, top: s.top, marginLeft: -o + 'px', marginTop: -o + 'px', opacity: 0});
            if (scale)star.transform({scale: scale});
            stars.push(star);
        });

        function showStar() {
            var star = stars[starCount];
        if(window.location.host.indexOf("localhost") != -1 && (navigator.appVersion.indexOf("Linux") != -1 || navigator.appVersion.indexOf("X11") != -1) && navigator.appVersion.indexOf("Android") == -1){
	       star.animate({opacity: 1}, 150, 'linear').animate({opacity: 0}, 250, 'linear');
	    }
	    else{
            star.animate({transform: {rotate: -45}, opacity: 1}, 150, 'linear').animate({transform: {rotate: -90}, opacity: 0}, 250, 'linear');
            }
	    starCount++;
            if (starCount < stars.length) {
                setTimeout(showStar, 40);
            } else {
                setTimeout(function () {
                    t.remove();
                }, 400);
            }
        }

        setTimeout(showStar, 40);

    },

    highlight: function () {
        var hl = this.root.find('[data-highlight]');
        var o = [];
        hl.each(function (n, h) {
            var i = $(h).data('highlight');
            i = i.toString().split(":");
            var s = (i.length > 1) ? i[1] : false;
            var r = (i.length > 2) ? i[2] : false;

            o.push({index: i[0], selector: s, element: $(h), radius: r});
        });
        o.sort(function (a, b) {
            return (a.index > b.index) ? 1 : -1;
        });

        if (o.length) {
            this.highlight = o;
            this.highlightElement();
        }
    },

    unhighlight: function () {
        $('body').find('.highlight,.highlight-container').remove();

    },

    highlightElement: function (el, o) {
        if (!el) {
            if (!this.highlight.length)return;
            o = this.highlight.shift();
            var s = o.selector;
            el = o.element;
        } else {
            if (!o)o = {};

        }

        var self = this;
        var hl = (s && s != "0") ? el.find(s) : el;
        var p = el.parent();
        var hc = $('<div>').addClass("highlight-container");

        var z = this.getZ(el);

        var pos = el.position();
        if (el.css('position') == "static")el.css('position', 'relative');

        hc.css({left: pos.left + "px", top: pos.top + "px", zIndex: z});
        el.before(hc).css('z-index', z + 1);
        var self = this;

        hl.each(function (n, i) {
            var d = $('<div>').addClass("highlight");
            var cp = $(i).parent();
            var hpos = self.getAbsPos($(i), el);
            if (o.radius)d.css({borderRadius: o.radius + "px"});

            d.css({width: $(i).outerWidth() + "px", height: $(i).outerHeight() + "px", left: hpos.left + "px", top: hpos.top + "px"});
            hc.append(d);
        });

        el.click(function (event) {
            var h = $(this).data('highlight');
            $('body').find('.highlight,.highlight-container').remove();
            if (!h && h != 0)return;
            $(this).data('highlight', null);
            self.highlightElement();
        });
        hc.css({opacity: 0});
        this.highlightAnimation(hc);
    },

    highlightAnimation: function (el) {
        el.stop();
        var o = el.css('opacity');
        var no = (o == 1) ? 0 : 1;
        var s = this;
        if (this.animate) {

            el.transit({opacity: no}, this.highlightSpeed, function () {
                s.highlightAnimation(el);
            });
        } else {
            el.animate({opacity: no}, this.highlightSpeed, function () {
                s.highlightAnimation(el);
            });
        }
    },

    getAbsPos: function (child, parent) {
        var pp = $(parent).offset();
        var cp = $(child).offset();
        var pos = {left: cp.left - pp.left, top: cp.top - pp.top};
        return pos;
    },

    getZ: function (el) {
        var z = 0;

        while (el.length && el.get(0).tagName != "BODY") {

            z = parseInt(el.css('zIndex'));
            if (isNaN(z))z = 0;
            if (z)break;

            el = el.parent();
        }
        if (!z)z = 0;
        return z;
    },

    xml2obj: function (x, parentTag) {
        var s = this;
        var o = {};
        var pc = [];
        var keys = {};
        var a;
        if (x.attributes) {
            a = x.attributes;
            $(a).each(function (n, att) {
                o[att.nodeName] = att.nodeValue;
            });
        }

        $(x).children().each(function (n, c) {
            var cc = $(c).children();
            var t = c.tagName;
            var v = (cc.length) ? s.xml2obj(c, t) : $(c).text();
            if (typeof v == "string") {
                if (v.match(/^\-?[0-9]+$/))v = parseInt(v);
            }
            var a = c.attributes;
            if (a.length) {
                if (typeof v != "object")v = {content: v};
                $(a).each(function (n, att) {
                    var av = att.nodeValue;
                    if (av.match(/^\-?[0-9]+$/))av = parseInt(av);
                    v[att.nodeName] = av;
                });
            }
            var re = new RegExp("^" + t);
            if (parentTag && parentTag.match(re)) {
                pc.push(v);
            } else if (keys[t]) {
                if (keys[t] == 1) {
                    var ov = o[t];
                    o[t] = [];
                    o[t].push(ov);
                }
                o[t].push(v);
                keys[t]++;
            } else {
                o[t] = v;
                keys[t] = 1;
            }
        });
        if (pc.length)return pc;
        return o;

    },

    playsMp3: function () {
        var a = document.createElement('audio');
        return !!(a.canPlayType && a.canPlayType('audio/mpeg;').replace(/no/, ''));
    },

    playsOgg: function () {
        var a = document.createElement('audio');
        return !!(a.canPlayType && a.canPlayType('audio/ogg;').replace(/no/, ''));
    },

    playSound: function (id, callback) {
        var onready = false;
        if (callback) {
            if (!id) {
                callback();
                return;
            }
            $game.disable();
            onready = function () {
                $game.enable();
                callback();
            }

        }
        this.audio.playSound(id, onready);
    },

    stopSound: function () {
        this.audio.stopSound();
    },

    getSound: function (id) {
        if (this.soundSprite[id])return this.soundSprite[id];
        return false;
    },

    getName: function (file) {
        var name = file.replace(/^.*\//, "");
        name = name.replace(/\.mp3$/, "");
        return name;
    },

    /*
     * Detecta soporte para css3
     */

    supports: function (prop) {
        var div = document.createElement('div'),
            vendors = 'Khtml Ms O Moz Webkit'.split(' '),
            len = vendors.length;

        if (prop in div.style) return true;

        prop = prop.replace(/^[a-z]/, function (val) {
            return val.toUpperCase();
        });

        while (len--) {
            if (vendors[len] + prop in div.style) {

                return true;
            }
        }
        return false;
    },

    ie: function () {
        var i = navigator.userAgent.indexOf("MSIE");
        if (i === -1) {
            return false;
        } else {
            return true;
        }
    },

    valign: function (el, type, ref) {
        if (!ref)ref = el.parent();
        var p = el.parent();
        var pp = p.offset();
        var rp = ref.offset();
        var t = rp.top - pp.top;
        switch (type) {
        case "middle":
            t = rp.top - pp.top + 0.5 * (ref.outerHeight() - el.outerHeight());
            break;
        case "bottom":
            t = t + ref.outerHeight() - el.outerHeight();
            break;
        }
        var pos = el.css('position');
        if (!pos.match(/absolute|relative/))el.css({position: "relative"});
        el.css({top: t + "px"});
    },

    center: function (el) {
        var p = el.parent();
        var pp = p.css('position');
        if (!pp.match(/(absolute|relative)/))p.css('position', 'relative');
        var ml = -0.5 * el.outerWidth();
        var mt = -0.5 * el.outerHeight();
        el.css({position: "absolute", top: "50%", left: "50%", marginTop: mt + "px", marginLeft: ml + "px"});
    },

//    popup: function (config) {
//        if (!config || typeof config !== "object")return;
//        $('#game #popup').remove();
//        var pu = $('<div>').attr('id', 'popup');
//        var customImage;
//        customImage = config.image;
//        if (!config.type)config.type = "welldone";
//        pu.addClass(config.type);
//        $('#game').append(pu);
//        pu.hide();
//        var img;
//        if (customImage) {
//            img = customImage;
//        } else {
//            img = $('<img>');
//            switch (config.type) {
//            case "win":
//                img.attr('src', "../_assets/img/well-done.png").addClass("welldone");
//                break;
//            case "start":
//                img.attr('src', "../_assets/img/start.png").addClass("start");
//                break;
//            case "finish":
//                img.attr('src', "../_assets/img/finish.png").addClass("finish");
//                break;
//            case "timeup":
//                img.attr('src', "../_assets/img/time-up.png").addClass("timeup");
//                break;
//            case "trophy":
//                img.attr('src', "../_assets/img/trophy.png").addClass("trophy");
//                break;
//            case "gameOver":
//                img.attr('src', "../_assets/img/game-over.png").addClass("game-over");
//            }
//        }
//
//        pu.append(img);
//
//        if (!(config.type === 'win' || config.type === 'start' || config.type === 'finish' || config.type === 'timeup' || config.type === 'gameOver' || config.type === 'trophy') && !config.hideClose) {
//            var close = $('<div>').addClass("close");
//            pu.append(close);
//            close.click(function (event) {
//                self.hidePopup();
//            });
//            pu.addClass('close');
//        } else {
//            pu.removeClass('close');
//        }
//
//        var btn = $('<div>').addClass("button").html("<b><span>" + config.text + "</span></b>");
//        pu.append(btn);
//
//        var self = this;
//        btn.click(function (event) {
//            self.hidePopup();
//            if (config.click)config.click();
//        });
//
//        if (!(config.delay && typeof config.delay === 'number')) {
//            config.delay = 0;
//        }
//
//        if (config.additionalText) {
//            var span;
//            span = pu.prepend($('<span></span>'));
//            if (typeof config.additionalText === 'string') {
//                pu.children('span').first().html(config.additionalText);
//            } else if (typeof config.additionalText === 'object') {
//                pu.prepend(config.additionalText);
//            }
//        }
//
//        setTimeout(function () {
//            if (!$('.popup-overlay').length) {
//                $('#game').append('<div class="popup-overlay">');
//            }
//            if (config.sound) {
//                $game.playSound(config.sound);
//            }
//            pu.show();
//        }, config.delay);
//
//        return pu;
//    },
    popup: (function () {

        var popups = {
            win: {
                image: '../_assets/img/well-done.png',
                button: 'Play again',
                imageClass: 'win welldone',
                sound: 'win',
                text: '',
                textClass: ''
            },
            start: {
                image: '../_assets/img/start.png',
                button: 'Play',
                imageClass: 'start',
                sound: '',
                text: '',
                textClass: ''
            },
            finish: {
                image: '../_assets/img/finish.png',
                button: 'Play again',
                imageClass: 'finish',
                sound: 'win',
                text: '',
                textClass: ''
            },
            timeup: {
                image: '../_assets/img/time-up.png',
                button: 'Play again',
                imageClass: 'timeup',
                sound: 'timeup',
                text: '',
                textClass: ''
            },
            trophy: {
                image: '../_assets/img/trophy.png',
                button: 'Play again',
                imageClass: 'trophy',
                sound: 'win',
                text: "It's a draw!",
                textClass: '',
                winnerText: "[placeholder] wins!"
            },
            gameOver: {
                image: '../_assets/img/game-over.png',
                button: 'Play again',
                imageClass: 'game-over',
                sound: 'gameOver',
                text: 'Game over!',
                textClass: ''
            }
        };
        var removeCloseButtonAt = 'win start timeup gameOver finish trophy'.split(' ');

        var popupsInitialized = false;
        var initPopups = function () {
            if ($game.data.popups) {
                for (var p in popups) {
                    if ($game.data.popups.hasOwnProperty(p)) {
                        if (popups.hasOwnProperty(p)) {
                            $.extend(popups[p], $game.data.popups[p]);

                        }
                    }
                }
            }
            popupsInitialized = true;
        };
        var options;

        return function (config) {
            if (!popupsInitialized) {
                initPopups();
            }

            var $img = $('<img>');
            var $pu = $('<div>').attr('id', 'popup');
            var $close = $('<div>').addClass("close");
            var $text = $('<div>').addClass('text');
            var $image = $('<div>').addClass('image');
            var $middle = $('<div>').addClass('middle');
            var $span = $('<span>');
            var self = this;
            var btn;

            if (typeof config !== "object") {
                return false;
            }
            options = {
                type: 'win',
                delay: 0,
                click: false,
                noSound: false
            };

            $.extend(options, config);

            // the win popup should always play a sound, even when it is autosolved
            if (options.type === 'win') {
                options.noSound = false;
            }

            $img.attr('src', popups[options.type].image).addClass(popups[options.type].imageClass)

            $('#popup').remove();
            $('#game').append($pu);

            $pu.hide();
            $pu.addClass(options.type);
            $pu.prepend($text);
            $text.append($middle);
            $middle.append($span);
            $pu.append($image);
            $image.append($img);

            if (options.hideClose === undefined) {
                if (popups[options.type].hideClose) {
                    options.hideClose = popups[options.type].hideClose === 'true';
                } else {
                    options.hideClose = removeCloseButtonAt.indexOf(options.type) !== -1;
                }
            }

            if (options.hideClose === true) {
                $pu.removeClass('close')
            } else if (options.hideClose === false) {
                $pu.append($close);
                $close.click(function () {
                    self.hidePopup();
                });
                $pu.addClass('close');
            }

            btn = $('<div>').addClass("button").html("<b><span>" + popups[options.type].button + "</span></b>");
            btn.click(function () {
                self.hidePopup();
                if (options.click) {
                    options.click();
                }
            });
            $pu.append(btn);

            if (options.winner) {
                $span.prepend(popups[options.type].winnerText.replace('[placeholder]', options.winner))
            } else {
                $span.prepend(popups[options.type].text);
            }

            if (options.additionalText) {
                $span.append($('<br>'));
                $span.append(options.additionalText);
            }

            setTimeout(function () {
                if (!$('.popup-overlay').length) {
                    $('#game').append('<div class="popup-overlay">');
                }
                if (popups[options.type].sound && !options.noSound) {
                    $game.playSound(popups[options.type].sound, function () {
                    });
                }
                $pu.show();
            }, options.delay);

            return $pu;
        }
    }()),

    /****************************/
    /* Agregados @estebanlopeza */
    /****************************/

    /* Muestra el popup 
     @type (string)  : tipo de popup
     return void
     */
    showPopup: function (type) {
        var $pu = $('#popup');
        if ($pu.length) {
            $('#popup > img').hide();
            switch (type) {

            case 'win':
                $('#popup .welldone').show();
                break;
            case 'timeup':
                $('#popup .timeup').show();
                break;
            case 'start':
                $('#popup .start').show();
                break;
            case 'finish':
                $('#popup .finish').show();
                break;
            case 'trophy':
                $('#popup .trophy').show();
                break;
            case 'game-over':
                $('#popup .game-over').show();
                break;
            default:
                $game.log('show popup - not defined');
                break;
            }
            if (!$('.popup-overlay').length) {
                $('#game').append('<div class="popup-overlay">');
            }

            if (!(type === 'win' || type === 'start' || type === 'finish' || type === 'timeup' || type === 'gameOver' || type === 'trophy')) {
                var close = $('<div>').addClass("close");
                $pu.append(close);
                close.click(function (event) {
                    self.hidePopup();
                });
                $pu.addClass('close');
            } else {
                if ($pu.find('> .close').length > 0) {
                    $pu.find('> .close').remove();
                }
                $pu.removeClass('close');
            }
            $('#popup').show()
        }
    },

    /* Oculta el popup
     return void
     */
    hidePopup: function () {
        if ($('#popup').length) {
            $('.popup-overlay').remove();
            $('#popup').hide();
        }
    },

    /* Inicializa el timer (countdown)
     @pbar (string)  : selector del timer
     @time (int)     : tiempo del timer en segundos
     return void
     */
    initTimer: function (pbar, time, options) {

        var $this = this;
        var $progressbar = $(pbar);
        var step = 0,
            hidePopup = options ? options.hidePopup || false : false,
            callback = options ? options.callback || false : false;

        $progressbar.removeClass('alert danger');
        $progressbar.progressbar({value: 100}).children('div').removeAttr('style').stop(true).animate({
            width: 0
        }, {
            duration: time * 1000,
            easing: 'linear', step: function (now, fx) {
                if (now / fx.start < 0.66 && step == 0) {
                    $progressbar.addClass('alert');
                    step = 1;
                } else if ((now / fx.start) < 0.33 && step == 1) {
                    $progressbar.addClass('danger');
                    step = 2;
                } else if (now == 0) {

                    if (!hidePopup) {
                        if ($('#popup').find('.timeup').length < 1)
                            $this.popup({type: 'timeup', text: 'Play again'})
                        else {
                            $this.showPopup('timeup');
                        }
                    }

                    if ($game.soundCoords['lose']) {
                        $game.playSound('lose');
                    }
                    $('#game').trigger('timeup');
                    if (callback) {
                        callback();
                    }
                }
            }
        });
    },

    /* Detiene el timer (countdown) en el tiempo actual
     @pbar (string)  : selector del timer
     return void
     */

    stopTimer: function (pbar) {
        $(pbar).children('div').stop(true);
    },

    /**
     * Timer animates the width attribute of an jQuery object with the given duration.
     * If timer runs out, it fires an iwb.timeUp event on the #game-content element
     * timer.init()
     *  @in: {} - onElement: jQuery object,
     *          - duration: int (in seconds)
     *          - callback: function
     *  @out    - onElement or jquery object $('#progressbar')
     * start timer with timer.start();
     * stop timer with timer.stop();
     * toggle pause with timer.togglePause() - just uses start and stop methods
     * reset the timer with options from init or no options for the same settings
     *
     * start picks up, where timer stopped before. For a reset, use reset()
     *
     */
    timer: (function () {
        var obj, $timer, MAX, $animationObj, startAnimation, duration,
            initialized, stepFunc, timerWidth, callback, timeLeft, $triggerTimeup;
        initialized = false;
        MAX = 100;
        timerWidth = 0;
        state = 0;
        paused = false;
        var firstDuration;

        stepFunc = function (now, fx) {
            var value;
            if (fx.prop === 'width') {
                $timer.children('div').removeAttr('style').css('width', now + 'px');
            } else {
                value = Math.floor(now);
                timeLeft = firstDuration * (value / 100);
                if ((value < (0.333 * MAX)) && state === 1) {
                    $timer.addClass('danger');
                    state = 2;
                } else if ((value < 0.666 * MAX) && state === 0) {
                    $timer.addClass('alert');
                    state = 1;
                }
            }
        }
        startAnimation = function () {
            $animationObj.animate({val: 0, width: 0}, {duration: duration, easing: 'linear', step: stepFunc,
                complete: function () {
                    if ($triggerTimeup) {
                        $triggerTimeup.trigger('iwb.timeUp');
                    } else {
                        $('#game-content').trigger('iwb.timeUp');
                    }
                    if (callback) {
                        callback()
                    }
                }})
        }
        obj = {
            init: function (options) {
                var startOnInit = false;
                if (initialized) {
                    this.reset(options);
                    return $timer;
                }
                if (options) {
                    options.onElement = options.onElement || $('<div>').attr({id: 'progressbar'});
                    $timer = options.onElement
                    duration = (options.duration * 1000) || 0;
                    timeLeft = duration;
                    callback = options.callback;
                    firstDuration = duration;
                    startOnInit = options.startOnInit || false;
                    $triggerTimeup = options.triggerTimeupOn || false;
                }
                $timer.progressbar({max: MAX, value: MAX});
                timerWidth = $timer.width() - 4;
                $animationObj = $({val: MAX, width: timerWidth});
                initialized = true;
                if (startOnInit) {
                    this.start();
                }
                return $timer;
            },
            start: function () {
                if (!initialized) {
                    $game.log('Timer not initialized');
                    return;
                }
                if (duration !== 0) {
                    startAnimation();
                }
            },
            stop: function () {
                if (!initialized) {
                    $game.log('Timer not initialized');
                    return;
                }
                duration = timeLeft;
                $animationObj.stop(true);
            },
            togglePause: function () {
                if (!initialized) {
                    $game.log('Timer not initialized');
                    return;
                }
                if (paused) {
                    this.start();
                    paused = false;
                } else {
                    this.stop();
                    paused = true;
                }
            },
            reset: function (options) {
                var startOnInit = false;
//                when there are new options, use them
                if (options) {
                    duration = (options.duration * 1000) || duration;
                    callback = options.callback || callback;
                    firstDuration = duration;
                    startOnInit = options.startOnInit || false;
                }
                duration = firstDuration;
                $animationObj.prop('val', MAX);
                $animationObj.prop('width', timerWidth);
                $animationObj.stop();
                $timer.removeClass('alert danger')
                $animationObj.clearQueue('fx');
                state = 0;
                $timer.children('div').removeAttr('style').css('width', timerWidth + 'px');
                if (startOnInit) {
                    this.start();
                }
            }
        }
        return obj;
    }()),

    /* Desordena un array de elementos
     @array (array)  : array a desordenar
     return array
     */
    shuffle: function (array) {
        var curIndex = array.length, tmpValue, rndIndex;
        while (0 !== curIndex) {
            rndIndex = Math.floor(Math.random() * curIndex);
            curIndex -= 1;
            tmpValue = array[curIndex];
            array[curIndex] = array[rndIndex];
            array[rndIndex] = tmpValue;
        }
        return array;
    },

    /* Desordena un array de elementos y lo trunca
     Dependencia: shuffle
     @array (array)  : array a desordenar y truncar
     @number (int)   : cantidad de elementos a devolver
     return array
     */
    getRandom: function (array, number) {
        return this.shuffle(array).slice(0, number);
    },

    /* Precarga de(s) imagen(es) 
     @src (array|string) : nombre o arrays de nombres de imagen
     @callback (function): funcion de retorno
     return true
     */
    preload: function (src, callback) {
        $game.log(typeof src);
        if (typeof src != 'string') {
            //array de imgs
            var img = [];
            for (var n = 0; n < src.length; n++) {
                img[n] = new Image();
                img[n].src = src[n];
            }
            if (typeof callback == 'function') {
                img[src.length - 1].addEventListener('load', callback);
            }
        } else {
            //una sola img
            var img = new Image();
            img.src = src;
            if (typeof callback == 'function') {
                img.addEventListener('load', callback);
            }
        }
        return true;
    },

    mixArray: function (arr) {
        var na = [];
        while (arr.length) {
            var i = Math.floor(Math.random() * arr.length);
            var r = arr.splice(i, 1);
            na.push(r[0]);
        }
        return na;
    },

    getRandomInt: function (n, ceil) {
        var rnd = Math.random() * n;
        if (ceil === true) {
            return Math.ceil(rnd);
        } else {
            return Math.floor(rnd);
        }
    },

    imageScan: (function () {
        var foundResources = [];
        return function () {
            var data = this.data;
            var walkThrough = function (obj) {
                var data;
                for (data in obj) {
                    if (obj.hasOwnProperty(data)) {
                        if (typeof obj[data] === 'object') {
                            walkThrough(obj[data])
                        }
                        else if (typeof obj[data] === 'string') {
                            obj[data] = obj[data].trim();
                            if (obj[data].match(/\.(png|jpg|gif|jpeg)$/i)) {
                                if (foundResources.indexOf(obj[data]) === -1) {

                                    $game.addResource(obj[data]);
                                    foundResources.push(obj[data]);
                                }
                            }

                        }
                    }
                }
            }
            walkThrough(data);
        };
    }()),

    loadImage: function (src, callback) {
        var img = new Image();
        img.onload = function () {
            if (callback)callback(img);
        };
        img.src = src;
    },

    selectPlayers: function (nPlayers, callback, maxChars, names, fade, title) {
        fade = fade || 100;
        title = title || 'Write your name.';

        var playerName;
        var playClick = function () {
            var p = {};
            sp.find('input').each(function (n, i) {
                i = $(i);
                var num = i.data('player');
                p['player' + num] = i.val();
            });
            $game.players = p;
            if (fade) {
                sp.fadeOut(fade, function () {
                    sp.remove();
                })
            } else {
                sp.remove();
            }
            if (callback)callback(p);
        };
        names = names || [];

        var sp = $('<div>').attr('id', 'game-select-players');


        var p = $('<div>').addClass("players").appendTo(sp);
        for (var n = 1; n <= nPlayers; n++) {
            if (typeof names[n - 1] !== 'string') {
                names.push('Player' + n);
            }
            playerName = names[n - 1];
            var i = $('<input class="inputName" onclick="console.log($(this).val());$(this).select();" onkeyup="validar(this.id,'+maxChars+')" id="inputName'+ n +'">').attr({'data-placeholder': playerName, 'data-player': n, autocorrect: 'off'}).addClass('player-name selectable p' + n).appendTo(p);
            $("#inputName1").val("");
            $("#inputName2").val("");
            if (maxChars)i.attr('maxlength', maxChars);
        }
        sp.find('[data-placeholder]').focus(function () {
            var input = $(this);
            if (input.val() == input.attr('data-placeholder')) {
                input.val('');
                input.removeClass('placeholder');
            }
        }).blur(function () {
                var input = $(this);
                if (input.val() == '' || input.val() == input.attr('data-placeholder')) {
                    input.addClass('placeholder');
                    input.val(input.attr('data-placeholder'));
                }
            }).blur();
        var btn = this.getButton("Play", "button-big");
        p.append(btn);
        btn.on("click", playClick);
        var selectPlayer = $game.data.selectPlayer;
        if (selectPlayer) {
            if (selectPlayer.background) {
                sp.css({background: '#fff url("' + selectPlayer.background + '") top right no-repeat'});
            }
            if (selectPlayer.text) {
                title = selectPlayer.text;
            }
        }

        sp.prepend($('<h1></h1>').text(title));
        this.root.append(sp);

        if (fade) {
            sp.hide();
            sp.fadeIn(fade);
        }

    }
};
function validar(id, tope){
    if($("#"+id).val().length > tope){
        $("#"+id).blur();
        $("#"+id).focus();
    }
}
//functions called by flash player
function flashPlayerReady() {
    $game.log("flash player ready!");
    $game.useFlash = true;
    $game.audio.playerReady = true;
    $game.audio.audioDuration = ($game.audio.flashPlayer.getTotalTime()/1000);
    $game.audioloaded = true;
}
function flashPlayerOnEnd() {
    $game.log("flash sound ended!");
    $game.audio.playing = false;
    setTimeout(function(){
      if ($game.audio.soundQueue.length) {
          $game.audio.playSound($game.audio.soundQueue, $game.audio.callback);
      }else if($game.audio.callback){
        $game.audio.callback();
      }
    },10);
}

$(function () {
    //$game.autoload();

//    jQuery custom plugins
    // Scale the width and height by factor. When lineheight is true, set it to height for vertical alignment
    jQuery.fn.scaleWH = function (factor, lineHeight) {
        return this.each(function () {
            self = $(this);
            var width = parseInt(self.css('width')),
                height = parseInt(self.css('height'));
            width = Math.ceil(width * factor);
            height = Math.ceil(height * factor);
            self.css({width: width + 'px', height: height + 'px', lineHeight: lineHeight ? height + 'px' : 'auto'});
        })
    }

    jQuery.fn.insertAt = function (index, $parent) {
        return this.each(function () {
            if (index === 0) {
                $parent.prepend(this);
            } else {
                $parent.children().eq(index - 1).after(this);
            }
        });
    }
    jQuery.fn.pop = function (n) {
        var self = this;
        if (self.length > 0) {
            if (n && typeof n === 'number' && self.length > n && n >= 0) {
                n = Math.ceil(n);
                return (self.slice(n, 1));
            }
            return (self.splice(self.length - 1, 1))
        } else {
            return self;
        }
    }

    jQuery.fn.twinkle = function () {
        var el = this;
        if (el.length > 1) {
            el.each(function (i, e) {
                $(e).twinkle();
            })
        }

        var t = $('<div>').addClass("twinkle");

        el.prepend(t);
        var sizes = [
            {size: 12, left: '15%', top: '24%'},
            {size: 14, left: '53%', top: '9%'},
            {size: 25, left: '59%', top: '70%'},
            {size: 12, left: '76%', top: '38%'},
            {size: 10, left: '86%', top: '-2%'},
            {size: 12, left: '100%', top: '8%'}
        ];
        var stars = [];
        var starTimer;
        var starCount = 0;
        $(sizes).each(function (n, s) {
            var star = $('<img>').attr('src', '../_assets/img/star.png');
            t.append(star);
            var o = s.size * 0.5;
            var to = o + 'px ' + o + 'px';
            star.css({width: s.size, height: s.size, left: s.left, top: s.top, marginLeft: -o + 'px', marginTop: -o + 'px', opacity: 0});
            stars.push(star);
        });

        function showStar() {
            var star = stars[starCount];
	    if(window.location.host.indexOf("localhost") != -1 && (navigator.appVersion.indexOf("Linux") != -1 || navigator.appVersion.indexOf("X11") != -1) && navigator.appVersion.indexOf("Android") == -1){
	        star.animate({opacity: 1}, 150, 'linear').animate({opacity: 0}, 250, 'linear');
	    }
	    else{
            star.animate({transform: {rotate: -45}, opacity: 1}, 150, 'linear').animate({transform: {rotate: -90}, opacity: 0}, 250, 'linear');
            }
	    starCount++;
            if (starCount < stars.length) {
                setTimeout(showStar, 40);
            } else {
                setTimeout(function () {
                    t.remove();
                }, 400);
            }
        }

        setTimeout(showStar, 30);

        return $(this);
    };
});

var spritePlayer = function (sprite) {
    if (!sprite)return;
    this.sprite = sprite;
    this.callback = false;
    this.onload = false;
    this.audioFormat = false;
    this.audioFile = false;
    this.audioDuration = false;
    this.audioTimer = false;
    this.audioEnd = 0;
    this.position = 0;
    this.lastStart = 0;
    this.firstSound = false;
    this.audio = false;
    this.playerReady = false;
    this.playing = false;
    this.unlocked = false;
    this.webaudio = false;
    this.soundQueue = [];
    this.waitForUserInput = false;
    this.init();
}

spritePlayer.prototype = {

    init: function () {

        this.context = false;
        this.webaudio = true;
        if (typeof webkitAudioContext !== 'undefined') {
            this.context = new webkitAudioContext();
        } else {
            this.webaudio = false;
        }

        if (this.webaudio) {
            var source = this.context.createBufferSource();
            if (!source.start) {
                //we do not support older implementation of web audio api
                this.webaudio = false;
                this.context = false;
            }
            if (this.webaudio)$game.log("using webkit audio");
        }

        //set first sound
        var introSound;
        var first;
        for (var id in this.sprite) {
            var s = this.sprite[id];
            if (s.start === undefined || s.stop === undefined)continue;
            if (!first)first = id;
            if (id == "intro")introSound = s;
            if (s.first)this.firstSound = s;
            if (s.stop > this.audioEnd)this.audioEnd = s.stop;
        }

        if (!this.firstSound) {
            this.firstSound = (introSound) ? introSound : this.sprite[first];
        }
        var ua = navigator.userAgent.toLowerCase();
        this.ios = (ua.match(/(ipad|iphone|ipod)/g)) ? 1 : 0;
        this.android = (ua.indexOf("android") > -1) ? 1 : 0;
        if (this.ios || this.android)this.waitForUserInput = true;

    },

    setSprite: function (obj) {
        this.sprite = obj;
    },

    load: function (file, onready) {

        if (!this.sprite) {
            $game.log("please define a sprite");
            return;
        }

        var a = file.split(",");
        var self = this;

        $(a).each(function (n, f) {
            var ext = f.replace(/^.*\.([a-z0-9]{3,4})$/i, "$1");
            switch (ext) {
            case "mp3":
                //set mp3 as default audio
                self.audioFile = f;
                if (self.playsMp3()) {
                    //don´t check for other audio formats
                    self.audioFormat = "mp3";
                    return false;
                }
                break;
            case "ogg":
                if (self.playsOgg()) {
                    self.audioFormat = "ogg";
                    self.audioFile = f;
                    return false;
                }
                break;
            }
        });
        if (!this.audioFormat) {

            //if the game has both an mp3 and ogg file this will not occur
            if (!this.audioFile) {
                $game.log("cannot play audio");
                return false;
            } else {
                //only happens for mp3
                this.useFlash = true;
            }
        }
        if($game.data.type === "song"){$game.audio.webaudio = false;}
        this.onload = onready;

        //load sound        
        this.doload();
        if (this.android || this.ios) {

            $('body').one("touchend", function (event) {

                self.unlockAudio();
            });
        }
    },

    doload: function () {
        $game.log("loading sound file: " + this.audioFile);
        if (this.webaudio) {
            this.loadWebAudio(this.audioFile);
        } else {
            this.loadAudio(this.audioFile);

        }
    },

    unlockAudio: function () {
        $game.log("unlock");
        var self = this;
        if (this.webaudio) {
            var buffer = this.context.createBuffer(1, 1, 22050);
            var source = this.context.createBufferSource();
            source.buffer = buffer;
            source.connect(this.context.destination);
            if (source.start) {
                source.start(0);
            } else {
                source.noteOn(0);
            }
        } else {

            this.audio.play();
        }

    },

    loadWebAudio: function (url) {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';

        var t = this;
        // Decode asynchronously
        request.onload = function () {
            t.context.decodeAudioData(request.response, function onSuccess(buffer) {
                if (!buffer) {
                    $game.log('Error decoding file data.');
                    if (t.onload)t.onload();
                    return;
                } else {
                    $game.log("sound ready");
                    t.playerReady = true;
                    t.buffer = buffer;
                    t.audioDuration = buffer.duration;

                    if (t.onload)t.onload();

                }
            }, function onError(error) {
                $game.log('Error decoding file data.');
                if (t.onload)t.onload();
            });

        };
        request.onerror = function () {
            if (t.onload)t.onload();
        };
        request.send();
    },

    //loading audio for audio tag

    loadAudio: function () {
    	// 20141027 cambio de OC
        var location = window.location.host.indexOf("localhost");
        if (navigator.appVersion.indexOf("X11")!=-1 && location != -1) this.useFlash = true;
        if (navigator.appVersion.indexOf("Linux")!=-1 && location != -1) this.useFlash = true;
        if (navigator.appVersion.indexOf("Android")!=-1) this.useFlash = false;
        // 20141027 fin cambio
	if (this.useFlash) {

            $game.log("Fallback to flash");
            var d = $('<div>').attr('id', 'flashmp3');
            $('body').append(d);
            d.flashembed({
                src: "../_assets/flash-mp3-player/audio-mp3.swf",
                width: '1px',
                height: '1px'
            }, {file: this.audioFile});
            var obj = d.find('object').get(0);
            if(navigator.appVersion.indexOf("Android")!=-1 ) {
                var obj = d.html();
            }
            this.flashPlayer = obj;

        }else{

            var audio = new Audio();
            var t = this;
            this.audio = audio;
            audio.muted = true;
            audio.volume = 0;
            audio.preload = "auto";
            audio.src = this.audioFile;
            //metadata
            var meta = function () {
                //$game.log("meta");
                audio.removeEventListener('loadedmetadata', meta, false);
                t.audioDuration = Math.round(audio.duration * 100) / 100;
                t.audioTimer = setInterval(function () {
                    t.checkAudioProgress();
                }, 100);
            }
            audio.addEventListener("loadedmetadata", meta, false);
            //duration change
            var duration = function () {
                $game.log("duration: " + audio.duration);
                t.audioDuration = Math.round(audio.duration * 100) / 100;
    
            }
            audio.addEventListener("durationchange", duration, false);
            //error
            audio.addEventListener("error", function (event) {
                t.audio = false;
                t.onLoadError();
            }, false);
    
            var force = function (event) {
                t.audio.pause();
                $game.log("userinput");
                t.audio.removeEventListener("play", force, false);
                $game.log("test");
                t.waitForUserInput = false;
            };
            if (this.ios || this.android) {
                audio.addEventListener("play", force, false);
            } else {
                audio.load();
            }

        }

    },

    onLoadError: function () {
        $game.log("audio load error");
        if (this.onload)this.onload();
    },

    checkAudioProgress: function () {
        // console.log("llego");
        // if (!this.audioDuration || this.audioDuration < this.audioEnd || this.waitForUserInput)return;
        // console.log("entro");
        var t = this;
        var max = 0;
        var ready = 1;
        var buffer = this.audio.buffered;
        //check for buffer  

        if (buffer.length) {
            for (var i = 0; i < buffer.length; i++) {
                var end = buffer.end(i);
                if (end > max)max = end;
            }

            max = Math.round(max * 100) / 100;
            //using audioEnd in stead of audioDuration
            if (max >= this.audioEnd)ready = 1;
        } else {
            //android does not support buffer
            if (this.audio.readyState == 4)ready = 2;
        }
        if(navigator.appVersion.indexOf("Android") != -1)
            {
                ready = 1;    
            }
        console.log(ready);
        if (ready) {
            $game.log("audio loaded");
            clearInterval(this.audioTimer);
            this.audio.muted = false;
            this.audio.volume = 1;
            this.audio.pause();
            this.audio.currentTime = 0;
            this.initAudio();
            //set intro position
            this.audio.currentTime = t.firstSound.start;
            // FF 30/31 hack. date 21-08-2014
            var ffv3x = false;
            if ( navigator.userAgent.match('Firefox/31') ||
                 navigator.userAgent.match('Firefox/30')) {
                ffv3x = true;
            }
            this.audioTimer = setInterval(function () {
                t.canPlayIntro(ffv3x);
            }, 50);
            t.canPlayIntro(ffv3x);
        }
    },

    canPlayIntro: function (ffv3x) {
        if (this.audio.readyState == 4 || ffv3x) {
            this.playerReady = true;
            $game.log("audio ready");
            clearInterval(this.audioTimer);
            if (this.onload)this.onload();
        }
    },

    initAudio: function () {
        var t = this;
        this.audio.addEventListener("timeupdate", function () {
            t.onTimeUpdate();
        }, false);
    },

    //controls

    playSound: function (id, callback) {
        $game.log(id);

        if (!this.webaudio && !this.audio && !$game.useFlash) {
            if (id == "intro") {
                var snd = $game.getSound("intro");
                var time = (snd.stop - snd.start) * 1000;
                setTimeout(function () {
                    if (callback)callback();
                }, time);
            } else {
                $game.log("not playing " + id);
                if (callback)callback();
            }
            return;
        }
        if (typeof id === 'number') {
            id = id + '';
        }
        
        if (!this.playerReady)return;
        if (typeof id === 'string') {
            this.soundQueue = id.split(",");
        } else if (typeof id === 'object' && id.length !== undefined) {
            this.soundQueue = id;
        } else {
            $game.log('playSound: id has to be comma separated string or array of sounds, "yes,win,reward" , ["yes","win","reward"]')
        }
        id = this.soundQueue.shift();
        this.callback = callback;

        if (!this.sprite[id]) {
            $game.log("sound " + id + " not defined");
            $game.enable();
            if (callback) {
                callback();
            }
            return;
        }
        $game.log("playing sound " + id);
        var sound = this.sprite[id];
        this.currentSound = sound;
        var t = this;
        if (this.webaudio) {
            if (this.source) {
                $game.log("other sound playing");

                this.source.stop(0);
                this.source.disconnect();
                this.source = false;
            }
            this.source = this.context.createBufferSource();
            this.source.buffer = this.buffer;
            this.source.connect(this.context.destination);

            if (this.source.start) {
                this.source.start(0, sound.start, sound.stop - sound.start);
            } else {
                //implementation of older web audio api... not used
                this.source.noteGrainOn(0, sound.start, sound.stop - sound.start);

            }
            this.source.onended = function (event) {
                t.source = false;
                t.onEnd();
            }
            this.lastStart = this.context.currentTime;
            this.playing = true;
        } else if ($game.useFlash) {
            $game.audio.flashPlayer.playSound(sound.start, sound.stop);
//            var time = (sound.stop - sound.start) * 1000;
//                setTimeout(function () {
//                    if (callback)callback();
//                }, time);
        } else {
            this.audio.currentTime = sound.start;
            console.log(this.audio.currentTime);
            //strange fix for ie not setting audio time
            while (typeof(this.audio.currentTime) !== 'number') {
                try {
                    this.audio.currentTime = this.currentSprite.start;
                } catch (err) {
//                        console.log(err);
                }
            }

            setTimeout(function () {
                console.log("entro");
                t.playing = true;
                t.audio.play();
            }, 0)
        }
    },

    onTimeUpdate: function () {
        var current = this.audio.currentTime;
        this.position = current;
        var sound = this.currentSound;
        if (sound && this.currentTime >= sound.stop) {
            this.audio.pause();
            this.onEnd();
        }
    },

    onEnd: function () {
        if (!this.currentSound)return;
        this.currentSound = false;
        $game.log("sound ended");
        this.playing = false;
        if (this.soundQueue.length) {
            this.playSound(this.soundQueue, this.callback);
        } else if (this.callback) {
            //let's set position to beginning of sound file
//            debugger
            if ($game.ie !== 1) {
                this.currentTime = 0;
            }
            this.callback();
        }
    },

    stopSound: function () {
        if (!this.playerReady)return;
        if (this.webaudio) {
            if (this.source) {
                this.position = this.context.currentTime - this.lastStart;
                this.source.stop(0);
                this.source.disconnect();
                this.source = false;
            }
        } else if ($game.useFlash) {
            try {
              $game.log("flash sound ended");
              this.position = $game.audio.flashPlayer.stopSound()/1000;              
            }
            catch(err) {
                this.position = 0;
            }
        } else {
            this.audio.pause();
            this.position = this.audio.currentTime;
        }
        this.playing = false;
    },

    playsMp3: function () {
        var a = document.createElement('audio');
        return !!(a.canPlayType && a.canPlayType('audio/mpeg;').replace(/no/, ''));
    },

    playsOgg: function () {
        var a = document.createElement('audio');
        return !!(a.canPlayType && a.canPlayType('audio/ogg;').replace(/no/, ''));
    },

    //functions to make player backwards compatible with audio tag

    pause: function () {

        this.stopSound();
    },

    play: function () {
        var t = this;
        this.currentSound = false;
        if (this.webaudio) {
            if (this.source) {
                $game.log("other sound playing");
                this.source.stop(0);
                this.source.disconnect();
                this.source = false;
            }
            this.source = this.context.createBufferSource();
            this.source.buffer = this.buffer;
            this.source.connect(this.context.destination);
            this.source.start(0, this.position);
            this.source.onended = function (event) {
                t.source = false;
                t.playing = false;
            }
            this.playing = true;
            this.lastStart = this.context.currentTime;
        }  else if ($game.audio.useFlash) {
            $game.audio.flashPlayer.playSound( $game.audio.position, $game.audio.duration);
            this.playing = true;
        } else {
            this.audio.play();
            this.playing = true;
        }
    },

    get duration() {
        return this.audioDuration;
    },

    get currentTime() {
        if (this.webaudio) {
            if (this.playing) {
                var time = this.position + this.context.currentTime - this.lastStart;

                return time;
            } else {
                return this.position;
            }
        } else if ($game.audio.useFlash) {
            try {
                if (this.playing) {
                  var curT = $game.audio.flashPlayer.getCurrentTime()/1000
                  return curT;
                }else{
                  return 0;
                }
            }
            catch(err) {
                return 0.01;
            }
        } else {
            return this.audio.currentTime;
        }

    },

    set currentTime(val) {
        if (!this.playerReady)return;
        val = parseFloat(val);
        this.position = val;
        if (this.webaudio) {
            if (this.playing)this.play();
        } else {
            this.audio.currentTime = val;
        }
    }

}
