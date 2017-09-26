$(function () {
    var $g, $ph, $i, $d, $s, $images, $num, $m, $phh, $phw, $phReady, $selected, purple, $params;
    var $soundButton, $template, $solutionSound, $sound_yes, $sound_no, $sound_answer, $autoSolved, $nxtBtn;
    var IE9, OPERA;
    var SCREENS;

    $game.load({
        onload: function () {

            var loadfunc = function () {
                if ($game.data.title)
                    $template = $game.data.title.sound === 'true' ? '203a' : undefined;

                purple = '#fcd9f6';
                $d = $game.data;
                $g = $('#game-content').first();
                var gh = $('#buttons').position().top - 10 - $g.position().top;

                $g.addClass('intro-running');
                $g.css({height: gh + "px"});

                initGame(0);

                $('#reset').click(function (event) {
                    reinitializeGame($num);
                    if ($soundButton)$game.flash($soundButton);
                });
                $('#replay').click(function (event) {
                    initGame(0);
                    if ($soundButton)$game.flash($soundButton);
                });
                $('#solve').click(solveScreen);

                introAnimation();

            }

            $game.imageScan();
            $game.preloadPopup('win');
            $game.preloadResources({onComplete: loadfunc});

        }

    });

    function initGame(nScreen) {
        nScreen = nScreen || 0;
        if (! $d.screens) {
            $d.screens = [ {image: $d.image, images: $d.images} ];
        }
        var nMaxScreens = 8;
        if ($d.screens.nScreens) {
            nMaxScreens = $d.screens.nScreens;
        }
        $d.screens = $game.shuffle($d.screens);
        if ($d.screens.length > 3) {
            SCREENS = $d.screens.slice(0, nMaxScreens);
        } else {
            SCREENS = $d.screens.slice(0);
        }
        if (SCREENS.length > 1 && nScreen === 0) {
            $nxtBtn = $game.navigation(SCREENS.length, initScreen);
        }
        initScreen(nScreen);
        if ($template === '203a') {
            addSoundButton();
            inactivateItems($images)
        }
    }

    function reinitializeGame(num) {
        if ($('#game-content').hasClass('intro-running'))return;
        num = num || 0;
        $game.stopflash();
        if ($nxtBtn) {
            $nxtBtn.removeClass('active');
        }
        initGame(num);
    }

    function initScreen(num) {
        num = num || 0;
        $game.clear();
        $autoSolved = false;
        $('#solve').removeClass("disabled");
        $('#game-content').removeClass('solved auto-solved');
        $num = num;
        $s = SCREENS[num];
        $g.html('');
        if (!$s.size)$s.size = 100;
        if (!$s.margin)$s.margin = $s.size * 0.1;

        $i = $('<ul>').attr('id', 'thumbnails');
        $g.append($i);
        if ($s.images.length > 10) {
            var sol = undefined;
            var count = 0;
            while (sol == undefined && count < $s.images.length) {
                var sol = $s.images[count].solution;
                count++;
            }
            var idx = count-1;
            var solution = $s.images[idx];
            $s.images.splice(idx, 1); // delete solution from array
            var aux = $s.images.slice(0); // clone array
            var images = $game.mixArray(aux); // mix array
            // select 9 items
            for (var x = 0; x < 9; x++) {
                $i.append(createItem(images[x].source, images[x].sound, n, images[x].solution));
                $i.find('li').css({margin: $s.margin + "px"});
            }

            // push again solution item
            $s.images.push(solution);

            // render solution (item 10)
            $i.append(createItem(solution.source, solution.sound, n, solution.solution));
            $i.find('li').css({margin: $s.margin + "px"});
        } else {
            $($s.images).each(function (n, i) {
                $i.append(createItem(i.source, i.sound, n, i.solution));
                $i.find('li').css({margin: $s.margin + "px"});
            });
        }

        unorderImages();

        $phh = 358;
        if ($s.rows) {
            $i.addClass("left");
            createImageRows($i);
            $game.valign($i, "middle");
        } else {
            $i.addClass("horizontal");
            $i.find('li').css({marginTop: '0px', marginBottom: '0px'});
            $i.find('li').first().css({marginLeft: '0px'});
            $i.find('li').last().css({marginRight: '0px'});
            $phh = $g.outerHeight() - $i.outerHeight() - 20;
        }

        $phReady = false;
        createPorthole();

        $images = $('#thumbnails');
        if (num > 0 && $soundButton)$game.flash($soundButton);
        $solutionSound = $('[data-solution]').data('sound') || 'notDefined';
        try {
            $sound_yes = SCREENS[num].sounds.yes || 'yes';
            $sound_no = SCREENS[num].sounds.no || 'no';
            $sound_answer = SCREENS[num].sounds.answer || $('[data-solution]').data('sound')
        } catch (err) {
            console.log(err);
            $sound_yes = 'yes';
            $sound_no = 'no';
            $sound_answer = $('[data-solution]').data('sound')
        }
        $('.sound-icon').remove();

        if ($template === '203a') {
            inactivateItems($images);
        }

    }

    function addSoundButton() {
        var gameContent = $('#game-content');

        if ($soundButton)return;
        $soundButton = $game.soundButton();
        var headline = $('h1:first', '#game');

        headline.prepend($soundButton);
        $soundButton.click(function () {
            if (gameContent.hasClass('intro-running') || gameContent.hasClass('solved'))return;
            $(this).addClass('active');
            console.log($solutionSound);
            $game.playSound($sound_answer, function () {
                $soundButton.removeClass('active')
                activateItems($images)
            })
        })
    }

    function createPorthole() {

        $ph = $('<div>').attr('id', 'porthole');
        $ph.css({height: $phh + "px"});
        $g.append($ph);

        var image = $s.image;
        var scale = 1;

        var ri = $('<img>').addClass("reveal").appendTo($ph).css({visibility: 'hidden'}).hide();
        var si = $('<img>').addClass("show").appendTo($ph).css({visibility: 'hidden'});

        var setImage = function (el, img) {
            el.attr('src', img.src);
            var h = Math.floor(img.height * scale);
            var w = Math.floor(img.width * scale);
            var ml = Math.round(-0.5 * w);
            var mt = Math.round(-0.5 * h);
            el.css({width: w + "px", height: h + "px", marginLeft: ml + "px", marginTop: mt + "px", visibility: "visible"});
        }

        $game.loadImage(image.show, function (img) {

            scale = $phh / img.height;
            if (scale > 1)scale = 1;
            //set image dimensions
            setImage(si, img);
            var phw = si.outerWidth();
            $ph.css({width: phw + "px"});
            if (!$s.rows) {
                //center horizontally
                var left = 0.5 * ($g.outerWidth() - $ph.outerWidth());
                $ph.css({left: left + "px"});
            } else {
                $game.valign($ph);
            }
            //also load other image
            $game.loadImage(image.reveal, function (img) {
                setImage(ri, img);

            });
        });

        return;
    }

    function animatePorthole(callback) {
        var r = $ph.find('img.reveal').first();
        r.fadeIn();
    }

    function unorderImages() {
        var order = [];
        var li = $i.find('li');
        while (li.length) {
            var i = Math.floor(Math.random() * li.length);
            var s = li.splice(i, 1);
            order.push(s[0]);
        }
        $(order).each(function (n, l) {
            $i.append($(l));
        });
    }

    function createImageRows(ul) {
        var rows;
        if ($s.rows)rows = $s.rows;
        if (!rows)return;
        if (rows.match(/x/)) {
            rows = rows.split("x");
            var nr = [];
            var r = parseInt(rows[0]);
            for (var i = 0; i < r; i++) {
                nr.push(parseInt(rows[1]));
            }
            rows = nr;
        } else {
            rows = rows.split(",");
        }

        var li = ul.find('li');
        var c = 0;
        $(rows).each(function (n, r) {
            r = parseInt(r);
            var d = $('<ul>').addClass("row");
            ul.append(d);
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
        //now determine margin and set in on all items
        var rw = ul.outerWidth() - mw;
        var m = (rw / (mi - 1)) / 2;
        ul.find('ul').each(function (n, u) {
            var li = $(u).find('li');
            li.css({marginLeft: m + "px", marginRight: m + "px"});
            li.first().css({marginLeft: "0px"});
            li.last().css({marginRight: "0px"});
        });
    }

    function createItem(src, snd, num, sol) {

        var li = $('<li>').attr('data-num', num).attr('data-sound', snd);
        var div = $('<div>').attr('data-type', snd).addClass("source");

        if (src) {
            var img = $('<img>').attr('src', src);
            img.css({maxWidth: $s.size + "px", maxHeight: $s.size + "px"})
                .attr('alt', snd);

            if ($d.thumbAlign) {
                img.css({verticalAlign: $d.thumbAlign});
            }
        }

        li.css({width: $s.size + "px", height: $s.size + "px"});
        div.css({width: $s.size + "px", height: $s.size + "px", lineHeight: $s.size + 'px'});
        if (sol)li.attr('data-solution', 1);
        div.append(img);
        li.append(div);

        li.click(function (event) {
            if ($('.intro-running').length > 0)return;
            var thumbnails = $('#thumbnails');
            if ($(this).hasClass('inactive'))return;
            if (thumbnails.hasClass('clicked'))return;

            thumbnails.addClass('clicked');
            var s = $(this).data('sound');
            $selected = $(this);
            $selected.addClass("selected");
            if (s) {
                checkSelected(s);
            } else {
                setTimeout(checkSelected, 400);
            }
        });
        return li;
    }

    function checkSelected(solutionSound) {
        var $gameContent = $('#game-content');
        if ($gameContent.hasClass('solved'))return;
        var sol = $selected.data('solution');

        if (sol) {
            $gameContent.addClass('solved');
            inactivateItems($('#thumbnails'));
            $('#solve').addClass("disabled");
            $game.stopflash();

            var sound = ($autoSolved) ? false : $sound_yes;
            animatePorthole();
            var finishOrNext = function () {
                if ($num >= SCREENS.length - 1) {

                    $game.popup({
                        delay: 300,
                        type: 'win',
                        noSound: $autoSolved,
                        click: function () {
                        initGame(0);
                    }});
                } else {
                    $game.nextbtn.call($game);
                }
            }
            if (sound) {
                $game.playSound([sound, solutionSound], finishOrNext);
            } else {
                $game.playSound(solutionSound, finishOrNext);
            }

        } else {
            $game.playSound([solutionSound, $sound_no], function () {
                $selected.removeClass("selected");
                $('#thumbnails').removeClass('clicked');
                $selected = null;
            });
        }
    }

    //    only solve screen if intro is not running, the game isn't already solved, no item is
    //    currently selected
    function solveScreen() {
        $gameContent = $('#game-content');
        if (($gameContent).hasClass('intro-running'))return;
        if (($gameContent).hasClass('solved'))return;
        if ($('.selected').length > 0)return;
        $('#solve').addClass("disabled");
        $gameContent.addClass('auto-solved');
        $game.stopflash();
        var li = $i.find('li[data-solution=1]').first();
        var s = li.data('sound');
        $selected = li;
        $selected.addClass("selected");
        $autoSolved = true;
        setTimeout(function () {
            checkSelected(s)
        }, 400);
    }

    function introAnimation() {
        var gameContent = $('#game-content');
        var images = $('#thumbnails').find('li');
        var $d = $game.data;
        var soundCoords = $game.soundCoords;
        var introLength = Math.floor((soundCoords.intro.stop - soundCoords.intro.start) * 10) * 100 - 1000;
        if ($d.sound.hasOwnProperty('introLength')) {
            $d.sound.introLength = parseFloat($d.sound.introLength);
            introLength = $d.sound.introLength * 1000;
        }
        var interval = (introLength / images.length);
        var qIntro = $('#game');

        qIntro.queue('intro', function () {
            $game.playSound('intro', function () {
                //to disable game during intro
            });
            gameContent.addClass('intro-running');
            qIntro.dequeue('intro');

        })
        images.each(function (i, e) {
            qIntro.queue('intro', function () {
                setTimeout(function () {
                    $(e).twinkle().animate({transform: {scale: 1.1}, backgroundColor: purple}, 300, 'linear').animate({transform: {scale: 1}, backgroundColor: '#fff'}, 300, 'linear');
                    qIntro.dequeue('intro');
                }, interval);
            })
        });
        qIntro.queue('intro', function () {
            gameContent.removeClass('intro-running');
            if ($template === '203a')$game.flash($soundButton);
            qIntro.dequeue('intro');
        })
        setTimeout(function () {
            qIntro.dequeue('intro')
        }, 1000);
    }

    function inactivateItems(items, not) {
        not = not || '.solved';
        items.find('li').not(not).addClass('inactive');
    }

    function activateItems(items) {
        items.find('li').removeClass('inactive');
    }

});
