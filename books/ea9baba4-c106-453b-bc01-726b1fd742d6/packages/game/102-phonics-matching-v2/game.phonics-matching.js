$(function () {

    var $g, $nCurrentScreen, $gameContent, $screenArray, $phonic, $images, $data, $screen, $soundButton, $currentSound, selected, solved, solutions, numScreens, activeScreen, purple, $introPlayed;
    var soundClicked = false;

    $game.load(function () {
        var loadFunc = function () {
            purple = '#fcd9f6';
            $data = $game.data;
            $screenArray = $data.screens;
            initGame();
            $('#reset').click(function (event) {
                             
                initGame();
            });
            $('#solve').click(solveScreen);
            introAnimation();
        }

        $game.imageScan();
        $game.preloadResources({onComplete: loadFunc});
    });

    function initGame(nScreen) {
        if (typeof nScreen === 'number') {
            initScreen(nScreen)
            return;
        }
        nScreen = nScreen || 0

        $currentSound = false;

        if (!$data.screen)$data.screen = [
            {image: $data.image, phonic: $data.phonic}
        ];
        numScreens = 0;
        if ($data.screen.length) {
            for (var n = 0; n < $data.screen.length; n += 1) {
                numScreens++;
            }
            var allScreens = (function () {
                var arr = [];
                for (var i = 0; i < numScreens; i += 1) {
                    arr.push(i);
                }
                return arr;
            }());
            allScreens = $game.mixArray(allScreens);

            if (numScreens > 1 && nScreen == 0) {
                $game.navigation(numScreens, (function () {

                    return function () {
                        initScreen(allScreens.pop())
                    }
                }()));
            }
            initScreen(allScreens.pop());
        } else {
            initScreen(0);
        }

    }

    function initScreen(num) {
        soundClicked = false;
        $nCurrentScreen = num;
        $game.clear();
        $g = $('#game').first();
        $gameContent = $('#game-content').first();
        $('#solve').removeClass("disabled");   
        $images = $('<ul>').attr('id', 'images');
        $gameContent.append($images);
        $phonic = $('<div>').attr('id', 'phonic');
        $gameContent.append($phonic);
        $g.find('h1 .sound-button').remove();

        $gameContent.removeClass('solved');
        activeScreen = num;

        $screen = $($data.screen).get(num);
        if (!$screen.size)$screen.size = 150;
        $data.size = $screen.size;
        solutions = 0;
        selected = null;
        solved = 0;
        //set content height
        var ch = $('#game #buttons').position().top - $gameContent.position().top - 30;
        $gameContent.css({height: ch + "px"});

        if ($('.separator').length < 1) {
            var sep = $('<div>').addClass("separator");
            $gameContent.append(sep);
        }

        if ($screen.images)$screen.image = $screen.images;
        $($screen.image).each(function (n, i) {
            if (i.solution && i.solution != 0)solutions++;
            $images.append(createItem(i.source, i.sound, i.solution));
        });
        unorderImages();
        if ($screen.rows)createImageRows($images);
        //create phonic

        if ($screen.phonic) {
            var pi = $('<div>').addClass("phonic-image");
            var phoneme_text = $('<span></span>');
//            var img = $('<img>').attr('src', $screen.phonic.image);
           
            if ($screen.phonic.image) {
                pi.css('background-image', 'url("' + $screen.phonic.image + '")')
            } else if ($data.phoneme_background) {
                pi.css('background-image', 'url("' + $data.phoneme_background + '")')
            } else {
                pi.css('background-image', 'url("demo/images/background.png")')
            }
            if ($screen.phonic.width)pi.css({width: $screen.phonic.width + "px"});
            if ($screen.phonic.height)pi.css({height: $screen.phonic.height + "px", lineHeight: ($screen.phonic.height) + 'px'});
            if ($screen.phonic.text) {
                phoneme_text.text($screen.phonic.text);
            }
//            pi.append(img);
            pi.append(phoneme_text);
            $phonic.prepend(pi);

            if ($screen.phonic.sound) {
                var ps = $screen.phonic.sound;
                if (typeof ps != "object")ps = {content: ps};

//                pi.click(function (event) {
//                    $game.playSound(ps.content);
//                });
                //show sound button
                $soundButton = $game.soundButton().addClass('sound-icon');

                //pi.append($soundButton);
                //if (ps.x)$soundButton.css({left: ps.x + "px"});
                //if (ps.y)$soundButton.css({top: ps.y + "px"});

                //add soundButton to game title
                $('#game h1').first().prepend($soundButton);

                $soundButton.click(function (event) {
                    $game.disable();
                    $("#game-lock").css('z-index', '1000');
                    event.stopPropagation();
                    $game.stopflash($(this));

                    soundClicked = true;


                    if ($('#game-content').hasClass('intro-running'))return;

                    if (!$gameContent.hasClass('solved')) {

                        $(this).addClass("active");

                        $game.playSound(ps.content, function(){
                            $("#game-lock").css('z-index', '0');
                            $game.enable();
                            $soundButton.removeClass("active");
                            $game.stopflash($soundButton);
                        });
                    }
                })
            }
            var pb = parseInt($data.size) + 40;

            $phonic.css({paddingBottom: pb + "px", height: $screen.phonic.height + "px"});
        }

        createDropZones();
        //vertically align list and phonics
        $game.valign($images, "middle");
        $game.valign($phonic, "bottom");
        //also align elements horizontally if smaller than standard with
        if ($data.listsize && $data.listsize < 354) {
            var m = 0.5 * (354 - $data.listsize);
            $images.css({right: m + "px"});
        }
        if ($introPlayed)$game.flash($soundButton);

    }

//    function playNextSound() {
//
//        if (!$currentSound) {
//            var s = $images.find('div.source[data-solution=1]');
//            var n = Math.floor(Math.random() * s.length);
//            var d = $(s.get(n));
//            $currentSound = d.data('sound');
//        }
//
//        $game.playSound($currentSound);
//        activateItems($images);
//    }

    function createDropZones() {

        var ul = $('<ul>').addClass("dropzones").attr('data-highlight', '2:li');
        $phonic.append(ul);
        for (var i = 0; i < solutions; i++) {
            var li = $('<li>').css({width: $data.size + "px", height: $data.size + "px"}).addClass("dropzone");
            ul.append(li);
            li.click(placeItem);
        }
        //adapt size of dropzones
        var last = ul.find('li').last();
        var w = last.position().left + last.outerWidth() + parseInt(last.css('marginLeft'));
        ul.css({width: w + "px"});
        if (w < 354) {
            var m = 0.5 * (354 - w);
            ul.css({left: m + "px"});
        }

        $dropzone = $('ul.dropzones').attr('data-highlight', '1:div.target');
    }

    function solveScreen() {

        selectItem();
        $g.find('div.source').each(function (n, s) {
            var sol = $(s).data('solution');
            if (sol) {
                $(s).parent().addClass('empty');
                var li = $phonic.find('.dropzones li:not(.solved)').first();
                li.append($(s));
                li.addClass("solved");

            }
        });
        $gameContent.addClass('solved');
        $game.stopflash();
        $soundButton.off('click');
        $game.nextbtn();
        $('#solve').addClass("disabled");

    }

    function unorderImages() {

        var order = [];
        var li = $images.find('li');
        while (li.length) {
            var i = Math.floor(Math.random() * li.length);
            var s = li.splice(i, 1);
            order.push(s[0]);
        }
        $(order).each(function (n, l) {
            $images.append($(l));
        });
    }

    function createImageRows(ul) {
        var rows = $screen.rows.split(",");
        var li = ul.find('li');
        var c = 0;
        $(rows).each(function (n, r) {
            r = parseInt(r);
            var d = $('<ul>').addClass("row");
            ul.append(d);
            //
            var l = li.splice(0, r);
            $(l).each(function (n, i) {
                d.append($(i));
            });
            c += r;
        });
        if (li.length) {
            var d = $('<ul>').addClass("row");
            ul.append(d);
            $(li).each(function (n, i) {
                d.append($(i));
            });
        }
        //justify list items
        //first determine max items and max width
        var mw = 0;
        var mi = 0;
        ul.find('ul').each(function (n, u) {
            var li = $(u).find('li');
            var tw = 0;
            li.each(function (n, l) {
                tw += $(l).outerWidth();
            });
            if (li.length > mi)mi = li.length;
            if (tw > mw)mw = tw;
        });
        //now determine margin and set it on all items
        if ($data.listsize) {
            ul.css({width: $data.listsize + "px"});
        }

        var rw = ul.outerWidth() - mw;
        var m = (rw / (mi - 1)) / 2;

        ul.find('ul').each(function (n, u) {
            var li = $(u).find('li');
            li.css({marginLeft: m + "px", marginRight: m + "px"});
            li.first().css({marginLeft: "0px"});
            li.last().css({marginRight: "0px"});
        });
    }

    function createItem(src, snd, sol) {

        var li = $('<li>');
        var img = $('<img>').attr('src', src);
        img.css({maxWidth: $data.size + "px", maxHeight: $data.size + "px"});
        li.css({width: $data.size + "px", height: $data.size + "px"});
        var d = $('<div>').attr('data-solution', sol).attr('data-type', snd).addClass("source").data('sound', snd);
        d.css({width: $data.size + "px", height: $data.size + "px", lineHeight: $data.size + "px"});
        d.append(img);
        li.append(d);
        li.click(selectItem);
        d.click(function (event) {
            if ($('#game-content').hasClass('intro-running')  || soundClicked === false)return;
            if ($(this).parent('li').hasClass('inactive'))return;
            var sound = $(this).data('sound');
            if (sound != undefined) {
                $game.playSound(sound, function(){
                    
                    $("#game-lock").css('z-index', '0');
                    $game.enable();
                });
            }
        });
        return li;
    }

    function selectItem(event) {
        if ($('#game-content').hasClass('intro-running'))return;
        if (event && $(this).hasClass("inactive") || soundClicked === false)return;

        $images.find('li.selected').removeClass("selected");
        selected = null;
        if (event) {
            var d = $(this).find('div.source');
            if (!d.length)return;
            $(this).addClass("selected");

            selected = $(this);
            activateItems($dropzone);
        }
    }

    function placeItem(event) {
                
        if ($(this).hasClass('inactive'))return;

        var d = $(this).find('.source');
        
        if (d.length)return;
        if (selected) {
            var s = selected.find('.source').first();
            var ss = s.data('solution');

//            $game.flash($soundButton);
            if (!ss) {
                $game.playSound('no');
                selectItem(false);
            } else {

                var sound = s.data('type');

                selected.find('.source').removeAttr('data-solution');
                $currentSound = false;
                $(this).append(s);
                $(this).addClass("solved");
                selected.parent('.source').removeAttr('solution');
                selected.addClass("empty");
                selectItem(false);
                solved++;
                var sounds = [];
                sounds.push('yes');
                if (sound != undefined) {
                    sounds.push(sound);
                }
                
                
                function nextShow () {
                    var nextbtnDelay;
                    var showWin = function () {
                        $game.popup({type: 'win', text: 'Play again', sound: 'win', click: function () {
                            initGame();
                        }})
                    }
                    var $nav = $('.nav');
                    $("#game-lock").css('z-index', '0');
                    $game.enable();
                    $game.nextbtn();
                    $('#solve').addClass("disabled");
                    $game.nextbtn();
                    $game.stopflash();
                    $soundButton.off('click');
                    $gameContent.addClass('solved');

                    if ($nav.length > 0) {
                        if ($nav.find('li').last().hasClass('active')) {
                            showWin();
                        }
                    } else {
                        showWin();
                    }
                };
                 /*7478*/
                if (solved == solutions) {
                    var nextbtnDelay = $game.getSound('yes').stop - $game.getSound('yes').start;
                    if (sound != undefined) {
                        nextbtnDelay += $game.getSound(sound).stop - $game.getSound(sound).start;
                    }
                    setTimeout(nextShow , nextbtnDelay *1000);
                }
                $game.playSound(sounds);
            }

        }
    }

    function introAnimation() {

        var soundCoords = $game.soundCoords
        var images = $images.find('li');
        var targets = $dropzone.find('li');
        var introLength = Math.floor((soundCoords.intro.stop - soundCoords.intro.start) * 10) * 100;
        if ($data.sounds && $data.sounds.introLength) {
            introLength = $data.sounds.introLength * 1000;
        }

        $('#game-content').addClass('intro-running');

        $game.playSound("intro", function () {
            $('.intro-running').removeClass('intro-running');
            $game.flash($soundButton);
            $introPlayed = true;
        });

        highlightElements(images, 0, 150);

        highlightElements(targets, introLength / 2, 250);

    }

    function highlightElements(el, startDelay, interval, callback) {
        //make items appear
        startDelay = startDelay || 0;
        interval = interval || 200;

        setTimeout(function () {

            var items = el;
            var t;

            t = setInterval(function () {
                var i = items.first();
                items.splice(0, 1);
                if (!i.length) {
                    clearInterval(t);
                    if (callback)callback();
                    return;
                } else {
                    $game.twinkle(i);
                    if(window.location.host.indexOf("localhost") != -1 && (navigator.appVersion.indexOf("Linux") != -1 || navigator.appVersion.indexOf("X11") != -1)){
                        i.css('background-color', '#fcd9f6').animate(300, 'linear').css('background-color', '#fff').animate(300, 'linear');
                    } else {
                        i.animate({transform: {scale: 1.1}, backgroundColor: purple}, 300, 'linear').animate({transform: {scale: 1.0}, backgroundColor: '#fff'}, 300, 'linear');    
                    }
                    
                }
            }, interval);
        }, startDelay);
    }

    function inactivateItems(items, not) {
        not = not || '.solved';
        items.find('li').not(not).addClass('inactive');
    }

    function activateItems(items) {
        items.find('li').removeClass('inactive');
    }

})
;
