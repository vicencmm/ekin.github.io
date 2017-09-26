$(function(){

    var $d,$g,$sp,$sb,$pb,loopCard,level,players,card = new Array(2),matchProb = 0,firstIntro = true, timerLength, what, lastImageMatched;
    $game.load(function(data){
        $d = data;
        $g = $('#game');
//        $np = $('#num-players');
//        $sp = $('#select-players');
        $pb = $('#progressbar');
        $sb = $('.snap-button');

        //touch devices hack
        //what = (('ontouchstart' in window) || (window.DocumentTouch && document instanceof DocumentTouch)) ? 'touchstart' : 'click';
        what = 'touchstart click';

        if($d.sounds.timerLength){
            timerLength = $d.sounds.timerLength;
        }else{
            timerLength = 3000;
        }

        switch ($d.level){
        	case 'easy':
                level = 1;
        	break;
        	case 'medium':
                level = 1.5;
        	break;
        	default:
                level = 2;
        }

        $game.preloadResources({
            requireAudio:false,
            onComplete:function(){
//                $sp.css({'background-image':'url('+spbackground()+')'});
//                setPlayers();

                $game.selectPlayers(2, startGame, 11, ['Player 1', 'Player 2'], 200);

                $('#startgame').one('click',startGame);
                $('#reset').on('click',reset);
                $sb.on(what,clickSnap);
            }
        });
    });


    function startGame(){
//        $sp.css({'background-image':'none'});
        $game.imageScan();
        $game.preloadPopup('trophy');
        $game.addResource('img/snap.jpg');
        $game.preloadResources({onComplete: function(){
            initGame();
        }});
    }

    function reset(){
//        $sp.css({'background-image':'url('+spbackground()+')'})
//           .fadeIn(300,function(){
            $('#startgame').one('click',initGame);
            stopLoop();
            $('.cards,.stars').html('');
//        });
        $game.selectPlayers(2, startGame, 11, ['Player 1', 'Player 2'], 200);
    }

    function initGame(){
        var name;
        if($d.cardTime < 2) $d.cardTime = 2;
        var cont = 0;

        $d.images = $game.shuffle($d.images);
        lastImageMatched = 0;

        $('.cards').append('<div class="back">').append('<div class="front">');

        $('#player1 .name').html( $game.players['player1'] );
        $('#player2 .name').html( $game.players['player2'] );

        $('.stars').each(function(){
            for(var n = 0;n < 12; n++){
                $(this).append('<div class="backstar">');
            }
        });

//        $sp.fadeOut(300,function(el){
            intro();
            $('#start').removeClass('inactive').on('click',startLoop);
//        });
    }

    function startLoop(){
        $('#start').off('click').addClass('inactive');
        stopLoop();
        loopCard = setInterval(function(){
        showCard();

        },$d.cardTime*1000);
    }

    function stopLoop(){
        clearInterval(loopCard);
    }

    function showCard(){
        $sb.addClass('blocked');
        $('.back').each(function(n,el){
            var $this = $(el);
            var offset = $this.position();

            if(matchProb >= 1){
                card[n] = lastImageMatched;
                if(n == 1){
                    lastImageMatched++;
                    if(lastImageMatched >= $d.images.length){
                       lastImageMatched = 0; 
                    }
                }
            }else{
                card[n] = Math.floor(Math.random()*$d.images.length);
            }

            if($d.mode == 'text' && n == 1){
                var img = $('<span>').html($d.images[card[n]].title);
            }else{
                var img = new Image();
                img.src = $d.images[card[n]].source;
            }

            var $clon = $this.clone().addClass('clon').css({'position':'absolute','top':offset.top,'left':offset.left}).insertAfter($this);

            //var despl = ( $this.parents('.wrapper-player').attr('id') == 'player1')? 204 : -204;
            var despl = (n == 0)? 204 : -204;

            if(n == 1)$game.playSound('deal');
            if(navigator.appVersion.indexOf("Linux") != -1 || navigator.appVersion.indexOf("X11") != -1 || navigator.appVersion.indexOf("rv:11.0") != -1 ){
		    console.log(navigator.appVersion);
            $clon.animate({left: "+="+despl},300,function(){
	                $clon.siblings('.clon,.front').remove();
	            })
	            .transition({
	                perspective: '800px',
	                rotateY: '90deg'
	            },400,'easeInExpo',function(){
	                $sb.removeClass('blocked');
	                var $curCard = $('<div class="current-card">').append(img).appendTo($clon);

	                if ($d.fullcard == "1"){
	                    $curCard.addClass("fullcard");
	                }

	                $clon.removeClass('back').addClass('front').transition({
	                    perspective: '800px',
	                    rotateY: '0deg'
	            },100,'easeOutExpo',function(){
	                    $clon.removeClass('clon');
	                });
	            });
	    }
	    else{
	    $clon.transition({x: despl},300,function(){
                $clon.siblings('.clon,.front').remove();
            })
            .transition({
                perspective: '800px',
                rotateY: '90deg'
            },400,'easeInExpo',function(){
                $sb.removeClass('blocked');
                var $curCard = $('<div class="current-card">').append(img).appendTo($clon);

                if ($d.fullcard == "1"){
                    $curCard.addClass("fullcard");
                }

                $clon.removeClass('back').addClass('front').transition({
                    perspective: '800px',
                    rotateY: '0deg'
            },300,'easeOutExpo',function(){
                    $clon.removeClass('clon');
                });
            });
	    }
            if(n == 1)return false;
        });
        if(card[0] == card[1]){//iguales
            matchProb = 0;
        }else{//distintos
            matchProb =  matchProb + Math.random()*(1/level);
        }
    }

    function clickSnap(e){
        e.stopPropagation();
        var $this = $(this);
        if(!$this.hasClass('blocked')){
            $sb.addClass('blocked');
            $game.disable();
            var timeLeft = $d.time*$pb.children('div').width()/$pb.width();
            stopLoop();
            if(card[0] == card[1]){//iguales
                var idPlayer = $this.attr('data-player');
                var curStar = $('#player'+idPlayer+' .stars .backstar:first'),
                    starPos = curStar.position();

                $('<div>').addClass('star').css({'display':'none','left':starPos.left,'top':starPos.top}).appendTo('#player'+idPlayer+' .stars').show('puff');
                curStar.removeClass('backstar');

                $game.playSound('yes'+','+$d.images[card[0]].sound,function(){
                    if( curStar = $('#player'+idPlayer+' .stars .backstar').length == 0){
                        endGame(idPlayer);
                    }else{
                        $game.flash($('#start'));
                        $('#start').removeClass('inactive').on('click',startLoop);
                    }
                    $game.enable();
                });
            }else{
                $game.playSound('no',function(){
                    $game.enable();
                    startLoop();
                });
            }
        }
    }

    function intro(){
        $game.disable();
        $("#start").addClass('disabled');
        if(firstIntro){
            firstIntro = false;
            var items = $g.find('.cards .back, .snap-button');
            var nItems = items.length;
            var t, soundIntroDur;
            $game.playSound("intro");
            t = setInterval(function(){
                var i = items.first();
                items.splice(0,1);
                if(!i.length){
                    clearInterval(t);
                    $game.enable();
                    return;
                }else{
                    $game.twinkle(i);
		    if(window.location.host.indexOf("localhost") != -1 && (navigator.appVersion.indexOf("Linux") != -1 || navigator.appVersion.indexOf("X11") != -1)){
		    	i.animate(300,'linear').animate(300,'linear');
		    } else {
                i.animate({transform:{scale:1.1}},300,'linear').animate({transform:{scale:1}},300,'linear');
            }
		}
            },timerLength/nItems);
            $.each($game.data.sound, function(index, val) {
                if(val.id === "intro"){
                    soundIntroDur = ((val.stop - val.start)) * 1000;    
                }
            });
            setTimeout(function(){
                $("#start").removeClass('disabled'); 
                $game.flash($('#start'));
            }, soundIntroDur);
        }else{
            $game.enable();
            $("#start").removeClass('disabled');
            $game.flash($('#start'));
        }
    }

    function endGame(winner){
        if(winner == 1){
            var winner = $('#player1 .name').html();
        }else{
            var winner = $('#player2 .name').html();
        }
        $game.popup({
            type: 'trophy',
            winner: winner,
            click: function(){
                reset();
            }
        });
    }

});
