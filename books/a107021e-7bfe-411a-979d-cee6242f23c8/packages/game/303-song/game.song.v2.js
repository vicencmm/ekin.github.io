$(function(){

    var $c,$d,$g,$i,$t,length,duration,curTime,curSpot,curId,arrImages = [],captionTop = 0;
    $game.load(function(data){
        $d = data;
        $g = $('#game');
        $i = $('<div id="images">');
        $t = $('#timebar');
        curTime = 0;
        if(window.location.host.indexOf("localhost") != -1){
            $game.audio.android = 1;
            $game.android = true;
            $game.audio.webaudio = false;
        }
        var $table = $('<table id="wrap-table">').insertBefore($('#player'));
        var $tr = $('<tr>').appendTo($table);

        if($d.withText == 'true'){
            $d.withText = true;

            $('<td id="captions-cell">').append($('#captions-wrapper')).appendTo($tr);
            $('<td>').css({width:25}).appendTo($tr);

            $g.addClass('with-text');
            $c = $('<div id="captions">');

            var $mask = $('<div id="captions-mask">').append($c);
            $('<div id="captions-wrapper">').append($mask).appendTo($('#captions-cell'));
            $('<div id="prev">').insertAfter($mask).on('click',prevSpot);
            $('<div id="next">').insertAfter($mask).on('click',nextSpot);            
        }else{
            $d.withText = false;
        }
        $('<td id="image-cell">').append($i).appendTo($tr);


        $('#go-prev').on('click',prevSpot);
        $('#go-next').on('click',nextSpot);

        $('#play').on('click',play);
        $('#reset').addClass('inactive');

        /*Preloader*/
        $game.imageScan();
        $game.preloadResources({onComplete: function(){           
            duration = ($game.audio.duration)? $game.audio.duration : Math.ceil($game.audio.audioEnd);
            $game.audio.currentTime = 0.1;
            $('#duration .total').html(strtotime(duration));            
            initGame();    
        }});
    });

    function initGame(){
         $('#reset').click(function(event){
             if($(this).hasClass("inactive"))return;
             reset();
         }).addClass("inactive");
        
        //$game.audio.addEventListener("timeupdate", updateProgress);
        window.setInterval(updateProgress,50);

        $t.progressbar({value:0});
        $t.append('<div class="dot">');
        
        $($d.sounds).each(function(n,i){
            var spot = $('<div class="spot">').attr({'data-start':i.start,'data-stop':i.stop,'data-id':i.image});
            spot.css('left',((parseFloat(i.start)/duration)*100)+'%').appendTo($t.parent()).click(clickSpot);
            var img;
            if(jQuery.inArray(i.image,arrImages) === -1){
                var image = new Image();
                image.src = null;
                image.src = i.image;
                arrImages.push(i.image);
                img = $(image).attr('data-id',i.image).appendTo($i);
                if(n == 0){
                    img.addClass('cur').css({'opacity':1});
                }
            }

            if(n == 0){
                curSpot = spot;
                curId = n;
            }
            if($d.withText){
                var verse = $('<div class="verse">').html(i.text).appendTo($c);
                if(i.text == '' && n == 0){
                    verse.hide();
                }
            }
            
        });
    }

    function play(){
        if($(this).hasClass('pause')){//pause
            $t.children('.ui-progressbar-value').stop();
            $game.audio.pause();
            
            //flash
            if($game.useFlash){
              curTime = $game.audio.position;
            }
            
        }else{//play
          
            $t.children('.ui-progressbar-value').animate({'width':'302px'},Math.floor((duration-curTime)*1000),'linear',onEnd);
            $game.audio.play();
            $('#reset').removeClass('inactive');            
        }
        $(this).toggleClass('pause');
    }

    function goTo(time,andPlay){
        curTime = time;

        //flash
        if($game.audio.useFlash){
          $game.audio.position = time;
        }

        console.log("goto",time);

        if(time == 0){
            $('#reset').addClass('inactive');
        }else{
            $('#reset').removeClass('inactive');
        }
        
        $t.children('.ui-progressbar-value').stop()
          .css({width:((curTime/duration)*100)+'%'})
        if(andPlay){
            $t.children('.ui-progressbar-value').animate({'width':'302px'},Math.floor((duration-curTime)*1000),'linear',onEnd);
            $('#play').addClass('pause');
        }else{
            $('#play').removeClass('pause');
        }
       
        $game.audio.pause();
        $game.audio.currentTime = curTime;
        if(andPlay){
            $game.audio.play();
            if($('#reset').hasClass('inactive')){
                $('#reset').removeClass('inactive').off('click').one('click',reset);
            }
        }
    }

    function reset(){
        console.log("reset");
        if(!$('#reset').hasClass('inactive')){
            
            goTo(0,false);
            $('#duration .current').html(strtotime(0));
            curSpot = $('.spot:first');
            curId = curSpot.attr('data-id');

            if($d.withText){
                $c.css({'top':0});
                captionTop = 0;
            }
            
            checkImg();
            $('.verse').removeClass('curVerse');
        }
    }
    
    function checkProgress(){
        if($game.audio.playing)updateProgress();
    }

    function updateProgress(){
        if(!$('#play').hasClass('pause'))return false;
        
        curTime = $game.audio.currentTime || 0;  

        $('#duration .current').html(strtotime(curTime));
        checkSpot();
    }

    function clickSpot(){
        var $this = $(this);
        curSpot = $this;
        curId = curSpot.attr('data-id');
        $('.spot').removeClass('passed');
        $this.siblings(':lt('+$this.index()+')').addClass('passed');
        
        if($('#play').hasClass('pause')){//andando
            goTo($this.attr('data-start'),true);
        }else{
            goTo($this.attr('data-start'));
        }
        if($d.withText){
            var i = curSpot.index()-1;
            
            var curVerse = $('.verse:eq('+i+')');
            if(i>=0){
                var top = -164*Math.floor(i/4);
                $c.css({'top':top});
                captionTop = top;
            }
            curVerse.addClass('curVerse').siblings('.verse').removeClass('curVerse');
        }
        checkImg();
    }

    function prevSpot(){
        if(curSpot.prev('.spot').length > 0){
            curSpot.removeClass('passed');
            curSpot = curSpot.prev('.spot');
            curId = curSpot.attr('data-id');
            curSpot.removeClass('passed');
            if($('#play').hasClass('pause')){//andando
                goTo(curSpot.attr('data-start'),true);
            }else{
                goTo(curSpot.attr('data-start'));
            }
            if($d.withText){
                var i = curSpot.index()-1;
                var curVerse = $('.verse:eq('+i+')');
                var n = ((i)*curVerse.outerHeight(true) + captionTop);                
                if(( n<0 || n>=164 ) && curVerse.css('display') != 'none'){
                    //$c.css({'top':'+=164'});
                    $game.disable();
                    $c.animate({'top':'+=164'},200,function(){
                        captionTop = parseInt($c.css('top')); 
                        $game.enable();
                    });
                }
                curVerse.addClass('curVerse').siblings('.verse').removeClass('curVerse');
            }
            checkImg();
        }
    }

    function nextSpot(){
        if(curSpot.next('.spot').length > 0){
            curSpot.addClass('passed');
            curSpot = curSpot.next('.spot');
            curId = curSpot.attr('data-id');
            if($('#play').hasClass('pause')){//andando
                goTo(curSpot.attr('data-start'),true);
            }else{
                goTo(curSpot.attr('data-start'));
            }
            if($d.withText){
                var i = curSpot.index()-1;
                var curVerse = $('.verse:eq('+i+')');
                var n = ((i)*curVerse.outerHeight(true) + captionTop);                
                if(( n<0 || n>=164 ) && curVerse.css('display') != 'none'){
                    //$c.css({'top':'-=164'});
                    $game.disable();
                    $c.animate({'top':'-=164'},200,function(){
                        captionTop = parseInt($c.css('top'));
                        $game.enable(); 
                    });
                }
                curVerse.addClass('curVerse').siblings('.verse').removeClass('curVerse');
            }
            checkImg();
        }
    }

    function checkSpot(){
        console.log(curSpot.next('.spot').attr('data-start'));
        if((curSpot.next('.spot').attr('data-start') < curTime) && !$d.withText){
            curSpot.addClass('passed');
            if(curSpot.next('.spot').length > 0){
                curSpot = curSpot.next('.spot');
                curId = curSpot.attr('data-id');
            }
            checkImg();
        }else if((curSpot.next('.spot').attr('data-start') <= curTime) && $d.withText){
          
            curSpot.addClass('passed');
            if(curSpot.next('.spot').length > 0){
                curSpot = curSpot.next('.spot');
                curId = curSpot.attr('data-id');
            }
            checkImg();

            var i = curSpot.index()-1;
            var curVerse = $('.verse:eq('+i+')');
                var n = ((i)*curVerse.outerHeight(true) + captionTop);
                
                if(( n<0 || n>=164 ) && curVerse.css('display') != 'none'){
                //$c.css({'top':'-=164'});
                $game.disable();
                $c.animate({'top':'-=164'},200,function(){
                    captionTop = parseInt($c.css('top'));
                    $game.enable(); 
                });
            }
            curVerse.addClass('curVerse').siblings('.verse').removeClass('curVerse');
        }
        else if(curSpot.attr('data-start') == 0 ){
            var i = curSpot.index()-1;
            var curVerse = $('.verse:eq('+i+')');
            //     var n = ((i-1)*curVerse.outerHeight(true) + captionTop);
                
            //     if(( n<0 || n>=164 ) && curVerse.css('display') != 'none'){
            //     //$c.css({'top':'-=164'});
            //     $game.disable();
            //     $c.animate({'top':'-=164'},200,function(){
            //         captionTop = parseInt($c.css('top'));
            //         $game.enable(); 
            //     });
            // }
            curVerse.addClass('curVerse');
        }
        else if((curSpot.attr('data-start') <= curTime) && $d.withText && (curSpot.index()-1) == 0){
            var i = curSpot.index()-1;
            console.log(i);
            curSpot.addClass('passed');
            if(curSpot.length > 0){
                curSpot = curSpot;
                curId = curSpot.attr('data-id');
            }
            checkImg();

            
            var curVerse = $('.verse:eq('+i+')');
                var n = ((i)*curVerse.outerHeight(true) + captionTop);
                
                if(( n<0 || n>=164 ) && curVerse.css('display') != 'none'){
                //$c.css({'top':'-=164'});
                $game.disable();
                $c.animate({'top':'-=164'},200,function(){
                    captionTop = parseInt($c.css('top'));
                    $game.enable(); 
                });
            }
            curVerse.addClass('curVerse');
        }
    } 

    function checkImg(){
        if($("img.cur").attr('data-id') != curId){
            $("img.cur").removeClass('cur');
            $i.children("img[data-id='"+curId+"']").addClass('cur');
        }
    }

    function strtotime(str){
        var aux = str/60,
            sec = Math.floor((aux%1)*60);
        if(sec < 10) sec = '0'+sec;
        return Math.floor(aux) + ':' + sec;
    }

    function onEnd(){
        $('#play').click();
        reset();
//        if($('#duration .current').text() != $('#duration .total').text()){
//           $('#duration .total').text($('#duration .current').text()); 
//        }
    }

});