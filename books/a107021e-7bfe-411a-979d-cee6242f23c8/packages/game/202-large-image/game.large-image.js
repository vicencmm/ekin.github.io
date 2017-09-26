$(function(){

    var $g,$m,$i,$d,current,solved,arrElem,pageX,pageY,what = 'click';
    $game.load(function(data){
        $d = data;
        $i = $('#image');
        var $words = $('#words');

        $('#toggle-buttons').on(what,function(e){
            var $words = $('#words');
            if($words.hasClass('hidden')){
                $('span',this).html('Hide words');
            }else{
                $('span',this).html('Show words');
            }
            $words.toggleClass('hidden');
        });

        if($d.sounds.introLength){
            introLength = $d.sounds.introLength;
        }else{
            introLength = 3000;
        }

        var arrImages = [$d.background];
        $($d.images).each(function(n,i){
            arrImages.push(i.source);
        });

        /*Preloader*/
        $game.imageScan();
        $game.preloadResources({onComplete: function(){
            initGame();
            setTimeout(function(){ 
                intro();
                startAnim = false;
            },1000);    
        }});
    });

    function initGame(){
        var $li,
            bg = $('<img/>').attr({'src':$d.background,'id':'bg'}).appendTo($i);
            bg.on('dragstart', function(event) { event.preventDefault(); });
        var ul = $('<ul>').attr('id','words').addClass('items'+$d.images.length);
        if($d.hidewords){
            
            ul.css({'display':'none'});
            $('#toggle-buttons').css({'display':'none'});
            $('#image-wrap').css({'width':'100%'});
        }
        ul.insertAfter('#image-wrap');
        $($d.images).each(function(n,i){
//            createHotspot(n,i);
            var $imgWrap = $('<div>').attr({'data-i':n}).addClass('image').css({left:(parseInt(i.x)-10)+'px',top:(parseInt(i.y)-10)+'px'}).appendTo($i);
            $('<img>').attr({'src':i.source}).addClass('precanvas').appendTo($imgWrap);

            $li = $('<li>').data('i',i).data('sound',i.sound).on(what,clickWord).appendTo(ul);
            $('<span>').html(i.title).appendTo($li);
        });

        var margin = Math.floor( ( $('#image-wrap').height() - ul.outerHeight(true) )/2 );
        ul.css({'margin-top':margin});
    }

    function createHotspot(n,i){
        var $div = $('<canvas>').addClass('canvas').attr({
            'id':'canvas'+n,
            'data-i':n,
            'data-effect':$d.images[n].effect,
        }).appendTo($i);
        var can = document.getElementById('canvas'+n);
            can.style.left = parseInt(i.x)+'px';
            can.style.top  = parseInt(i.y)+'px';
        var ctx = can.getContext('2d');
        var img = new Image();
        img.onload = function() {
            can.width  = (this.width);
            can.height = (this.height);

            ctx.drawImage(img, 0, 0);
        }
        img.src = i.source;
        $div.on(what,clickCanvas);
    }

    function findPos(obj) {
        var curleft = 0, curtop = 0;
        if (obj.offsetParent) {
            do {
                curleft += obj.offsetLeft;
                curtop += obj.offsetTop;
            } while (obj = obj.offsetParent);
            return { x: curleft, y: curtop };
        }
        return undefined;
    }

    function clickCanvas(e){
        var t = this;
        var pos = findPos(t);
        pageX = (!e.pageX)? pageX : e.pageX;
        pageY = (!e.pageY)? pageY : e.pageY;
        var x = pageX - pos.x;
        var y = pageY - pos.y;
        var c = t.getContext('2d');
        var p = c.getImageData(x, y, 1, 1).data[3];
//        console.log('pageX - pos.x: '+pageX + '-' + pos.x);
//        console.log('t: '+p);
        if(p > 127){//click
            $("li").removeClass('sel');
            $(t).addClass('sel');
            $game.disable();
            animation($(t));
            var $li = $('ul#words li:eq('+t.getAttribute('data-i')+')');
            $li.addClass('sel');
            $game.playSound($li.data('sound'),function(){
                $game.enable();
                $('ul#words li:eq('+t.getAttribute('data-i')+')').removeClass('sel');
            });
        }else{
            $(t.previousSibling).trigger(what);
        }
    }
    
    function clickWord(e){
        var $this = $(this);
        if(!$('#words').hasClass('hidden')){
            $game.disable();
            var i = $this.index();
            var $canvas = $("canvas[data-i='"+i+"']");
    
            $canvas.addClass('sel');
            animation($canvas);
            $this.addClass('sel');
            $game.playSound($this.data('sound'),function(){
                $this.removeClass('sel');
                $game.enable();
            });
        }
    }
    
    function animation(el){
        var item = el.parent();
        if(!item.hasClass('ui-effects-wrapper'))
        {
            var n = el.attr('data-effect') || 'swing';
            var t = 800;
            switch(n){ 
            	case 'swing'://mecedora
                    el.animate({transform:{rotate:'20deg'}},t,'easeInOutQuad')
                      .animate({transform:{rotate:'-20deg'}},t,'easeInOutQuad')
                      .animate({transform:{rotate:'20deg'}},t,'easeInOutQuad')
                      .animate({transform:{rotate:'0deg'}},t,'easeInOutQuad');
            	break;
            	case 'zoom':
                    el.animate({transform: {scale: 1.2}}, t)
                      .animate({transform: {scale: 1}}, t)
                      .animate({transform: {scale: 1.2}}, t)
                      .animate({transform: {scale: 1}}, t);
            	break;
            	case 'bounce':
                    el.effect('bounce', t*3);
            	break;
            	case 'shake':
                    el.effect('shake', t*3);
            	break;
            }
        } else {
            console.log("tiene la clase");
        }
    }

    function configDreggable(){
        if($d.drag || $d.config){
            //make pieces draggable
            $('.canvas').each(function(n,p){
                if($d.config){
                    $(p).draggable({containment:$('#image'),revert:false,start:dragStart,stop:dragStop});
                }else{
                    $(p).draggable({containment:$('#image'),revert:placeSelected,start:dragStart,drag:checkPosition});
                }
            });
        }
    }

   function checkPosition(event){
        var jp = $j.position();
        //use mouse position
        jp = $j.offset();
        var x = event.pageX - jp.left;
        var y = event.pageY - jp.top;
        var num;
        if(x < 0 || x > $j.outerWidth() || y < 0 || y > $j.outerHeight()){
            num = -1;
        }else{
            var c = Math.floor(x/$pWidth);
            var r = Math.floor(y/$pHeight);
            num = r * $screen.cols + c;
        }   
        //console.log(x,y,num);
        if(marked!=num && $d.drag){
            $j.find('.marked').removeClass("marked");
            if(num > -1)$j.find('.canvas[data-num=' + num + ']').addClass("marked");
            marked = num;
        }
        return num;
       
   }

    function dragStart(event){
        console.log("dragstart");
        $('.canvas').css('zIndex',299);
        $(this).css('zIndex',300);
    }

    function dragStop(event){
       //show positions of all pieces
       var xml = "";
       $($d.images).each(function(n,pos){
           var p = $('.canvas[data-i="' + n + '"]').first();          
           var pp = p.position();
           
           xml+= "<image x='" + pp.left + "' y='" + pp.top + "'>\n";
           xml+= "\t<source>" + pos.source + "</source>\n";
           xml+= "\t<sound>" + pos.sound + "</sound>\n";
           xml+= "\t<title>" + pos.title + "</title>\n";
           xml+= "</image>\n";
       });
       console.log(xml);
    }


    //Mexican Highlights
    function intro(){
        $game.disable();
        //make items appear
        var items = $i.find('.image');
        var nItems = items.length;
        var t;
        $game.playSound("intro");
        t = setInterval(function(){
            var i = items.first();
            items.splice(0,1);
            if(!i.length){
                clearInterval(t);
                $game.enable();
                configDreggable();
                return;
            }else{
                $game.twinkle(i);
                i.children('img.precanvas').animate({transform:{scale:1.1}},300,'linear').animate({transform:{scale:1}},300,'linear',function(){
                    createHotspot(i.attr('data-i'),$d.images[i.attr('data-i')]);
                    setTimeout(function(){
                        i.remove();
                    },1000);
                });
                // si quieren cambiar el efecto de la intro.
                // i.children('img.precanvas').effect('shake', 800*3).animate({transform:{scale:1}},300,'linear',function(){
                //     createHotspot(i.attr('data-i'),$d.images[i.attr('data-i')]);
                //     setTimeout(function(){
                //         i.remove();
                //     },1000);
                // });               
            }
        },introLength/nItems);
    }
});
