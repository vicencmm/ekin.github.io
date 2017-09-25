$(function(){

    var $g,$m,$i,$d,numScreens,curScreen,curNumScreen,current,solved,arrElem,startAnim = true;   
    $game.load(function(data){
        $d = data;
        
        $g = $('#game');
        $i = $('div.images:first');
        if(typeof $d.screens[1] != 'undefined'){
            numScreens = $d.screens.length;
            $d.screens = $game.shuffle($d.screens); 
        }else{
            numScreens = 1;
        }

        if($d.cluetype != 'text'){
            var cluesound = $game.soundButton();
            cluesound.attr({'id':'cluesound'}).prependTo($g);   
        }

        if(!$d.mode){
            $d.mode = "all";
        }

        if($d.sounds.introLength){
            introLength = $d.sounds.introLength;
        }else{
            introLength = 3000;
        }
        
        /*Preloader*/
        $game.preloadPopup('win,timeup');
        $game.imageScan();
        $game.addResource('img/star.png');
        $game.preloadResources({onComplete: function(){
            initGame();    
        }});
    });

    function reset(){
        $(this).off('click');
        $('#clue').hide();
        $('.nav li:first').addClass('active').siblings('li').removeClass('active');
        $game.timer.reset();
        $("#clueitem").removeAttr('style').html('');
        $("#cluestars").html('');
        $game.stopflash($('#cluesound'));
        //#7799
        $('#cluesound')
                .css({'cursor':'auto'})
                .addClass('inactive');

        setScreen(0);
        $i.find('ul.row li').addClass('inactive');
    }

    function start(){
        $('#replay,#reset').on('click',reset);
        $(this).off('click').addClass('inactive');
        $('#clue').show();
        initClue();
        //$game.stopflash();

        $game.timer.init({
            onElement: $('#progressbar'),
            duration: $game.data.time,
            callback: function(){
                $game.popup({
                    type : 'timeup',
                    click: function(){
                        $('#cluesound,.images li').addClass('inactive');
                        reset();
                    }
                }); 
            }
        });

        $game.timer.start();
        if($d.cluetype == 'text'){
                $(this).addClass('active');
                $i.find('li.inactive').removeClass('inactive');
        }else{
            $game.flash($('#cluesound'));
            $('#cluesound')
                .css({'cursor':'pointer'})
                .removeClass('inactive')
                .on('click',function(e){
                if(!$(this).hasClass('inactive')){
                    $game.disable();
                    $(this).addClass('active');
                    $game.stopflash();
                    $i.find('li.inactive').removeClass('inactive');
                    $game.playSound(curScreen.images[current].sound,function(){
                        $('#cluesound').removeClass('active');
                        $game.enable();
                    });
                }
            });            
        }

        $(this).off('click');
    }

    function initGame(){

        //inicio screen
        if(numScreens > 1)$game.navigation(numScreens,setScreen);
        setScreen(0);
    }

    function setScreen(num){
        curNumScreen = num;

        if(num>0){
            $game.timer.reset();
            $('#cluesound').addClass('inactive');
        }

        curScreen = $d.screens[num];

        selected = null;
        solved = 0;
        $game.hidePopup();
        $i.html('');
        arrElem = [];

        var arrayRows = curScreen.rows.split(',');
        var nRows = arrayRows.length;
        var totalItems = 0;
        for (var i = 0; i < nRows; i++) {
            totalItems += parseInt(arrayRows[i]);
        }

        if((nRows*curScreen.size > $i.height()) || !curScreen.size){
            curScreen.size = Math.floor($i.height()/nRows - 4*nRows);
        }

        var arrImages = [];
        $(curScreen.images).each(function(n,i){
            arrImages.push(i.source);
        });
        
        if($d.pool != 1){
            curScreen.images = $game.shuffle(curScreen.images);
        }
        if($d.pool !=1){
            var total = totalItems;
            var totalAux = totalItems;
            do {
                var salir = true;
                totalAux = total;
                var arrayItems = randomImages(n,i,total);
                for (var x = 0; x < arrayItems.length; x++) {
                    if(arrayItems[x].repeat > 5 || arrayItems[x].repeat == 0){
                        salir = false;
                    }
                    totalAux -= arrayItems[x].repeat;
                    console.log(arrayItems[x].repeat + "---arrayItems[x].repeat");
                }
            }while(salir == false || totalAux != 0);
            for (var w = 0; w < arrayItems.length; w++) {
                arrElem.push(w);
                if($d.pool == 1){
                    for (var x = 0; x < arrayItems[w].repeat; x++) {
                        $i.append(createItem(arrayItems[w].sources[x], arrayItems[w].sound, w, false, true));
                    }
                } else {
                    for (var x = 0; x < arrayItems[w].repeat; x++) {
                        $i.append(createItem(arrayItems[w].source,arrayItems[w].sound,w,false,true));
                    }
                }
            }
        } else {
            $(curScreen.images).each(function(n,i){
                if($d.pool == 1){
                    i.repeat = i.sources.length;
                }else if(n == (curScreen.images.length-1)){
                    i.repeat = totalItems;
                }else{
                    i.repeat = 1+ Math.floor(Math.random()*(totalItems/2));
                    totalItems -= i.repeat;
                }

                arrElem.push(n);
                if($d.pool == 1){
                    for (var x = 0; x < i.repeat; x++) {
                        $i.append(createItem(i.sources[x], i.sound, n, false, true));
                    }
                }else{
                    for (var x = 0; x < i.repeat; x++) {
                        $i.append(createItem(i.source,i.sound,n,false,true));
                    }
                }
                if(totalItems == 0) return false;
            });
        }
        
        unorderImages();  
        if(curScreen.rows){
            createImageRows($i);
        }
        if(startAnim){
            intro();
            $("#start").addClass('disabled');
            startAnim = false;
        }else{
//            initClue();
            $game.flash($('#start'));
            $('#start').on('click',start).removeClass('inactive');
            if($d.cluetype == 'text'){
                $i.find('li.inactive').removeClass('inactive');
            }
        }
    }

    function randomImages(n,i,totalItems) {
        var arrayItems = new Array();
        $(curScreen.images).each(function(n,i){
            if($d.pool == 1){
                i.repeat = i.sources.length;
            }else if(n == (curScreen.images.length-1)){
                i.repeat = totalItems;
            }else{
                do{
                    i.repeat = 1+ Math.floor(Math.random()*(totalItems/2));
                }while(i.repeat > 5);
            }
            totalItems -= i.repeat;
            arrayItems.push(i);
        });
        return arrayItems;
    }

    function unorderImages(){
        var order = [];
        var li = $i.find('li');
        while(li.length){           
            var i = Math.floor(Math.random() * li.length);
            var s = li.splice(i,1);
            order.push(s[0]);
        }
        $(order).each(function(n,l){
            $i.append($(l)); 
        });       
    }

    function createImageRows(ul){
        var rows = curScreen.rows.split(","),
            align = [];
        if(curScreen.align){
            var align = curScreen.align.split(",");
        }

        var li = ul.find('li');
        var c = 0;
        var heightWrap = $i.height(),
            widthWrap = $i.width();
        var marginTB,marginLR;
        var maxN = 0;

            marginTB = Math.floor(((heightWrap/rows.length)-curScreen.size-2)/2);

        $(rows).each(function(n,r){
            r = parseInt(r);
            var nItems = r;

            var d = $('<ul>').addClass("row"); 
            if(align[n] == 'right' || align[n] == 'left'){
                nItems = r + .5;
            }
            if(r > maxN){
                maxN = r;
                marginLR = widthWrap - curScreen.size*nItems - 2*nItems;
                marginLR = Math.floor(marginLR/(2*nItems));
                if(marginLR > 22) marginLR = 22;
            }

            if(align[n] == 'right'){
                d.css({'margin-left':((curScreen.size+2)/2)+marginLR});
            }else if(align[n] == 'left'){
                d.css({'margin-right':((curScreen.size+2)/2)+marginLR});
            }

            
            ul.append(d);
            var l = li.splice(0,r);
            $(l).each(function(n,i){
                d.append($(i));
            });
            $i.find('.row li').css({
                'margin-left':marginLR,
                'margin-right':marginLR,
                'margin-top':marginTB,
                'margin-bottom':marginTB
            });
            c+= r;
        });
    }

    function createItem(src,snd,num,title,source){

        var li = $('<li>').attr('data-num',num);
        
        li.addClass('inactive');
        
        if(src){
            var img = new Image();
            img.src = src;
            img.addEventListener('load',function(){
                $(img).addClass('imgItem').css({width:curScreen.size + "px",height:curScreen.size + "px"}); 
            });
        }
        li.css({width:curScreen.size + "px",height:curScreen.size + "px"});

        var d = $('<div>').data('num',num).data('sound',snd);
        d.append(img);
        li.append(d);
        li.click(selectItem);

        return li;
    }

    function initClue(){
        var i = 0;
        if($d.pool != 1){
            i = Math.floor(Math.random() * arrElem.length);
        }
        current = arrElem[i];
        console.log('initClue',curScreen.images[current].title);
        var elem = '';
        if(curScreen.images[current]){
            if($d.cluetype == 'text'){
                $("#clueitem").css({'padding':'0 10px'});
                elem = curScreen.images[current].title;
            }
            $("#clueitem").html(elem);
            $("#cluestars").html('');
            for(var x = 0; x < curScreen.images[current].repeat; x++){
                $('<li>').addClass('unchecked').appendTo("#cluestars");
            }
            arrElem.splice(i,1);
        }
    }

    function selectItem(event){
        var $li = $(this);
        if(event && !$li.hasClass('inactive')){
            var star;
            
            $game.disable();
            $('#cluesound,.images li').addClass('inactive');
            
            if(!$li.hasClass('clicked') && !$li.hasClass('selected')){//si no está clickeado o ya seleccionado
                $li.addClass('clicked');
                $game.timer.stop();
                console.log('current',current);
                if($li.attr('data-num') == current){//correct
                    solved++;
                    $game.playSound('yes',function(){
                        $game.timer.start();
                        $game.enable();
                        $('#cluesound,.images li').removeClass('inactive');
                        if( $('#cluestars li.unchecked').length == 0 ){//fin del juego
                            checkGame();
                        }
                    });
                    
                    $li.addClass('selected').find('div').fadeOut(500,function(){
                        $li.removeClass('clicked');
			//función para cambiar los items al ser descubiertos
                        //switchItems($li);
                    });
                    star = $('#cluestars li.unchecked').first();
                    star.removeClass('unchecked').addClass('checked');
                    $('#star_effect').clone().show().appendTo(star).effect('puff',800);
                }else{//incorrect
                    $game.playSound('no',function(){
                        $li.removeClass('clicked');
                        $game.timer.start();
                        $game.enable();
                        $('#cluesound,.images li').removeClass('inactive');
                    });
                }
            } else {
                console.log('here!');
                $game.enable();
                $('#cluesound,.images li').removeClass('inactive');
            }
        }
    }
    
    function checkGame(){
        if( $d.mode == 'all'){
            if( $('.images ul.row li').length == solved ){
                $game.timer.stop();
                if( numScreens == 1 || ($('.nav li.active').index()+1) == numScreens ){
                    $game.popup({
                        type : 'win',
                        click: function(){
                            $('#cluesound,.images li').addClass('inactive');
                            reset();
                        }
                    });
                }else{
                    $('.images li').remove();
                    $game.nextbtn();
		    //7201
                    //rajout
                    $('#clue').hide();
                    //fin rajout
                }
            }else{
                initClue();
                if($d.cluetype != 'text'){
                    $('.images li').addClass('inactive');
                    $game.flash($('#cluesound'));
                }
            }
        }else{
            if( curScreen.images[current].repeat == solved ){
                $game.timer.stop();
                if( numScreens == 1 || ($('.nav li.active').index()+1) == numScreens ){
                    $game.popup({
                        type : 'win',
                        click: function(){
                            $('#cluesound,.images li').addClass('inactive');
                            reset();
                        }
                    });
                }else{
                    $('.images li').remove();
                    $game.nextbtn();
                }
            }
        }
    }

    function switchItems($li){
        var $otroli = $('.images li:not(.selected):first');
        if( $otroli.length == 1 && $otroli.parent('ul.row').index() < $li.parent('ul.row').index() ){
            var $liDiv = $li.find('div');
            var $otroliDiv = $otroli.find('div');
            var liNum = $li.attr('data-num');
            var otroLiNum = $otroli.attr('data-num');
            
            $otroliDiv.fadeOut(300,function(){
                $li.html($otroliDiv).removeClass('selected').attr({'data-num':otroLiNum});
                $otroli.html($liDiv).addClass('selected').attr({'data-num':liNum});
                $otroliDiv.fadeIn(300);
            });

        }
        return false;
    }

    function intro(){
        var items = $i.find('li');
        var nItems = items.length;
        var t, soundIntroDur;
        t = setInterval(function(){
            var i = items.first();
            items.splice(0,1);
            if(!i.length){
                clearInterval(t);
                console.log("entro");
                $('#start').on('click',start).removeClass('inactive');
                return;
            }else{
                $game.twinkle(i);
                i.find('div .imgItem').animate({transform:{scale:1.1}},300,'linear').animate({transform:{scale:1}},300,'linear');
            }
        },introLength/nItems);
        $game.playSound("intro");
        $.each($game.data.sound, function(index, val) {
            if(val.id === "intro"){
                soundIntroDur = ((val.stop - val.start) - 1) * 1000;    
            }
        });
        setTimeout(function(){
            $("#start").removeClass('disabled'); 
            $game.flash($('#start'));
        }, soundIntroDur);
        
    }
});