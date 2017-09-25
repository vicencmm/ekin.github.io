(function ($) {
    $(function () {

        var $g, $d, $c, $f, $soundButton, $colnum, $cols, $listen, $jump, $land, $finish, move, chars, timer, clicked, markTimer, ischarMoving = false;
        var _autoSolve = false;
        $game.load({
            onload: function () {
                var loadfunc = function () {
                    $d = $game.data;
                    $g = $('#game-content').first();
                    var gh = $('#buttons').position().top - 20 - $g.position().top;
                    $g.css({height: gh + "px"});
                    steps = ["listen", "jump", "land", "win"];
                    initGame();
                    $('#reset,#replay').click(function () {
                        if (ischarMoving || $g.hasClass('intro-running')) {
                            return;
                        }
                        init();
                    });
                    $('#solve').click(solveNext);

                    introAnimation();
                };
                $game.imageScan();
                $game.preloadPopup(['finish', 'timeup']);
                $game.preloadResources({onComplete: loadfunc});
            }
        })
        function init() {
            $('#game-content').removeClass();
            _autoSolve = false;
            initGame();
            $game.flash($soundButton);
        }

        function initGame() {
            var dataCols = $d.col.slice(0);
            //character
            $game.clear();
            ischarMoving = false;
            if (markTimer)clearTimeout(markTimer);
            $colnum = 0;
            $cols = [];
            move = 0;
            var size = 104;
            //draw all the columns and rows
            dataCols = unorder(dataCols);
            dataCols = dataCols.slice(0, 5);

            var numcols = dataCols.length;
            var cw = $g.outerWidth() * 0.6;
            size = (cw / numcols);
            if (size > 104)size = 104;
//        var sh = (size / 104) * 90;
            var d = $('<div>').addClass("cols");
            $g.append(d);
            if (!$soundButton) {
                $soundButton = $game.soundButton();
                $soundButton.click(playSound);
                $('#game').find('h1').prepend($soundButton);
            } else {
                $soundButton.css('opacity', 1)
            }

            $(dataCols).each(function (n, col) {
                if (!col.letters && !col.image)return false;

                var l, s;
                if (col.letters) {
                    l = scramble(col.letters.content);
                    s = col.letters.solution;
                } else {
                    col.image = unorder(col.image);
                    l = col.image
                }
                var sh = $g.innerHeight() / ( l.length * 1.1);

                var ul = $('<ul>').addClass('col').css('width', size + "px");
                ul.data('sound', col.sound);
                d.append(ul);
                ul.data('num', n);
                var fontSize = 0;
                if ($d.fontSize) {
                    fontSize = $d.fontSize;
                }
                for (var i = 0; i < l.length; i++) {
                    var li = $('<li>').css({width: size + "px", height: sh + "px", backgroundColor: 'transparent'});
                    ul.append(li);
                    var j = $('<span>');
                    if (col.letters) {
                        var h = l[i];
                        j.html(h);
                        j.addClass("letter");
                        if (h == s)li.addClass("solution");
                    } else {
                        var img = l[i];

                        s = false;
                        if (typeof img == "object") {

                            s = img.solution;
                            img = img.content;
                        }
                        j.append('<img src="' + img + '"/>');
                        j.addClass("image");
                        if (s)li.addClass("solution");

                    }
                    li.append(j);
                    if (fontSize) {
                        j.css('fontSize', fontSize);
                    }

//                get random stone
                    stone = generateStone();
//                rotate random stone and set size of li element
                    var deg = 10 - Math.floor(Math.random() * 20);
                    stone.css({
                        width: size.toFixed(),
                        height: sh.toFixed(),
                        transform: 'rotate(' + deg + 'deg)'
                    })
                    stone.children('svg').css({
                        width: size.toFixed(),
                        height: sh.toFixed()
                    })
                    j.css({
                        transform: 'rotate(' + deg + 'deg)',
                        position: 'absolute',
                        top: '17px',
                    })

                    // ie problem. issue 1371
                    var
                        letterWidth = j.width(),
                        letterLeft  = (size-letterWidth)/2;
                    j.css('left', letterLeft);

                    li.prepend(stone);
                    li.html(li.html());

                    li.click(stoneClick);
                }
                $cols.push(ul);
            });
            var l = ($g.outerWidth() - d.outerWidth()) * 0.5;
            var t = ($g.outerHeight() - d.outerHeight()) * 0.5;
            d.css({left: l + "px", top: t + "px"});

            //Add characters

            $listen = loadCharacter($d.character.listen, "listen");
            $jump = loadCharacter($d.character.jump, "jump");
            $land = loadCharacter($d.character.land, "land");
            $finish = loadCharacter($d.character.finish, "finish");
            chars = [$listen, $jump, $land, $finish];

            //add finish
            if ($d.finish) {
                $f = $('<img>');
                $f.load(function (event) {
                    alignImage($f, true, true);
                    l = $g.outerWidth() - l * 0.5;

                    $f.css({left: l + "px"}).show();
                });
                $f.hide();
                $f.attr('src', $d.finish.image);
                $f.addClass("finish").data('sound', $d.finish.sound);
                $g.append($f);
            }
        }

        function setCharacterPosition() {
            //adapt position of $listen
            $listen.hide();
            var th = $listen.outerHeight();
            var d = $g.find('div.cols');
            var t = 0.5 * (d.outerHeight() - th) + d.position().top;
            var mt = parseInt($listen.css('marginTop'));
            var l = d.position().left * 0.5;
            $listen.css({top: t - mt + "px", left: l + "px"}).show();
        }

        function alignImage(img, h, v) {
            if (h) {
                var ml = img.outerWidth() * -0.5;
                img.css({marginLeft: ml + "px"});
            }
            if (v) {
                var mt = img.outerHeight() * -0.5;
                img.css({marginTop: mt + "px"});
            }
        }

        function loadCharacter(src, c) {
            var pos = 0;
            if (typeof src == "object") {
                if (src.pos)pos = parseInt(src.pos);
                src = src.content;
            }
            var img = $('<img>');
            img.load(function (event) {

                var ml = $(this).outerWidth() * -0.5 + pos;
                var mt = -$(this).outerHeight() + 15;
                var l = $(this).outerWidth() * 0.5;
                var i = $(this);
                var t = ($g.outerHeight() - i.outerHeight()) * 0.5 - mt;
                $(this).css({left: l + "px", marginLeft: ml + "px", marginTop: mt + "px", top: t + "px"});
                if (i.hasClass("listen"))setCharacterPosition();
            });
            img.attr('src', src).addClass(c).addClass("character");
            $g.append(img);
            img.hide();
            return img;
        }

        function playSound(event) {
            var $gc = $('#game-content');
            var soundButton = $(this);
            var c = $cols[$colnum];
            var s = c.data('sound');

            if ($gc.hasClass('intro-running') || $gc.hasClass('timeup')) {
                return;
            }
            soundButton.addClass('active');
            $game.playSound(s, function () {
                soundButton.removeClass('active');
            });
            $game.unhighlight();
            if (!c.hasClass('mark')) {
                highlightColumn();
                $('body').on('flashStop', function () {
                    if (markTimer) {
                        clearTimeout(markTimer);
                    }
                })
            }
        }

        function highlightColumn() {
            var c = $cols[$colnum];
            c.addClass("mark");
            var wrapper = c.find('li').not('.clicked');
//            var stones = wrapper.find('svg, i');
            duration = $game.highlightSpeed / 2;
	    if(window.location.host.indexOf("localhost") != -1 && (navigator.appVersion.indexOf("Linux") != -1 || navigator.appVersion.indexOf("X11") != -1)){
	    	wrapper.animate(duration).animate(duration)
	    }
	    else{
            	wrapper.animate({scale: 1.1}, duration).animate({scale: 1.0}, duration)
            }
	    markTimer = setTimeout(highlightColumn, duration * 2);
        }

        function stoneClick() {
            var li = $(this);
            if ($('.sound-button').hasClass('active') || $('#game-content').hasClass('timeup') || ischarMoving ||
                li.hasClass('clicked')) {
                return;
            }

            var ul = li.closest('ul');

            if (!ul.hasClass("mark")) {
                return;
            }

            if (!li.hasClass('solution')) {
                $game.playSound('no');
                li.addClass("clicked");
                if (timer) {
                    clearInterval(timer);
                }
                return;
            }
            clicked = li;
//            li.addClass('solved');

            moveCharacter(li);
        }

        function moveCharacter(target) {
            ischarMoving = true;
            var pos = $game.getAbsPos(target, $g);
            var left = pos.left + target.outerWidth() * 0.5;
            var top = pos.top + target.outerHeight() * 0.5;
            if (target.hasClass("finish")) {
                top = pos.top + target.outerHeight();
                left = pos.left;
            }
            var cpos = $listen.position();
            //set character positions
            $land.css({left: left + "px", top: top + "px"});
            var y = top - cpos.top;
            var x = left - cpos.left;
            var jx = cpos.left + 0.5 * x;
            var jy = 0.8 * (cpos.top + y * 0.5);
            $jump.css({left: jx + "px", top: jy + "px"});
            move = 0;
            timer = setInterval(function () {
                animateCharacter(target)
            }, 300);
        }

        function animateCharacter(target) {
            var jump = (function () {
                var up, down, cnt = 0, timer;
                var downStyle;
                var top;
                var jumpUp = function () {
                    cnt += 1;
                    show.fadeOut(400, function () {
                        down.attr('style', downStyle);
                        down.css('top', top);
                    });
                    show = show === up ? down : up;
                    show.fadeIn(400);
                    if (cnt >= 6) {
                        clearInterval(timer);
                        timer = 0;
                    }
                };
                return function () {
                    cnt = 0;
                    show = down = chars[2];
                    up = chars[3];

                    top = down.css('top');
                    downStyle = up.attr('style').replace("none","block");
                    timer = setInterval(jumpUp, 400);
                };
            }());
            var finish = false;
            var hide = chars[move];
            var lastAutoSolved = false;
            if (move >= 2) {
                clearInterval(timer);
                if ($colnum >= $cols.length) {
                    //finish
                    var pos = $game.getAbsPos($f, $g);
                    var left = pos.left + $f.outerWidth() * 0.4;
                    var top = pos.top + $f.outerHeight();
                    $listen.css({left: left + "px", top: top + "px"});
                    move = 3;
                    ischarMoving = false;
                    finish = true;

                    $game.playSound('win');

                    /*
                    // issue 22773 ask to remove popup
                    $game.popup({
                        type: "finish",
                        delay: 2800,
                        click: init,
                        noSound: false
                    });*/

                } else if (clicked && clicked.hasClass("solution")) {
                    var sound = _autoSolve ? $cols[$colnum].data('sound') : 'yes';
                    var pos = $game.getAbsPos(clicked, $g);
                    var left = pos.left + clicked.outerWidth() * 0.5;
                    var top = pos.top + clicked.outerHeight() * 0.5;
                    $listen.css({left: left + "px", top: top + "px"});
                    var col = clicked.closest('ul');
                    col.removeClass("mark").addClass("solved");
                    if (markTimer)clearTimeout(markTimer);
                    $colnum++;
                    if ($colnum >= $cols.length) {
                        $soundButton.css({opacity: 0.5});
                        setTimeout(function () {
                            moveCharacter($f);
                        }, 800);
                    } else {
                        console.log(sound);
                        $game.playSound(sound, function(){
                            $game.flash($soundButton);
                        });
                        ischarMoving = false;
                        _autoSolve = false;
                    }
                    $(target).siblings().addClass('solved');
//                    $(target).addClass('solved');
                } else if (clicked) {
                    clicked.addClass("clicked");
                    $game.playSound("no");
                }
                clicked = null;
                if (move != 3) {
                    move = 0;
                }
            } else {
                move++;
            }
            if (finish === true) {
                jump();
                $game.enable();
            } else {
                var show = chars[move];
                hide.fadeOut(600);
                show.fadeIn(600);
            }
        }

        function unorder(arr) {
            var na = [];
            while (arr.length) {
                var i = Math.floor(Math.random() * arr.length);
                var r = arr.splice(i, 1);
                na.push(r[0]);
            }
            return na;
        }

        function scramble(str) {
            var r = [];
            var i = 0;
            if (str.indexOf('.') != -1) {
                r = str.split('.')
            }
            return unorder(r);
        }

        function solveGame() {
            var $gc = $('#game-content');
            if ($gc.hasClass('intro-running')) {
                return;
            }

            var ul = li.closest('ul').find('li[data-solution]').click();
            $g.find('div.cols ul').addClass("solved");
            $game.unhighlight();
            $soundButton.css({opacity: 0.5});
        }

        function solveNext() {
            _autoSolve = true;
            var $gc = $('#game-content');

            if ($gc.hasClass('intro-running') || ischarMoving) {
                return;
            }
            $game.stopflash();
            var cols = $gc.find('.col');
            var solved = cols.filter('.solved');

            if (solved.length == cols.length)return;
            if (solved.length == 0) {
                cols.first().addClass('mark');
                cols.first().find('.solution').click();
            }
            else {
                var next = cols.filter('.solved').last().find('~ul').first();
                next.addClass('mark');
                next.find('.solution').click();
            }
        }

        function introAnimation() {
            $game.stopflash();
            var gameContent = $('#game-content');
            gameContent.addClass('intro-running');

            var cols = $('.col');
            var qIntro = $('#game');
            var $d = $game.data;
            var soundCoords = $game.soundCoords;
            var introLength = Math.floor((soundCoords.intro.stop - soundCoords.intro.start) * 10) * 100 - 1000;
            if ($d.sound.hasOwnProperty('introLength')) {
                $d.sound.introLength = parseFloat($d.sound.introLength);
                introLength = $d.sound.introLength * 1000;
            }
            var interval = introLength / cols.find('li').length

            cols.each(function (i, col) {
                lis = $(col).find('li');
                if (i % 2 == 0) {
                    heighlightElements(lis, interval);
                } else {
                    heighlightElements($(lis.toArray().reverse()), interval);
                }
            })
            qIntro.queue('intro', function () {
                gameContent.removeClass('intro-running');
                $game.flash($soundButton);
            })
//        Give the intro some time to load for iOS
            setTimeout(function () {
                $game.playSound('intro');
                qIntro.dequeue('intro');
            }, 1000);

            function heighlightElements(el, interval, startDelay, callback) {
                var startDelay = startDelay || 500;
                var interval = interval || 200;
                var items = el;
//                Queue begin
                items.each(function (i, e) {
                    qIntro.queue('intro', function () {
                        $(e).twinkle();
			if(window.location.host.indexOf("localhost") != -1 && (navigator.appVersion.indexOf("Linux") != -1 || navigator.appVersion.indexOf("X11") != -1)){
				$(e).animate(400, 'linear').animate(400, 'linear');
			}
			else{
                        	$(e).animate({scale: 1.1}, 400, 'linear').animate({scale: 1}, 400, 'linear');
                        }
			setTimeout(function () {
                            qIntro.dequeue('intro');
                        }, interval);
                    });
                });
            }
        }

        function generateStone(w, h) {

            var svg = $('<svg></svg>')
            $(svg).attr({
                viewBox: '0 0 86 86',
                version: '1.1',
                xmlns: "http://www.w3.org/2000/svg",
                'xmlns:xlink': "http://www.w3.org/1999/xlink",
                'xml:space': "preserve"
            }).css({
                    width: w,
                    height: h
                })
            var shapes = [
                $('<path d="M 19.9677 7.2515 L 63.9027 4.8607 C 72.7261 4.3806 80.2683 11.1442 80.7484 19.9677 L 83.1393 63.9027 C 83.6194 72.7262 76.8557 80.2683 68.0323 80.7484 L 24.0972 83.1393 C 15.2738 83.6194 7.7317 76.8558 7.2515 68.0323 L 4.8607 24.0973 C 4.3806 15.2738 11.1442 7.7317 19.9677 7.2515 Z" fill="#FFFFFF"/>'),
                $('<path d="M 21.6618 4.3296 L 65.8962 4.0547 C 75.0282 3.998 81.3567 12.2651 79.9944 22.2233 L 73.8117 67.4168 C 72.6784 75.701 65.2767 82.0217 57.3091 81.7531 L 18.585 80.4476 C 10.9933 80.1917 4.9827 73.6456 5.1087 65.6224 L 5.7934 21.9959 C 5.9438 12.4155 13.0187 4.3833 21.6618 4.3296 Z" fill="#FFFFFF"/>'),
                $('<path d="M 22.9677 7.2515 L 58.9027 5.8607 C 67.7261 5.3806 75.2683 12.1442 75.7484 20.9677 L 80.1393 63.9027 C 80.6194 72.7262 73.8557 80.2683 65.0323 80.7484 L 22.0973 78.1393 C 13.2737 78.6194 5.7317 71.8558 5.2515 63.0323 L 7.8607 24.0973 C 7.3806 15.2738 14.1442 7.7317 22.9677 7.2515 Z" fill="#FFFFFF"/>'),
                $('<path d="M 16.9557 79.3792 L 68.1843 80.0222 C 78.6378 80.1534 86.188 71.7313 85.0627 61.7888 L 80.3434 20.0919 C 79.5413 13.0049 72.2603 7.562 64.0754 7.6115 L 23.827 7.8552 C 15.8441 7.9035 8.5839 13.3347 7.5338 20.2981 L 1.3764 61.1332 C -0.0867 70.8362 6.8295 79.2521 16.9557 79.3792 Z" fill="#FFFFFF"/>')]
            var colors = ['#FFF2CA', '#DFD6CB', '#EBE1BF'];
            var div = $('<div></div>').css({
                x: '0px',
                y: '0px',
                stroke: '#957F5B',
                strokeWidth: 2
            }).addClass('stones');
            var shape = Math.floor(Math.random() * 4)
            var color = Math.floor(Math.random() * 3);
            var stone = shapes[shape].attr('fill', colors[color])
            return div.append(svg.append(stone));
        }
    });
}(jQuery));
