(function ($) {
    'use strict';
    $(function () {

        var $g, $d, $cf, $char, $el, $eli, $t, $bg, $bgc, $targets, $targetsLoaded, guessesLeft, numsolutions, $solutionSoundArray;
        var $template, currentScreen, $currentSound, _solutionArray, $nextBtn, $navigation;
        //functions
        var flashSound, stars, animateCharacter, initGame, introAnimation, reinitialize, solveGame, playSolutionSound,
            initElements, initCharFrame, nextSolutionSound, placeElement, checkSolved, unorder, getUnplacedSolutionSounds,
            activate, initChar, init, changeBg, center, loadCharTargets, inactivate, getUnplacedSolutions, isEveryTypePlaced, isLastScreen;
        $game.load({
            onload: function () {
                var loadedfunc = function () {
                    $d = $game.data;
                    $g = $('#game-content').first();
                    if ($d.template) {
                        $template = $d.template;
                        $g.addClass($template);
                    }
                    var gh = $('#buttons').position().top - 20 - $g.position().top;
                    $g.css({height: gh + "px"});
                    initGame();

                    $('#reset').click(reinitialize);
                    $('#solve').click(solveGame);
                    $('#replay').click(reinitialize);
                    $('#animate').click(function () {
                        if ($(this).hasClass('inactive')) {
                            return;
                        }
                        stars();
                        // animateCharacter();
                    });
                    $('#animate').addClass('inactive');

                    if ($template === 'solution') {
                        $('#solve').show();
                        $('h1').prepend($game.soundButton());
                        $('.sound-button').on('click', playSolutionSound);
                        $('#animate').hide();
                    } else {
                        $('#solve').hide();

                    }

//                    if ($d.countdown && $d.countdown != 0) {
//                        $game.countdown($d.countdown);
//                    }

                    introAnimation();
                };

                $game.imageScan();
                $game.preloadResources({onComplete: loadedfunc});
            }
        });

        isLastScreen = function () {
            var $nav = $('.nav');
            return $nav.length === 0 || ($nav.length > 0 && $nav.find('li').last().hasClass('active'));
        };

        reinitialize = function () {

            if ($('#game-content').hasClass('intro-running')) {
                return;
            }
            $game.clear();
            initGame();
            if ($template === 'solution') {
                flashSound();
            }
        };

        initGame = function initGame() {

            //character
            if ($d.screens) {
                if ($d.screens.random === 'true') {
                    $d.screens = $game.shuffle($d.screens);
                }
                $nextBtn = $game.navigation($d.screens.length, function (num) {
                    init(num);
                });
            }
            init(0);
        };
        init = function (num) {
            if ($template === "solution") {
                $('#solve').show();
            }

            $game.clear();
            if ($d.screens.length) {
                currentScreen = $d.screens[num];
            } else {
                currentScreen = $game;
            }
            initElements(currentScreen);
            initCharFrame(currentScreen);

            if ($template === 'solution') {
                $solutionSoundArray = [];
                nextSolutionSound();
            }
            $('#animate').addClass('inactive');
        };

        initElements = (function () {
            var wImage, hImage;
            return function (screen) {

                _solutionArray = [];

                var elements = screen.elements;
                if (!elements.length) {
                    return;
                }
                $(elements).each(function (n, e) {
                    var elementClass = e.type;
                    if (_solutionArray.indexOf(elementClass) === -1 && elementClass !== undefined) {
                        _solutionArray.push(elementClass);
                    }
                });
                $el = $('<div>').attr('id', 'elements');
                $g.append($el);
                $eli = $('<div>').attr('id', 'elements-inner');
                $el.append($eli);
                var $imagesWrapper = $('<div>').addClass('images-wrapper');
                $eli.append($imagesWrapper);
                var count = 0;

                numsolutions = 0;
                var counterPerRow = 0;
                var perRow = currentScreen.perRow ? currentScreen.perRow : 3;
                var images = $('<div>').addClass('images pr'+perRow);
                $imagesWrapper.append(images);

                var nItems = elements.length;
                var height;
                if (nItems <= 12) {
                    height = 60;
                } else {
                    height = 40;
                }

                $(elements).each(function (n, e) {

                    if (counterPerRow === perRow) {
                        images = $('<div>').addClass('images pr'+perRow);
                        $imagesWrapper.append(images);
                        counterPerRow = 0;
                    }
                    var source = $('<div>').addClass('source').css({height: height + 'px', lineHeight: height + 'px'});
                    source.attr({
                        'data-type': e.type,
                        'data-sound': e.sound,
                        'data-solution': e.solution,
                    });

                    images.append(source);
//                    if (!wImage || !hImage) {
                    var margin = parseInt(source.css('marginTop'), 10);
                    wImage = source.outerWidth();
                    // + 10 margin on top and bottom;

                    hImage = source.outerHeight() + (margin * 2);// + 20;
                    wImage = wImage + 'px';
                    hImage = hImage + 'px';
//                    }
                    var $wrapper = $('<div></div>').addClass('image').css({width: wImage, height: hImage, lineHeight: hImage});

                    source.append($wrapper);

                    var li = $('<li>');

                    var t = $('<img>').attr({src: e.thumb}).addClass("thumb");
                    t.css({maxHeight: '100%', maxWidth: '100%'});
                    if (e.solution) {
                        source.addClass('solution');
                        source.data({solutionNumber: e.solution});
                        numsolutions += 1;
                    }
                    source.data('num', n);
                    $wrapper.append(t);

                    source.click(function (event, autosolved) {
                        var $gameContent = $('#game-content');
                        if ($gameContent.hasClass('intro-running') || $(this).hasClass('inactive')) {
                            return;
                        }
                        var self = this;

                        if ($template === 'solution') {
                            var sound = $(this).data('sound');
                            if ($currentSound === sound) {
                                $game.playSound('yes');
                                placeElement.call(self, [event, autosolved]);
                            } else if (typeof($currentSound) === 'object') {
                                var len = $currentSound.length,
                                    sounds = [];
                                for (var i = 0; i < len; i++) {
                                    sounds.push($($currentSound[i]).data('sound'));
                                }
                                if (sounds.indexOf(sound) != -1) {
                                    placeElement.call(self, [event, autosolved]);
                                } else {
                                    $game.playSound('no');
                                }
                            } else {
                                $game.playSound('no');
                            }
                        } else {
                            placeElement.call(self, [event, autosolved]);
                        }

                    });
                    count = n;
                    counterPerRow += 1;
                });
//        add right border to last image if there are less then three
                if ($('.images').last().find('.source').length < 3) {
                    $('.images').last().find('.source').last().css({borderRight: '3px solid #91bf19'});
                }
            };
        }());

        placeElement = function (event, autoSolve) {

            autoSolve = autoSolve || false;
            var $gameContent = $('#game-content');
            if ($gameContent.hasClass('intro-running') || $(this).hasClass('inactive')) {
                return;
            }
            if (autoSolve === false) {
                $gameContent.removeClass('auto-solved');
            }

            var $l = $(this);
            var n = $l.data('num');
            var info = currentScreen.elements[n];

            if (info !== undefined) {
                var t = info.target;
                var ct = $char.find('div.target[data-id="' + t + '"]').first();
            }

            if (info !== undefined && ct.length) {
                var c = "type-" + info.type;
                ct.find('div.element.' + c).remove();
                var el = $('<div>').addClass("element").addClass(c);
                el.attr('data-type', info.type);
                var oz = $game.getZ(ct);
                if (info.z) {
                    var z = oz + info.z;
                    el.css('zIndex', z);
                }

                if (info.images) {
                    $(info.images).each(function (n, i) {
                        if (typeof i === "string") {
                            i = {content: i};
                        }
                        var img = $('<img>').attr('src', i.content);
                        if (i.z) {
                            var z = oz + i.z;
                            img.css('zIndex', z);
                        }
                        if (i.x) {
                            img.css('left', i.x + "px");
                        }
                        if (i.y) {
                            img.css('top', i.y + "px");
                        }
                        el.append(img);
                    });
                } else {
                    var i = $('<img>').attr('src', info.image);
                    el.append(i);
                }

                if (info.x) {
                    el.css({left: info.x + "px"});
                }
                if (info.y) {
                    el.css({top: info.y + "px"});
                }
                ct.append(el);

                if ($template === 'solution') {
                    guessesLeft -= 1;

                    var isGameSolved = false,
                        groupSolved = false;

                    var sound = $(this).data('sound');
                    if ($currentSound === sound) {
                        el.addClass("correct");
                        if (! autoSolve) {
                            $game.playSound('yes');
                        }
                    } else if (typeof($currentSound) === 'object') { // detect is group solutions
                        var len = $currentSound.length;
                        for (var x = 0; x < len; x++) {
                            if ($($currentSound[x]).data('sound') == sound) {
                                el.addClass("correct");
                                if (! autoSolve) {
                                    $game.playSound('yes');
                                }
                                $currentSound.splice(x, 1); // remove sound
                                x = len;
                            }
                        }
                        if (! $currentSound.length) {
                            groupSolved = true;
                            nextSolutionSound();
                        }
                    } else {
                        el.addClass("incorrect");
                        $game.playSound('no');
                    }

                    if (guessesLeft <= 0) {
                        isGameSolved = checkSolved();
                    }

                    if  ( (typeof($currentSound) === 'string' && ! isGameSolved) ||
                          (typeof($currentSound) === 'object' && groupSolved) ) {
                        flashSound();
                    } else {
                        $game.stopflash($('.sound-button'));
                    }

                    if (typeof($currentSound) === 'string') {
                        nextSolutionSound();
                    }

                } else {
                    if (info.sound) {
                        $game.playSound(info.sound);
                    }
                }

                if ($d.config) {
                    el.draggable({stop: function (event, ui) {
                        console.log(ui.position);
                    }});
                }
            }

            console.log(isEveryTypePlaced());
            if (isEveryTypePlaced()) {
                $game.nextbtn();
                $('#animate').removeClass('inactive');
            }

        };

        isEveryTypePlaced = function () {
            var checkArray, $elements;
            $elements = $('#character').find('.element');
            function spliceCorrect(str) {
                var pos = checkArray.indexOf(str);
                if (pos !== -1) {
                    checkArray.splice(pos, 1);
                }
            }

            checkArray = _solutionArray.slice();
            $elements.each(function (n, e) {
                spliceCorrect($(e).data('type'));
            });

            return checkArray.length === 0;
        };

        nextSolutionSound = function () {
            if ($solutionSoundArray.length <= 0) {
                $solutionSoundArray = getUnplacedSolutionSounds();
                if ($d.random === 'true') {
                    $solutionSoundArray = unorder($solutionSoundArray);
                }
                guessesLeft = getUnplacedSolutionSounds().length;
            }
            $currentSound = $solutionSoundArray.splice(0, 1)[0];
        };

        playSolutionSound = function () {
            if ($('#game-content').hasClass('intro-running')) {
                return;
            }
            var soundButton = $(this);
            soundButton.addClass('active');
            $(this).removeClass('press');

            if (typeof($currentSound) === 'object') {
                var sounds = [];
                for (var i = 0; i < currentScreen.groupSolution; i++) {
                    sounds.push($($currentSound[i]).data('sound'));
                }
                $game.playSound(sounds.join(), function () {
                    activate($('.source'));
                    soundButton.removeClass('active');
                });
            } else {
                $game.playSound($currentSound, function () {
                    activate($('.source'));
                    soundButton.removeClass('active');
                });
            }
        };

        initCharFrame = function (screen) {
            $cf = $('<div>').attr('id', 'character-frame');

            if ($d.background) {
                $cf.addClass('background');
            }
            $g.append($cf);
            var f = $('<div>').attr('id', 'frame-border');
            $cf.append(f);
            initChar(screen);

            //backgrounds
            $bgc = $('<div>').attr('id', 'background-container');
            $cf.append($bgc);
            //blank background
            var s = $('<div>').addClass("background-slide");
            $bg.push(s);
            s.data('num', 0);
            $bgc.append(s);
            s.addClass("active");
//        here we only have one big background
            if ($template === 'picture') {
                s.css({
                    backgroundImage: $d.background.image
                });

            } else if ($d.background) {
                var bgs = ($d.background.length > 1) ? $d.background : [$d.background];

                $(bgs).each(function (n, bg) {
                    var s = $('<div>').addClass("background-slide");
                    var i = new Image();

                    i.onload = function () {
                        s.append(i);
                        var ml = i.width * -0.5;
//                        $(i).css({left: '50%', marginLeft: ml + "px"});
                    };
                    i.src = bg.image;
                    s.data('sound', bg.sound);
                    s.data('num', n + 1);
                    $bg.push(s);
                    $bgc.append(s);
                });
            }
            if ($bg.length > 1) {
                var bl = $('<a><span></span></a>').addClass("arrow left");
                $cf.append(bl);
                var br = $('<a><span></span></a>').addClass("arrow right");
                $cf.append(br);
                bl.click(changeBg);
                br.click(changeBg);
            }
        };

        changeBg = function (event) {
            if ($('#game-content').hasClass('intro-running') || $('.sound-button').hasClass('active')) {
                return;
            }
            $game.disable();
            var $self = $(this);
            $self.addClass('active');
            var b = $(this);
            var current = $bgc.find('div.active').first();
            var i = current.index();
            var m = b.hasClass("left") ? -1 : 1;
            i += m;
            if (i < 0) {
                i = $bg.length - 1;
            }
            if (i >= $bg.length) {
                i = 0;
            }
            var newbg = $bg[i];
            var x = $cf.outerWidth();
            if (m < 0) {
                x = -x;
            }
            newbg.css('left', x + "px").addClass("active");
            current.addClass("show").removeClass("active");
            var cx = $bgc.outerWidth();
            if (m > 0) {
                cx = -cx;
            }
            current.animate({left: cx + "px"}, 300, function () {
//                current.removeClass("show");
            });
            newbg.animate({left: '0px'}, 300, function () {
                $game.enable();
                $self.removeClass('active');
                var s = newbg.data('sound');
                if (s) {
                    $game.playSound(s);
                }
            });
        };

        initChar = function (screen) {
            $char = $('<div>').attr('id', 'character');
            $cf.append($char);

            var img = new Image();
            var $c = screen.character;
            $char.css({width: $c.width + "px", height: $c.height + "px"});

            $char.hide();
            center($char);
            if ($d.config) {
                $char.html('<div class="config-bg"></div>');
            }
            $bg = [];
            $targetsLoaded = 0;
            $targets = $c.targets;

            if ($c.image) {
                img.onload = function () {
                    $char.append(img);
                    $char.css({width: img.width + "px", height: img.height + "px"});
                    center($char);
                    loadCharTargets();
                };
                img.src = screen.character.image;
                $char.append(img);
            } else {
                loadCharTargets();
            }
            $char.fadeIn(50);
        };

        loadCharTargets = function () {
            $($targets).each(function (n, t) {
                $t = $('<div>').addClass("target").attr('data-id', t.id);
                var img = $('<img>').attr('src', t.content);
                img.load(function (event) {
                    $targetsLoaded += 1;
                });
                // $t.append(img);

                var z = $game.getZ($char);
                if (t.z) {
                    z += t.z;
                }
//            img.css('zIndex', z);
                if (t.z) {
                    $t.data('z', z);
                }

                $t.css({left: t.x + "px", top: t.y + "px"});
                $char.append($t);
            });
        };

        unorder = function (arr) {
            var na = [];
            while (arr.length) {
                var i = Math.floor(Math.random() * arr.length);
                var r = arr.splice(i, 1);
                na.push(r[0]);
            }
            return na;
        };

        center = function (el) {
            var p = el.parent();
            var pp = p.css('position');
            if (!pp.match(/(absolute|relative)/)) {
                p.css('position', 'relative');
            }
            var ml = -0.5 * el.outerWidth();
            var mt = -0.5 * el.outerHeight();
            el.css({position: "absolute", top: "50%", left: "50%", marginTop: mt + "px", marginLeft: ml + "px"});
        };

        checkSolved = function () {
            var checkedDelay = 500;

            var solved = $cf.find('div.correct').length;
            var allOnTarget = $cf.find('.element').length;
            if (solved >= numsolutions) {
//            $('#solve').hide();
                if (isLastScreen()) {
                    if (! $('#game-content').hasClass('auto-solved')) {
                        if ($('#animate:visible').length) {
                            animateCharacter();
                        }
                        $game.popup({
                            type: "win",
                            click: reinitialize,
                            delay: 4000
                        });
                    } else {
                        $game.playSound('yes');
                    }
                }
                return true;
            }
            if (allOnTarget >= numsolutions) {
                setTimeout(function () {
                    $game.playSound('no');
                    setTimeout(function () {
                        $cf.find('.incorrect').remove();
                    }, checkedDelay);

                }, checkedDelay * 2);
                return false;
            }
            if (guessesLeft <= 0) {
                setTimeout(function () {
                    $cf.find('.incorrect').remove();
                }, checkedDelay * 2);
                return false;
            }
        };

        solveGame = function () {
            var $gamecontent = $('#game-content');
            $('.sound-button').removeClass('active');
            if ($gamecontent.hasClass('intro-running')) {
                return;
            }
//        $cf.find('div.element').remove();
            if ($template === 'solution') {
                var sounds = [];
                var type = typeof($currentSound);
                if (type !== undefined && type === 'object') {
                    for (var i = 0; i < $currentSound.length; i++) {
                        sounds.push($($currentSound[i]).data('sound'));
                    }
                } else {
                    sounds.push($currentSound);
                }

                var answer = '';
                for (var x = 0; x < sounds.length; x++) {
                    answer = $('#elements-inner').find('[data-sound='+sounds[x]+']');
                    answer.removeClass('inactive');
                    placeElement.call(answer, undefined, true);
                }

                guessesLeft -= 1;
                if (guessesLeft <= 0) {
                    $gamecontent.addClass('auto-solved');
                }
                flashSound();

            } else {
                $('.images').find('.solution').trigger("click", true);
            }
        };

        flashSound = function () {
            if ($template === 'solution') {
                var soundBtn = $('.sound-button');
                $game.flash(soundBtn, 1.1);
                soundBtn.addClass('press');
                inactivate($('.source'));

            }
        };

        inactivate = function (el) {
            el.addClass('inactive');
        };

        activate = function (el) {
            el.removeClass('inactive');
        };

        getUnplacedSolutions = function () {
            var character = $('#character');
            var placedCorrect = character.find('.correct');
            var typesCorrect = placedCorrect.map(function (n, el) {
                return $(el).data('type');
            });

            var choosable = $('#elements-inner');
            var solutions = choosable.find('.solution');
            var typesSolution = solutions.map(function (n, el) {
                return $(el).data('type');
            });
            typesCorrect.each(function (n, el) {
                var ret = $.inArray(el, typesSolution);
                if (ret >= 0) {
                    typesSolution.splice(ret, 1);
                }
            });

            var unplacedSolutions = [];
            var pos = 0;
            solutions.map(function (n, el) {
                if ($.inArray($(el).data('type'), typesSolution) !== -1) {
                    pos = $(el).data('solution') - 1;
                    unplacedSolutions[pos] = $(el);
                }
            });
            return unplacedSolutions;
        };

        getUnplacedSolutionSounds = function () {
            var unplaced = getUnplacedSolutions();
            if ($d.random === 'false') {
                unplaced.sort(function (e, n) {
                    return parseInt($(e).data('solutionNumber'), 10) >= parseInt($(n).data('solutionNumber'), 10);
                });
            }
            if (currentScreen.groupSolution !== undefined) {
                var groups = [];
                while (unplaced.length > 0) {
                    groups.push(unplaced.splice(0, currentScreen.groupSolution));
                }
                return groups;
            } else {
                return unplaced.map(function (n, el) {
                    return $(el).data('sound');
                });
            }
        };


        stars = function (){
            var estrellas;
            for (var i = 0; i < $game.data.sound.length; i++) {
                if($game.data.sound[i].id === "animation"){
                    estrellas = ($game.data.sound[i].stop - $game.data.sound[i].start) * 1000;
                }
            }
            var starTime = $game.data.sound;
            $("#character-frame").css("background", '#fafafa url(img/stars.gif)');
            $game.disable();
            setTimeout(function () {
                $("#character-frame").css("background", '#fafafa');
                $game.enable();
            }, estrellas);
            $game.playSound('animation');
        }

//         animateCharacter = function () {
//             var animationTimer;
//             var animationTime = 3000;
//             var $animateDiv;
//             var $img;
//             var src;
//             var t;
//             var z;
//             var width, height, pos = {};

//             function startTimer() {
//                 animationTimer = setTimeout(function () {
//                     animateCharacter(true);
//                 }, animationTime);
//             }

//             return function (hide) {
//                 src = currentScreen.character.animation.source;
//                 t = currentScreen.character.animation.t;
//                 z = currentScreen.character.animation.z;
//                 $img = $('<img>').attr('src', src);
//                 $animateDiv = ($('<div></div>').addClass('animate'));
//                 $animateDiv.append($img);
//                 pos.top = currentScreen.character.animation.y;
//                 pos.left = currentScreen.character.animation.x;
//                 $animateDiv.css({left: pos.left, top: pos.top, zIndex: z});

//                 if (animationTimer) {
//                     clearTimeout(animationTimer);
//                     animationTimer = undefined;
//                 }
//                 var character = $('#character').find('.target').filter('[data-id='+t+']');

//                 if (character.hasClass('animating')) {
//                     hide = true;
//                 }
//                 var elementOnTarget;
//                 character.toggleClass('animating');
//                 if (hide) {
//                     character.removeClass('animating');
//                     character.find('.animate').remove();
//                     return;
//                 }
//                 if (character.hasClass('animating')) {
//                     $game.playSound('animation');
//                     elementOnTarget = character.find('.element').first();
//                     if (elementOnTarget.length > 0) {
//                         character.find('.element').first().before($animateDiv);
//                     } else {
//                         character.append($animateDiv);
//                     }
//                     if ($d.config === 0) {
//                         startTimer();
//                     }
//                 }
// //                else {
// //                    if ($d.config === 0) {
// //                        character.find('.animate').remove();
// //                    }
// //                }
//             };
//         };

        introAnimation = function () {
            var qIntro = $('#game');
            var images = $('.images');
            var $d = $game.data;
            var soundCoords = $game.soundCoords;
            var introLength = Math.floor((soundCoords.intro.stop - soundCoords.intro.start) * 10) * 100 - 1000;
            var gameContent = $('#game-content');

            function heighlightElements(el, interval, startDelay, callback) {
                startDelay = startDelay || 500;
                interval = interval || 200;
                var items = el;
//                Queue begin
                items.each(function (i, e) {
                    qIntro.queue('intro', function () {

                        $(e).find('img').animate({transform: {scale: 1.2}}, 400, 'linear').animate({transform: {scale: 1}}, 400, 'linear');
                        $(e).twinkle();
                        setTimeout(function () {
                            qIntro.dequeue('intro');
                        }, interval);
                    });
                });
            }

            $game.stopflash();
            gameContent.addClass('intro-running');

            if ($d.sound.hasOwnProperty('introLength')) {
                $d.sound.introLength = parseFloat($d.sound.introLength);
                introLength = $d.sound.introLength * 1000;
            }
            var interval = introLength / images.find('.source').length;

            images.each(function (i, img) {
                var imgs = $(img).find('.source');
                if (i % 2 === 0) {
                    heighlightElements(imgs, interval);
                } else {
                    heighlightElements($(imgs.toArray().reverse()), interval);
                }
            });
            qIntro.queue('intro', function () {
                gameContent.removeClass('intro-running');
                if ($template === 'solution') {
                    flashSound();
                    inactivate($('.source'));
                }
                qIntro.dequeue('intro');
            });
//        Give the intro some time to load for iOS
            setTimeout(function () {
                $game.playSound('intro', function () {
                });
                qIntro.dequeue('intro');
            }, 1000);

        };
    });
}(jQuery));
