    $(function(){

    var $d,$g,$sp,$pb,level,complete,card, cards = [], cantPlayers, curPlayer, curStars,firstIntro = true;  
    $game.load(function(data){
        $d = data;
        if($d.level == 'easy'){
            $game.addResource('img/back_easy.jpg');
        }else{
            $game.addResource('img/back.jpg');
        }

        $g = $('#game');
        $np = $('#num-players');
        $sp = $('#select-players');
        $pb = $('#progressbar');

        switch ($d.level){ 
        	case 'veryeasy':
                level = 4;
        	break;
            case 'easy':
                level = 6;
        	break;
        	case 'medium':
                level = 8;
        	break;
        	default:
                level = 9;
        }
        $g.addClass($d.level);

        if($d.sounds.introLength){
            introLength = $d.sounds.introLength;
        }else{
            introLength = 3000;
        }

        $game.addResource('img/numplayers.jpg');
        $game.addResource('img/numplayersL5.jpg');
        $game.addResource('img/bg_player.png');
        $game.preloadResources({
            requireAudio:false,
            onComplete:function(){
                var npbg = '';
                if ($d.oneTwoPlayer !== undefined) {
                    npbg = $d.oneTwoPlayer.background;
                } else {
                    npbg = 'img/numplayers.jpg';
                }
                if($d.oneTwoPlayer.textBackground){
                    $np.prepend('<h1 style="text-align: left; margin: 10px">' + $d.oneTwoPlayer.textBackground  + '</h1>');    
                    $np.children('div').css({'background': 'url('+npbg+') 0 -51px no-repeat'});
                    $np.children('.twoplayers').css({'background-position': '-216px -51px'});
                }
                else{
                    $np.children('div').css({'background': 'url('+npbg+') 0 0 no-repeat'});
                    $np.children('.twoplayers').css({'background-position': '-216px 0'});
                }

                $('#replay').on('click',function(){
                    $game.hidePopup();
                    reset();
                });                
                $('#startgame').one('click',startGame);
                $np.children('div').one('click',setPlayers);
            }
        });
    });

    /*players screen*/
    function setPlayers(){

        var nPlayers = $(this).attr('data-n-player');
        cantPlayers = nPlayers;
        if(nPlayers == 1){
            $sp.fadeOut(0);
            startGame();
        }else{
            $game.selectPlayers(2, startGame, 6, ['Player 1', 'Player 2'], 200);
        }
        $np.fadeOut(300);
    }

    function reset(){
        $game.stopflash();
        $np.fadeIn(300,function(){
            $np.children('div').off('click').one('click',setPlayers);
//            $('#startgame').off('click').one('click',initGame);
            $('.cards,.stars').html('');
            $('#answers').off('click').removeClass('disabled');
//            $sp.css({'background-image':'url('+spbackground()+')'});
//            $sp.fadeIn(300);
        });
    }

    function startGame(){
//        $sp.css({'background-image':'none'});
        $game.imageScan();
        $game.preloadPopup('trophy,win');
        $game.addResource('img/timer_bar.png');
        $game.addResource('img/star.png');
        $game.preloadResources({onComplete: function(){   
            initGame();
        }});
    }

    function initGame(){
        var name;
        card = [];
        //cantPlayers = 0;
        curPlayer = 1;
        complete = level;   

        cards = $game.getRandom($d.images,level);
        var card2;
        for(var x = 0; x < level; x++){
            card2 = jQuery.extend(true, {}, cards[x]);
            card2.txt = 1;
            cards.push(card2);
        }
        cards = $game.shuffle(cards);
        
        //console.log('cards.length:',cards.length);
        for(var x = 0; x < cards.length; x++){

            var $card = $('<div class="back">')
                .attr({'data-id':cards[x].sound})
                .attr({'data-title':cards[x].title})
                .attr({'data-source':cards[x].source})
                .addClass('blocked');
            if($d.mode == 'text'){
                if(cards[x].txt == 1){
                    $card.attr({'data-source':''});
                }
            }
            if(level==8){
                if(x==0){
                    $card.css({'margin-left':160});   
                }else if(x==3){
                    $card.css({'margin-right':160});
                }
            }
            $card.appendTo('.cards').on('click',clickCard);
        }

        //console.log('cantPlayers: ',cantPlayers);
        if(cantPlayers == 2){
            cantPlayers = 2;
            $('#player1,#player2').show();
            
            $('#player1 .name').html( $game.players['player1'] );
            $('#player2 .name').html( $game.players['player2'] );
            
        }else{
            cantPlayers == 1;
            $('#player1,#player2').hide();
        }
        
//        $sp.hide('fade',300,function(el){
            intro();
            $('.player-name').remove();
//        });
    }

    function start(){
        if(cantPlayers>1){
//                        (el, scale, time, noClick, num, force)
            $game.flash($('#player'+curPlayer),1.05,300,true,undefined,true);
        }
        $('.blocked').removeClass('blocked');
        $('#reset').off('click').one('click',reset);
        $('#answers').off('click').one('click',showAnswers);
    }

    function clickCard(){
        var $this = $(this);
        if(!$this.hasClass('front') && !$this.hasClass('blocked') && $('#game-lock').length == 0){
            $this.addClass('blocked');
            if(typeof card[0] != 'undefined'){
                $this.siblings().addClass('blocked');
            }

            var $parent = $this.parent('.cards'); 
            if($this.css('position') == 'relative'){
                $parent.css({'height':$parent.height()});
                $parent.children('.back').each(function(){
                    var pos = $(this).position();
                    $(this).css({'top':pos.top,'left':pos.left});
                });
                $parent.children('.back').css({position:'absolute'});
            }
            showCard($this,false);
        }
    }

    function showCard($this,answers){
        $game.disable();
        
        var n = 0
        if(typeof card[0] == 'undefined'){
            n=0;
        }else{
            n=1;
        }
        card[n] = $this.attr('data-id');

        if($d.mode == 'text' && $this.attr('data-source')==''){
            var img = $('<span>').html( $this.attr('data-title') );
        }else{
            var img = new Image();
            img.src = $this.attr('data-source');

            if ($d.fullcard == "1"){
                $(img).addClass("fullcard");
            }
        }
        $this
        .animate({transform:{
            scaleX:0
        }
        },400,'easeOutExpo',function(){
            var $curCard = $('<div class="current-card">').append(img).appendTo($this);
            $this.toggleClass('back front')
            .animate({transform:{
                scaleX:1
            }
            },400,'easeOutExpo',function(){
                if(!answers){
                    if(n==1){
                        $game.audio.playSound($this.attr('data-id'),function(){
                            checkCards();
                        });
                        
                    }else{
                         $game.audio.playSound($this.attr('data-id'),function(){
                            $game.enable();
                        });
                    }
                }
            });
        });
    }

    function hideCards(){
        var total = $('.front').length;
        $('.front').each(function(index){
            var $this = $(this);
            $this
            .animate({transform:{
                scaleX:0
            }},400,'easeOutExpo',function(){
                $this.html('').toggleClass('back front');
                try {
                  $this.animate({transform:{
                      scaleX:1
                  }},400,'easeOutExpo',function(){
                      $('.blocked').removeClass('blocked');
                      if (index === total - 1) {
                            $game.enable();  
                      }
                      
                  });
                } catch (e) {
                  console.log('error ocultando carta',e);
                  $this.css({'transform':'rotate(0deg) scale(1, 1) scaleY(1) scaleX(1)'});
                  $('.blocked').removeClass('blocked');
                }
            });
        });
    }

    function checkCards(){
        if(card[0] == card[1]){//iguales
            curStars = $('#player'+curPlayer+' .stars');
            $('<div class="star">').hide().appendTo(curStars).show('puff',300);
            $game.audio.playSound('yes',function(){               
                $('.front').hide('drop', 500, function(){
                    $(this).remove();
                    $('.blocked').removeClass('blocked');
                    $game.enable();
                });
                card = [];
                changePlayer();
                complete--;
                if(complete == 0){
                    finishGame();       
                }

            });
        }else{//distintos
            $game.audio.playSound('no', function(){
              hideCards();
              card = [];
              changePlayer();
            });
        }
    }

    function changePlayer(){
        $game.stopflash($('#player'+curPlayer),1.05,300,true);
        if(curPlayer == 1 && cantPlayers == 2){
            curPlayer = 2;
        }else{
            curPlayer = 1;
        }
        if(cantPlayers>1){
            $game.flash($('#player'+curPlayer),1.05,300,true,undefined,true);
        }
    }

    function finishGame(){
        var stars1 = $('#player1 .star').length,
            stars2 = $('#player2 .star').length;
        var winner = false;

        if((stars1 > stars2) || cantPlayers == 1){
            winner = $('#player1 .name').html();
        }else if(stars1 < stars2){
            winner = $('#player2 .name').html();
        }
        if(cantPlayers == 1){
            $game.popup({
                type: 'win',
                click: function(){
                    reset();
                }
            });  
        }else{
            $game.popup({
                type: 'trophy',
                winner: winner,
                click: function(){
                    reset();
                }
            });
        }
    }

    function showAnswers(){
        $(this).addClass('disabled');
        $game.stopflash();
        
        //#7561
        var $cardsBack = $('.cards .back');
        $cardsBack.each(function(){
                showCard($(this),true);
        });
        $game.enable();
    }

    function intro(){
        $game.disable();
        var iLenght = ($game.getSound("intro").stop - $game.getSound("intro").start)*1000;
        if(iLenght > 0){
          introLength = Math.ceil(iLenght); 
        }
        if(firstIntro){
            firstIntro = false;
            var items = $g.find('.cards .back');
            var nItems = items.length;
            var t;
            $game.playSound("intro",function(){
              $game.enable();
            });
            t = setInterval(function(){
                var i = items.first();
                items.splice(0,1);
                if(!i.length){
                    clearInterval(t);
                    start();
                    return;
                }else{
                    $game.twinkle(i);
                    i.animate({transform:{scale:1.1}},300,'linear').animate({transform:{scale:1}},300,'linear');
                }
            },introLength/nItems);
        }else{
            start();
            $game.enable();
        }
    }
});