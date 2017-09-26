(function ($) {
    'use strict';
    var game;

    function Game() {
        var intro;
        var initGame, checkWin;
        var build;
        var click;
        var start;
        var _battle = {
            field: undefined,
            fields: undefined
        };
        var _state;
        var _initialized = false;

        var snippets = {
            'text-text': {
                question: function (question) {
                    var $question = $('<div></div>').addClass('question bold');
                    return $question.append($('<h2></h2>').text(question));
                },
                answer: function (text, solution) {
                    var $answer = $('<div></div>').addClass('answer').attr('data-solution', solution);
                    var $checkbox = $('<div class="checkbox"><div class="outer"><div class="inner"></div></div></div>');
                    var $text = $('<div></div>').addClass('text').append(text);
                    return ($answer.append($checkbox).append($text));
                }
            },
            'text-image': {
                question: function (question) {
                    var $question = $('<div></div>').addClass('question bold');
                    return $question.append($('<h2></h2>').text(question));
                },
                answer: function (src, solution) {
                    var $div = $('<div></div>').addClass('answer').attr('data-solution', solution);
                    var $img = $('<img>').attr('src', src);
                    return $div.append($img);
                }
            },
            'sound-image': {
                question: function () {
                    var soundButton = $game.soundButton().on('click', click.sound);

                    if(window.location.host.indexOf("localhost") != -1 && (navigator.appVersion.indexOf("Linux") != -1 || navigator.appVersion.indexOf("X11") != -1) && navigator.appVersion.indexOf("Android") == -1){
                        $game.flash_PATCH(soundButton);
                    }else{
                        $game.flash(soundButton);
                    }
                    return soundButton;
                },
                answer: function (src, solution) {
                    var $div = $('<div></div>').addClass('answer inactive').attr('data-solution', solution);
                    var $img = $('<img>').attr('src', src);
                    return $div.append($img);
                }
            }
        };
        var questions = {

            content: [],
            nCurrent: 0,
            current: undefined,
            nSet: 0,
            nAnswer: 0,

            $html: function () {
                var $title, $id, $answers, question, i, answerArr = [];
                if (questions.type === 'pool') {
                    var nAPP = 3; // Answers per popup
                    if (typeof $game.data.answersPerPopup === 'number') {
                        nAPP = parseInt($game.data.answersPerPopup, 10);
                    }
                    question = this.content[this.nSet];
                    var answer = question.answers[this.nAnswer];
                    var distractors = $.extend(true, [], this.content[this.nSet].distractors.slice(0));
                    var distractor;
                    $id = $('<div></div>').attr('id', question.type);
                    $title = snippets[question.type].question(answer.question);
                    $answers = $('<div></div>').addClass('answers');
                    answerArr.push(snippets[question.type].answer(answer.answer, answer.question));
                    questions.current.title = answer.question;
                    i = 0;
                    while (answerArr.length < nAPP) {
                        var rand = $game.getRandomInt(distractors.length);
                        distractor = distractors[rand];
                        if (distractor.question !== answer.question) {
                            answerArr.push(snippets[question.type].answer(distractor.answer, false));
                            distractors.splice(rand, 1);
                            i += 1;
                        }
                    }
                    answerArr = $game.mixArray(answerArr);
                    for (i = 0; i < answerArr.length; i += 1) {
                        $answers.append(answerArr[i]);
                    }

                    $id.append($title);
                    $id.append($answers);

                } else {
                    question = questions.current;
                    $id = $('<div></div>').attr('id', question.type);
                    $title = snippets[question.type].question(question.title);
                    $answers = $('<div></div>').addClass('answers');
                    question.answers.forEach(function (answer, n) {
                        var solution;
                        if (question.solution === n) {
                            solution = 1;
                        }
                        answerArr.push(snippets[question.type].answer(answer, solution));

//                    $answers.append(snippets[question.type].answer(answer, solution));
                    });
                    answerArr = $game.mixArray(answerArr);

                    for (i = 0; i < answerArr.length; i += 1) {
                        $answers.append(answerArr[i]);
                    }

                    $id.append($title);
                    $id.append($answers);
                }
                return $id;
            },
            removeCurrent: function () {
                if (this.type === 'pool') {
                    this.content[this.nSet].answers.splice(this.nAnswer, 1);
                    if (this.content[this.nSet].answers.length === 0) {
                        this.content.splice(this.nSet, 1);
                    }
                } else {
                    this.content.splice(this.nCurrent, 1);
                    this.nCurrent -= 1;
                }

            },
            next: function () {
                var nSet, nAnswer;
                if (this.type === 'pool') {
                    if ($game.data.random === 'true') {
                        nSet = $game.getRandomInt(this.content.length);
                        nAnswer = $game.getRandomInt(this.content[nSet].answers.length);
                    } else {
                        nSet = this.nSet;
                        nAnswer = this.nAnswer;

                        nSet += 1;
                        nSet = nSet % this.content.length;
                        if (nSet === 0) {
                            nAnswer += 1;
                        }
                        nAnswer = nAnswer % this.content[nSet].answers.length;
                    }
                    console.log(nSet, nAnswer);
                    this.nAnswer = nAnswer;
                    this.nSet = nSet;
                } else {
                    var content = this.content;
                    this.nCurrent += 1;

                    if (this.nCurrent >= content.length) {
                        this.mix();

                    } else {
                        this.current = content[this.nCurrent];
                    }
                }
            },
            mix: function () {
                var i;
                this.content = $game.mixArray(this.content);
                this.nCurrent = 0;
                this.current = this.content[0];

                if (questions.type === 'pool') {
                    for (i in this.content) {
                        if (this.content.hasOwnProperty(i)) {
                            this.content[i].answers = $game.mixArray(this.content[i].answers);
                        }
                    }
                }
            },
            load: (function () {
                var tempContent = [];

                return function (data) {
                    var i, k;
                    var item, question;
                    var answer;
                    var answers;
                    var answer_distractor;
                    if (tempContent.length === 0) {
                        if (data.screen.type === 'pool') {
                            questions.type = 'pool';
                            this.content = data.screen.items;
                            this.content = [];
                            var sets = data.screen.items;
//                        set solved property to false for each item
                            for (i = 0; i < sets.length; i += 1) {
                                answer_distractor = {};
                                answer_distractor.answers = [];
                                answer_distractor.distractors = [];
                                for (item in sets[i]) {
                                    if (sets[i].hasOwnProperty(item)) {
                                        if (item !== 'type') {
                                            answer_distractor.distractors.push($.extend({}, sets[i][item]));
//                                        sets[i][item].solved = false;
                                            answer_distractor.answers.push($.extend({}, sets[i][item]));
                                        } else {
                                            answer_distractor.type = sets[i][item];
                                        }

                                    }
                                }
                                tempContent.push(answer_distractor);
                            }
                        } else {

                            var items = data.screen.items;

                            for (i in items) {
                                if (items.hasOwnProperty(i)) {
                                    item = items[i];
                                    question = {
                                        title: '',
                                        type: '',
                                        answers: [],
                                        solution: '',
                                        size: 0
                                    };
                                    question.type = item.question.type + '-' + item.answers.type;

                                    question.title = item.question.content;
                                    answers = item.answers;
                                    for (i = 0; i < answers.length; i += 1) {
                                        answer = answers[i];
                                        if (answer.solution) {
                                            question.solution = i;
                                        }
                                        if (typeof answer === 'object') {
                                            question.answers.push(answer.content);
                                        } else {
                                            question.answers.push(answer);
                                        }
                                    }
                                    tempContent.push(question);
                                }
                            }
                        }
                    }

                    tempContent = $game.mixArray(tempContent);
                    this.content = $.extend(true, [], tempContent);
                    this.mix();
                    this.nCurrent = 0;
                    this.current = this.content[0];
                };
            }())
        };
        var modal = {
            modal: undefined,
            init: function () {
                var $modal = $('#modal');
                $modal.dialog(
                    {
                        autoOpen: false,
                        draggable: false,
                        width: 'auto',
                        height: 'auto',
                        modal: true,
                        appendTo: '#game',
                        resizable: false,
                        dialogClass: 'question-dialog',
                        closeOnEscape: false,
                        position: {of: "#game"},
                        title: ''
                    }
                );
                $('.ui-dialog-titlebar').remove();
                this.modal = $modal;
            },
            open: function () {
                this.modal.dialog('open');

//  add hover class
                if (!$game.ios) {
                    $(this.modal).find('.answer').hover(function () {
                        $(this).addClass('active');
                    }, function () {
                        $(this).removeClass('active');
                    });
                }

            },
            close: function () {
                this.modal.dialog('close');
            },
            clear: function () {
                this.modal.html('');
            },
            fill: function ($content) {
                this.clear();
                this.modal.append($content);
            }
        };

        var _player = {
            one: undefined,
            two: undefined,
            turn: 1,
            name: {
                1: 'Player 1',
                2: 'Player 2'
            },
            nameP1: 'Player 1',
            nameP2: 'Player 2',
            flash: function () {
                var symbol;
                $game.stopflash();
                if (this.turn === 1) {
                    symbol = this.one.find('.symbol');
                } else {
                    symbol = this.two.find('.symbol');
                }
                
                if(window.location.host.indexOf("localhost") != -1 && (navigator.appVersion.indexOf("Linux") != -1 || navigator.appVersion.indexOf("X11") != -1) && navigator.appVersion.indexOf("Android") == -1){
                    $game.flash_PATCH(symbol, 1.1, 300, true);
                }else{
                    $game.flash(symbol, 1.1, 300, true);
                }
                
                _state = 'playing';

            },
            next: function () {
                this.turn = this.turn === 1 ? 2 : 1;
                var self = this;
                setTimeout(function () {
                    self.flash();
                }, 1000);
                return this.turn;
            },
            setBeginner: function (beginner) {
                this.turn = beginner;
            },
            setNames: function () {
                var player = $('.player');
                var name = '';
                player.each(function (n, el) {
                    name = $(el).find('span').text();
                    if ($(el).attr('id') === 'one') {
                        _player.nameP1 = name;
                        _player.name[1] = name;
                    } else {
                        _player.nameP2 = name;
                        _player.name[2] = name;
                    }
                });
            },
            initNames: function (name1, name2) {
                this.nameP1 = name1;
                this.nameP2 = name2;
                this.name[1] = name1;
                this.name[2] = name2;
            },

            setCustomSymbols: function () {
//                This adds a style attribute in side symbols to overwrite the standard playersymbol definitions
                var playersData = $game.data.screen.players;
                var sym1, sym2;
                sym1 = playersData[0].symbol;
                sym2 = playersData[1].symbol;
                sym1.w = sym1.w || 120;
                sym1.h = sym1.h || 120;
                sym2.w = sym2.w || 120;
                sym2.h = sym2.h || 120;
                if (sym1) {
                    $('.symbol', _player.one).css({
                        'background': 'url('+sym1.content+') no-repeat',
                        'background-size': sym1.w + 'px ' + sym1.h + 'px',
                        'width': sym1.w + 'px',
                        'height': sym1.h + 'px',
                    });
                }
                if (sym2) {
                    $('.symbol', _player.two).css({
                        'background': 'url('+sym2.content+') no-repeat',
                        'background-size': sym2.w + 'px ' + sym2.h + 'px',
                        'width': sym2.w + 'px',
                        'height': sym2.h + 'px',
                    });
                }
            }
        };

        this.init = function () {
            if (_initialized) {
                return;
            }
            _initialized = true;
            _state = 'init';
            modal.init();
            questions.load($game.data);
            initGame();
        };
        this.playIntro = function () {
            if (!_initialized) {
                game.init();
            }
            var interval = 200;
            var delay = 500;
            intro.highlightElements(_battle.fields, interval, delay, function () {
//                $('#start').on('click', click.start);
                $('#reset').on('click', click.reset);
                $('#replay').on('click', click.reset);
                start();
            });
        };
        this.showPlayerScreen = (function showPlayerScreen() {
            return function (cb) {
                var setNames = function () {
                    var p1, p2;
                    p1 = $game.players.player1;
                    p2 = $game.players.player2;

                    _player.initNames(p1, p2);
                    cb();
                };
                $game.root = $('#game');
                $game.selectPlayers(2, setNames, 6, [_player.nameP1, _player.nameP2], 200);
            };
        }());

        function reinitialize() {
            _state = 'init';
            initGame();
            _player.setBeginner(1);
            start();
        }

        initGame = function () {
            questions.load($game.data);
            $game.hidePopup();
            build.layout();

            _player.one = $('#one');
            _player.two = $('#two');
            _player.setCustomSymbols();

            _battle.field = $('#battle-field');
            _battle.fields = _battle.field.find('.field');
        };

        start = function () {
            _battle.fields.on('click', click.field);

//            var scale = 1.1;
//            $game.flash($('#start'), scale);
            click.start();
        };

        click = (function () {

            return {
                start: function () {
                    if (_state === 'playing' || _state === 'finished') {
                        return;
                    }

                    _state = 'playing';
                    _player.setNames();
                    _player.flash();
                    if (!$game.ios) {
                        _battle.fields.hover(function () {
                            $(this).addClass('active');
                        }, function () {
                            $(this).removeClass('active');
                        });
                    }

                },
                reset: function () {
                    game.showPlayerScreen(reinitialize);

                },
                sound: function () {
                    var $soundBtn = $('.sound-button');
                    $soundBtn.addClass('active');
                    $game.playSound(questions.current.title, function () {
                        $soundBtn.removeClass('active');
                        $('.answer').removeClass('inactive');
                    });

                },
                playerInput: function () {
                    $(this).val('');
                },

                modal: (function () {
                    var logic = function () {

                        var selected = _battle.field.find('.selected');

                        if ($(this).data('solution')) {
                            var symbol = $('<div></div>').addClass('symbol player' + _player.turn);
                            var symbolImage = $game.data.screen.players[_player.turn-1].symbol.content;
                            symbol.css({
                                'background': 'url("' + symbolImage + '") no-repeat',
                                'background-size': '90px 90px',
                            });
                            selected.append(symbol);
                            $game.playSound('yes');
                            questions.removeCurrent();
                        } else {
                            selected.addClass('selectable');
                            $game.playSound('no');
                        }
                        var result = checkWin(_player.turn);

                        switch (result) {
                        case 'win':
                            _state = 'solved';
                            $game.stopflash();
                            modal.close();
                            $game.popup({
                                type: "trophy",
                                winner: _player.name[_player.turn],
                                click: reinitialize,
                                delay: 1500
                            });
                            _state = 'finished';
                            return;
                        case 'draw':
                            _state = 'solved';
                            $game.stopflash();
                            modal.close();
                            setTimeout(function () {
//                        same popup but without sound
                                $game.popup({
                                    type: 'trophy',
                                    click: reinitialize
                                });
                            }, 1500);
                            return;
                        }
                        selected.removeClass('selected');
                        _player.next();
                        questions.next();
                        modal.close();
                        _state = 'waiting';
                    };

                    return function () {
                        if ($(this).hasClass('inactive')) {
                            return;
                        }

                        var self = this;
                        if ($game.ios) {
                            $(this).addClass('active');
                            setTimeout(function () {
                                logic.call(self);
                            }, 300);

                        } else {
                            logic.call(self);
                        }
                    };
                }()),

                field: function () {
                    if (_state !== 'playing') {
                        return;
                    }

                    if ($(this).hasClass('selectable')) {
                        $game.stopflash();
                        var $modal = $('#modal');
                        $(this).removeClass('selectable');

                        modal.clear();
                        $modal.append(questions.$html());
                        $(this).addClass('selected');

                        $modal.find('.answer').on('click', click.modal);

                        modal.open();
                    }
                }
            };
        }());
        checkWin = (function () {

            var highlight3inARow = function ($row) {
                var scl = 1.3;
                var i;
                var duration = 400;
                for (i = 0; i < 3; i += 1) {
                    if(window.location.host.indexOf("localhost") != -1 && (navigator.appVersion.indexOf("Linux") != -1 || navigator.appVersion.indexOf("X11") != -1) && navigator.appVersion.indexOf("Android") == -1){
                        
                    } else {
                        $row.animate({transform: {scale: scl}}, {duration: duration / 2}).animate({transform: {scale: 1.0}}, {duration: duration / 2});
                    }
                }
            };

            return function (player) {
                var foundSolution = false;
                var row;
                var $stones;

                ['a', 'b', 'c', 1, 2, 3].forEach(function (el) {
                    var $tmp = _battle.field.find('[id*=' + el + ']').find('.player' + player);
                    if ($tmp.length === 3) {
                        foundSolution = true;
                        row = $tmp;
                    }
                });

                if (!foundSolution) {
                    $stones = _battle.field.find('[id=1a],[id=2b],[id=3c]').find('.player' + player);
                    if ($stones.length === 3) {
                        row = $stones;
                        foundSolution = true;
                    }
                }
                if (!foundSolution) {
                    $stones = _battle.field.find('[id=3a],[id=2b],[id=1c]').find('.player' + player);
                    if ($stones.length === 3) {
                        row = $stones;
                        foundSolution = true;
                    }
                }

                if (foundSolution === true) {
                    highlight3inARow(row);
                    return 'win';
                }

                if (_battle.field.find('[class*=player]').length === 9) {
                    return 'draw';
                }

                return foundSolution;
            };
        }());

        build = {
            layout: function () {
                var $gameContent = $('#game-content');
                $gameContent.html('');
                var $wrapper = $('<div id="wrapper"></div>');
                var $player1 = this.player('one', _player.name[1]);
//                $player1.find('input').one('click', click.playerInput);
                $wrapper.append($player1);
                this.battlefield($wrapper);
                var $player2 = this.player('two', _player.name[2]);
//                $player2.find('input').one('click', click.playerInput);
                $wrapper.append($player2);
                $gameContent.append($wrapper);

                return $gameContent;

            },
            battlefield: function ($_element) {
                var _battleField = $('<div id="battle-field"></div>');

                [1, 2, 3].forEach(function (n) {
                    ['a', 'b', 'c'].forEach(function (k) {
                        var $_field = $('<div class="field selectable"></div>');
                        $_field.attr({id: n + k});
                        _battleField.append($_field);
                    });
                });
                if ($_element) {
                    $_element.append(_battleField);
                }

                return _battleField;
            },

            player: function (id, title) {
                var $player, $placeholder, $title, $name, $inner, $symbol;
                $player = $('<div class="player"></div>');
                $placeholder = $('<div class="placeholder"></div>');
                $title = $('<div class="title"></div>');
                $name = $('<span>').text(title);
                $inner = $('<div class="inner"></div>');
                $symbol = $('<div class="symbol"></div>');

                $player.append($placeholder);
                $placeholder.append($title);
                $placeholder.append($inner);
                $inner.append($symbol);
                $title.append($name);
                $player.attr({id: id});

                return $player;
            }
        };
        intro = {
            highlightElements: function (el, interval, startDelay, callback) {
                _state = 'intro';
                startDelay = startDelay || 500;
                var $d = $game.data;
                var soundCoords = $game.soundCoords;
                var introLength = Math.floor((soundCoords.intro.stop - soundCoords.intro.start) * 10) * 100 - 1000;
                if ($d.sound.hasOwnProperty('introLength')) {
                    $d.sound.introLength = parseFloat($d.sound.introLength);
                    introLength = $d.sound.introLength * 1000;
                }
                interval = introLength / 9;

                var purple = '#FC65FF';
                var qIntro = $('#game');
//                Queue begin
                el.each(function (i, e) {

                    qIntro.queue('intro', function () {
                        $(e).twinkle();
                        $(e).animate({scale: 1.1, backgroundColor: purple, zIndex: 100}, 300, 'linear').animate({scale: 1, backgroundColor: '', zIndex: 0}, 300, 'linear', function () {
                            $(this).attr('style', '');
                        });
                        setTimeout(function () {
                            qIntro.dequeue('intro');
                        }, interval);
                    });

                });

                qIntro.queue('intro', function () {
                    setTimeout(function () {
                        qIntro.dequeue('intro');

                    }, interval);
                });
//              Queue end
//              startQueue
                setTimeout(function () {
                    qIntro.dequeue('intro');
                    $game.playSound('intro', function () {
                        _state = 'intro-end';
                        if (callback) {
                            callback();
                        }
                    });
                }, startDelay);
            }
        };
    }

    game = new Game();

    $game.load(function () {

        var loadFunc = function () {
            game.showPlayerScreen(function () {
                game.init();
                game.playIntro();
            });
        };

        $game.imageScan();
        $game.preloadResources({onComplete: loadFunc});
    });

}(jQuery));
