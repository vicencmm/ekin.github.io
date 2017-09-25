$(function(){

    var $d,$g,$i,$w,$span,numWords,currentWord = 0,timer, fontSize, canPlayPhonem, nPhonems, estilos = [], spanHeight, arrTimeout = [],
        effects = ['pulsate','puff','slide','clip','drop','shake','bounce'];  
    $game.load(function(data){
        $d = data;
        $g = $('#game');
        $i = $('#image');
        $w = $('#word');
        timer = $d.time;
        numWords = $d.words.length;
            
        var configPopup = {
            type: 'start',
            click: function(){
                $game.hidePopup();
                initGame();
            }
        };
        
        /*Preloader*/
        $game.imageScan();
        $game.preloadPopup("start");
        $game.preloadResources({onComplete: function(){
            $game.popup(configPopup);    
        }});

    });

    function initGame(){
        $('#reset').on('click',function(){
            clearSoundQueue();
            setWord(0);
            $('#buttons .nav .button').removeClass("active");
            $('#buttons .nav li:first').addClass("active").siblings('li').removeClass("active");
        });
        clearSoundQueue();
        if(numWords > 1)$game.navigation(numWords,setWord);
        setWord(0);
    }
    
    function clearSoundQueue(){
        for(var x=0;x<arrTimeout.length;x++){
            clearTimeout(arrTimeout[x]);
        }
    }

    function setWord(num){
        canPlayPhonem = false;
        currentWord = num;
        $w.html('');
        $i.html('');
        $span = $('<span>').appendTo($w);
        $($d.words[currentWord].phonem).each(function(n,i){
            $('<b>').html(i.text).attr({'data-sound':i.sound,'data-id':i.id}).appendTo($span);    
        });
        $w.textfill({
            maxFontPixels: 240,
            complete: playPhonems
        });
    }

    function playPhonems(){
        fontSize = $span.css('font-size');
        nPhonems = $span.children('b').length-1;
        spanHeight = $span.height();
        estilos = {'font-size':fontSize,height:spanHeight+'px','line-height':spanHeight+'px','margin-top':($w.height()-spanHeight)/2,'top':0,'left':0};

        playOnePhonem($span.children('b:first'));
    }

    function playOnePhonem($el){
            console.log(estilos);
            var pos = $el.position();
            estilos['top'] = pos.top;
            estilos['left'] = pos.left;
            var clone = $el.clone().css(estilos).appendTo($w);
            clone.prev('.active').removeClass('active');
            var eff = effects[Math.floor(Math.random()*effects.length)];
            var effOpt =  {};
            if(eff == 'slide' || eff == 'clip' || eff == 'drop' ){
                effOpt = {'direction':'right'};
            }
            clone.hide().addClass('clon active').show(eff,effOpt,1000);
            clone.on('click',function(el){
                if(canPlayPhonem){
                    $game.playSound(clone.attr('data-sound'));
                }
            });
            $game.playSound($el.attr('data-sound'),function(){
                arrTimeout.push(
                setTimeout(function(){
                    if($el.index() == nPhonems){
                        endWord();
                    }else{
                        playOnePhonem($el.next('b'));
                    }
                },timer)
                )
            });
    }

    function endWord(){
        var img = new Image();
        canPlayPhonem = true;
        img.src = $d.words[currentWord].image;
        $(img).hide().appendTo($i).on('click',function(){
            $game.playSound($d.words[currentWord].sound);
                });
        $('.clon.active').removeClass('active');
        $game.nextbtn();
        $i.children('img').fadeIn(500);
        $game.playSound($d.words[currentWord].sound);
        if(currentWord == (numWords-1)){
            setTimeout(function(){
                $game.nextbtn();
            },timer);
        }
    }
});