

(function ($) {
    'use strict';
    
    (function (){
        var b = document.documentElement; 
//        b.setAttribute('data-useragent', navigator.userAgent); 
//        b.setAttribute('data-platform', navigator.platform); 
        b.className += ((!!('ontouchstart' in window) || !!('onmsgesturechange' in window))?' touch':''); 
    })();
    
    $(function () {
            var $d, $g, $o, $txt, $sb, $i, $img, $t, $audio, $text, $num, $activeSound, canPlayAudio, _withText;
            canPlayAudio = false;

            $game.load({
                onload: function () {
                    var loadfunc = function () {
                        $d = $game.data;
                        $g = $('#game-content').first();

                        var gh = $('#buttons').position().top - 30 - $g.position().top;
                        $g.css({height: gh + "px"});
                        $('#reset').click(initGame);
                        initGame();
                        audioLoaded();
                    };
                    $game.imageScan();
                    $game.preloadResources({onComplete: loadfunc()})
                },
                onaudio: audioLoaded
            });

            function audioLoaded() {
                canPlayAudio = true;
            }

            function preCheck() {
                if ($('.sound-button').hasClass('active')) {
                    return true;
                }
                return false;
            }

            function initGame() {
                _withText = $d.noText !== 'true';

                $g.html('');
                $g.removeClass("portrait");
                $audio = 1;
                $num = 0;
                $text = 1;
                $activeSound = null;
                if (!$d.size)$d.size = 100;
                $o = ($d.orientation) ? $d.orientation : "landscape";

                $g.addClass($o);
//                if ($o === "portrait")$g.addClass($o);

//                if (!$d.noWord) {
//                    addToggleButton("words", toggleText, 'Hide words');
//                }
                addToggleButton("audio", toggleAudio);

                $i = $('<div>').attr('id', 'image');
                $g.append($i);

                addSoundButton();

                if (_withText) {
                    $txt = $('<span>').attr('id', 'text');
                    $i.append($txt);
                }

                $('#image').wrap('<div id="wrapper">')
                $i.click(function () {

                    if ($audio && !preCheck()) {
                        $game.playSound($activeSound);
                    }
                });

                $t = $('<div>').attr('id', 'thumbnails');

                $g.append($t);

                if ($d.text && $d.text === 'true') {
                    $('#game-content').addClass('plain-text');

                    var word, sound, source;
                    $($d.letters).each(function (index, letter) {
                            var t = $('<div>').addClass("thumb");
                            var d = $('<div>')//.css({width: $d.size + "px", height: $d.size + "px"});
                            t.append(d);
                            $t.append(t);
//                            var $span = $('<span></span>').css('vertical-align', 'middle');
                            var $span = $('<span></span>');
                            if (typeof letter === 'object') {
                                t.data('source', letter.source);
                                t.data('word', letter.word);
                                t.data('sound', letter.sound);
                                $span.text(letter.source);

                            } else {
                                t.data('source', letter);
                                t.data('word', letter);
                                t.data('sound', letter);
                                $span.text(letter);

                            }
                            d.append($span);
                            if ($d.thumbFontSize) {
                                $span.css('fontSize', $d.thumbFontSize);
                            }

                            var sound = letter;
                            t.click(function (event) {
                                var i = $(this).index();
                                if (!preCheck()) {
                                    if ($audio && $(this).hasClass('active')) {
                                        $game.playSound($activeSound);
                                    } else {
                                        changeImage(false, i);

                                    }
                                }
                            });

                        }
                    )
                }
                else {
                    if ($d.noText !== 'true') {
                        addToggleButton("words", toggleText, 'Hide words');
                    }
                    $($d.images).each(function (n, i) {
                        var t = $('<div>').addClass("thumb");
                        var d = $('<div>')//.css({width: $d.size + "px", height: $d.size + "px"});
                        t.append(d);
                        $t.append(t);
                        var ti = $('<img>').load(initThumb);
                        d.append(ti);
                        ti.attr('src', i.thumb);
                        t.data('source', i.source);
                        t.data('word', i.word);
                        t.data('sound', i.sound);
                        var sound = t.sound;
                        t.data('w', i.w);
                        t.data('h', i.h);
                        t.click(function (event) {
                            var i = $(this).index();
                            if (!preCheck()) {
                                if ($audio && $(this).hasClass('active')) {
                                    $game.playSound($activeSound);
                                } else {
                                    changeImage(false, i);

                                }
                            }
                        });
                    });
                }
                var loopSlider = false;
                if ($d.hasOwnProperty('loop')) {
                    if ($d.loop === 'true' || $d.loop === 'yes' || $d.loop === 1) {
                        loopSlider = true;
                    }
                }

                $('#thumbnails').iwbslider({
                    items: $('.thumb'),
                    duration: 200,
                    btn_left: $('<div class="arrow left">').append($('<span>')),
                    btn_right: $('<div class="arrow right">').append($('<span>')),
                    min_items_for_slider: $('#game-content').hasClass('portrait') ? 9 : 7,
                    show_x_items: $('#game-content').hasClass('portrait') ? 8 : 6,
                    loop: loopSlider
                });

//                set the first image
                changeImage(undefined, 0, true);
            }

            function addSoundButton() {
                $sb = $('.sound-button').length === 0 ? $game.soundButton() : $('.sound-button');
                var sb, idSound;
                $sb.click(function (event) {
                    if (canPlayAudio) {
                        sb = $(this)
                        sb.addClass('active');
                        $game.playSound($activeSound, function () {
                            console.log("entro");
                            sb.removeClass('active')
                        });
                        for (var i = 0; i < $game.data.sound.length; i++) {
                            if($game.data.sound[i].id === $activeSound){
                                idSound = ($game.data.sound[i].stop - $game.data.sound[i].start) * 1000;
                            }
                        };
                        setTimeout(function() {
                            console.log(idSound);
                            sb.removeClass('active');
                        }, idSound);
                        $game.enable();
                    }
                });
                if ($('.sound-button').length === 0)
                    $('h1').prepend($('<div>')
                        .css({width: '48px', height: '48px', display: 'inline-block'}).append($sb));
            }

            function addToggleButton(id, callback, text) {
                var btn = $('#' + id);
                if (btn.length === 0) {
                    btn = $game.getButton(text)
                    btn.attr({id: id});
                    $('#buttons').find('.content').prepend(btn);
                }
                btn.click(callback);
            }

            function toggleAudio(event) {
                var t = $('#audio').find('span');
                if ($audio) {
                    t.text('Audio on')
                    $audio = 0;
                    $sb.hide();
                } else {
                    t.text('Audio off')
                    $audio = 1;
                    $sb.show();
                }
            }

            function toggleText(event) {
                var t = $('#words').find('span');

                if ($text) {
                    t.text('Show words');
                    $('#text').hide();
                    $text = 0;
                } else {
                    t.text('Hide words');
                    $('#text').show();
                    $text = 1;
                }
            }

            function changeImage(event, num, noSound) {
                if (!event) {
                    $num = num;
                } else {
                    var t = $(this);
                    var n = $num;
                    if (t.hasClass("btn-left")) {
                        n--;
                    } else {
                        n++;
                    }
                    if (n > $d.images.length - 1)n = 0;
                    if (n < 0)n = $d.images.length - 1;
                    $num = n;
                }
                var t = $t.find('div.thumb').get($num);
                t = $(t);
                var s = t.data('source');
                var width = t.data('w');
                var height = t.data('h');

                $t.find('.active').removeClass("active");
                t.addClass("active");
                if (_withText) {
                    var w = t.data('word');
                    $txt.html(w);
                }
                $activeSound = t.data('sound');
                if ($audio && !noSound) {
                    $game.playSound($activeSound);
                }

                if ($.text && $d.text === 'true') {
                    loadText(s)
                } else {
                    loadImage(s, width, height);
                }
            }

            function loadText(s) {
                var $wrapper = $('<div></div>').addClass('wrapper text');
                var span = $('<span></span>').addClass('text');
                span.text(s);
//            span.css({'height': '100%', fontSize: '300px'});
                if ($('#wrapper').find('#image').find('span').length === 0) {
                    $('#wrapper').find('#image').append($wrapper.append(span));
                } else {
                    $('#wrapper').find('#image').find('span').replaceWith(span);
                }
                if ($d.fontSize) {
                    span.css('font-size', $d.fontSize);
                }
            }

            function loadImage(s, width, height) {
                var $wrapper = $('<div>').addClass('wrapper');
                $img = $('<img>');
                if (!_withText) {
                    var margin = 10;

                    var height = parseInt($('#image').css('height'),10) - margin;
                    $wrapper.css({height: height + 'px', lineHeight: height + 'px'});
                    
                }
                $wrapper.append($img);
                if ($i.find('.wrapper').length > 0) {
                    $i.find('.wrapper').replaceWith($wrapper);
                } else {
                    $i.prepend($wrapper);
                }

                $img.attr({src: s, width: width, height: height});
            }

            function initThumb(event) {
                var i = $(this);
                var h = i.height();
                var w = i.width();
            }

            /**
             *
             * @param options
             *
             */

            $.fn.iwbslider = (function () {
                var $slider, $slider_viewport, $btn_left, $btn_right, $wrapper, $panel, $items,
                    cl_btn_left, cl_btn_right, panel_width, max_viewport_width, variant, infiniteLoop,
                    $ex_item, item_width;
                panel_width = 0;
                max_viewport_width = 0;
                variant = 20;
                infiniteLoop = true;

                return function (options) {
                    options.min_items_for_slider = options.min_items_for_slider || 7;
                    options.offset = options.offset || 0;
//        slide_width = (item_width * slide_unit) + offset
                    options.slide_unit = options.slide_unit || 1;
                    options.duration = options.duration || 200;
                    options.show_x_items = options.show_x_items || 6;
                    infiniteLoop = options.loop || false;

                    $items = options.items;
                    if (!$items)return;

                    if ($items.length < options.min_items_for_slider)return;

                    cl_btn_left = options.btn_left;
                    cl_btn_right = options.btn_right;

//        html elements
                    $slider = $('<div id="slider"></div>');
                    $slider_viewport = $('<div id="slider-viewport"></div>');
                    $btn_left = cl_btn_left || $('<div class="slider-btn left"></div>');
                    $btn_right = cl_btn_right || $('<div class="slider-btn right"></div>');
                    $wrapper = $('<div id="slider-wrapper"></div>');
                    $panel = $('<div id="slider-panel"></div>');

                    $slider.append($wrapper);
                    $wrapper.append($btn_left);
                    $wrapper.append($slider_viewport);
                    $slider_viewport.append($panel);
                    $panel.append($items);
                    $wrapper.append($btn_right);

                    $(this).html('');
                    $(this).append($slider);

                    $ex_item = $items.get(1);
                    item_width = $($ex_item).outerWidth(true);

//        Panel holds all items
                    $items.each(function () {
                        panel_width += $(this).outerWidth(true);
                    });

                    $items.filter(':gt(0):lt(' + options.show_x_items + ')').each(function (n) {
                        max_viewport_width += $(this).outerWidth(true);
                    })

                    $slider_viewport.css({width: max_viewport_width + 'px'});

                    $panel.css({width: panel_width});

                    options.item_width = item_width;

//        initial State slide-end for left-arrow
                    if (!infiniteLoop) {
                        $btn_left.addClass('slide-end');
                    }

//        #TODO - adding the callbacks
                    $btn_left.click(function () {
                        if ($slider.hasClass('sliding'))return;
                        slide($(this), 'right', options);
                    })

                    $btn_right.click(function () {
                        if ($slider.hasClass('sliding'))return
                        slide($(this), 'left', options);
                    })

                    var slide = (function () {
                        var scroll_px = function (left_right, slide_width, self) {
                            var actual, next, max;

                            if (left_right === 'right') {

                                actual = parseInt($panel.css('left'));
                                next = actual + slide_width;
                                max = 0;
                                if (actual >= max) {
                                    return 0;
                                }

                                if (next === max) {
                                    if (!infiniteLoop) {
                                        self.addClass('slide-end');
                                        $('.arrow').not(self).removeClass('slide-end');
                                    }
                                    return slide_width;
                                }
                                else if (next > (max - variant)) {
                                    self.addClass('slide-end');
                                    $('.arrow').not(self).removeClass('slide-end');
                                    return(-actual);
                                }
                                else if (next < max) {
                                    $('.arrow').not(self).removeClass('slide-end');
                                    return (slide_width);
                                }
                            } else if (left_right === 'left') {
                                actual = parseInt($panel.css('left')) * -1;
                                next = actual + slide_width;
                                max = ($items.length - options.show_x_items) * slide_width;

                                if (actual >= max) return 0;
                                if (next === max) {
                                    if (!infiniteLoop) {
                                        self.addClass('slide-end');
                                        $('.arrow').not(self).removeClass('slide-end');
                                    }
                                    return -(slide_width);
                                }
                                else if (next > (max - variant)) {
                                    if (!infiniteLoop) {
                                        self.addClass('slide-end');
                                    }
                                    $('.arrow').not(self).removeClass('slide-end');
                                    return -(max - actual);
                                }
                                else if (next < max) {
                                    $('.arrow').not(self).removeClass('slide-end');
                                    return -(slide_width);
                                }
                            }
                        };

                        //slide
                        return function (self, direction, options) {
                            var slide_width, $panel, $thumb;
                            $panel = $('#slider-panel');

                            if (self.hasClass('slide-end')) {
                                return;
                            }
                            slide_width = (options.slide_unit * options.item_width) + options.offset;

                            $slider.addClass('sliding');

                            self.addClass('active');

                            if (infiniteLoop) {
                                if (direction === 'right') {
                                    $thumb = $panel.find('.thumb').last();
                                    $panel.css('left', -slide_width + 'px');
                                    $panel.prepend($thumb);
                                }
                            }

                            $panel.animate({ left: '+=' + scroll_px(direction, slide_width, self) }, {queue: false, duration: options.duration, complete: function () {
                                $slider.removeClass('sliding');
                                self.removeClass('active');
                                var $panel;
                                if (infiniteLoop) {
                                    $panel = $('#slider-panel');
                                    if (direction === 'left') {
                                        $thumb = $panel.find('.thumb').first();
                                        $panel.append($thumb).css('left', '0px');
                                    }
                                }
                            }});
                        };
                    }());
                }
            }());
        }
    )
}(jQuery));
