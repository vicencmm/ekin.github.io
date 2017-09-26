$(function(){
   
   var $g,$c,$m,$i,$d,$size,selected,solved,labelled,$soundButton,$currentSound,purple,$loadTimer,$audioLoaded,$imgLoaded,$imgTotal;   
   
   $game.load(function(){
       $d = $game.data;      
       $g = $('#game').first();
       $c = $('#game-content').first().html('');       
       if(!$d.position)$d.position = "relative";
       if(!$d.listsize)$d.listsize = 354;        
       purple = '#fcd9f6';
       $('#reset').click(resetGame);
       $('#solve').click(solveGame);
       $('#replay').click(resetGame);
       
       //preload game
       $($d.image).each(function(n,i){
           $game.addResource(i.source);
           $game.addResource(i.match);
       });
       $game.preloadPopup("win");       
       $game.preloadResources({onResources:initGame,onComplete:startGame});       
   });   
   
   $.fn.containerSize = function(){       
       var h = 0;       
       var w = 0;
       this.children().each(function(n,c){           
           var e = $(c).position().top + $(c).outerHeight();
           var f = $(c).position().left + $(c).outerWidth();
           if(e > h)h = e;
           if(f > w)w = f;           
       });
       return {height:h,width:w};
   }
   
   $.fn.activate = function(){
       
       return this.each(function(){
          $(this).css({opacity:1,cursor:'pointer'});
          $(this).removeClass("inactive");
       });
       
   }
   
   $.fn.deactivate = function(){
       
       return this.each(function(){
          $(this).css({opacity:1,cursor:'default'});
          $(this).addClass("inactive");
       });
       
   }
   
   function loadImages(){
       
       var img = [];       
       $($d.image).each(function(n,i){
           img.push(i.source);
           img.push(i.match);
           
       });
       $imgTotal = img.length;
       $imgLoaded = 0;
       //now load the images
       $(img).each(function(n,i){
          var li = new Image();
          li.onload = function(){
              $imgLoaded++;
              console.log($imgLoaded);
          }
          li.src = i;
       });
   }
   
   function checkLoaded(){
       console.log("checkloaded");
       if($audioLoaded && $imgLoaded == $imgTotal){
           clearInterval($loadTimer);
           initGame();
           var s = $g.find('.preload .status').first();
           s.html('Finished loading');
           
           
           setTimeout(function(){
               $g.find('.preload').remove();
               startGame();
           },1000);
           
       }
   }
 
   function startGame(){
      highlightItems();
   }
   
   function highlightItems(){
      //make items appear
      var items = $i.find('li');      
      var t;
      $game.playSound("intro",function(){
          //do nothing... just a callback to disable game
          $m.find('li').deactivate();
          if($soundButton){
                $i.find('li').deactivate();
                $game.flash($soundButton);
          }   
      });
      t = setInterval(function(){
          var i = items.first();
          items.splice(0,1);
          if(!i.length){
              clearInterval(t);
              setTimeout(function(){
                  highlightTargets();
              },1000);
              return;
          }else{
              $game.twinkle(i);      
              i.css({backgroundColor:'#fff'});              
              i.animate({transform:{scale:1.1},backgroundColor:purple},300,'linear').animate({transform:{scale:1},backgroundColor:'#fff'},300,'linear');           
          }          
      },100);
   }
   
   function highlightTargets(){
      //make items appear
      var items = $m.find('li');      
      var t;
      
      t = setInterval(function(){
          var i = items.first();
          items.splice(0,1);
          if(!i.length){
              clearInterval(t);
              
              return;
          }else{
              $game.twinkle(i);                
              i.animate({transform:{scale:1.1},backgroundColor:purple},300,'linear').animate({transform:{scale:1},backgroundColor:'#fff'},300,'linear');                      
          }          
      },100);
   }
   
   function resetGame(event){
       initGame();
       $('#solve').removeClass("disabled");
       $m.find('li').deactivate();
       if($soundButton){
             $i.find('li').deactivate();
             $game.flash($soundButton);
       } 
   }
  
   function initGame(event){       
      if(!$d.size)$d.size = 120;
      if(!$d.cols)$d.cols = 3;    
      $d.textsize = Math.round(($d.size/120) * 10) + 10;
      selected = null;
      solved = 0;
      $game.clear();
      //set content height      
      var ch = $('#game #buttons').position().top - $c.position().top - 20 - parseInt($c.css('marginTop'));
      var sep = $('<div>').addClass("separator");
      $c.append(sep);
      $c.css({height:ch + "px"});
     
      //add sound button if applicable
      if($d.soundbutton){
          var h = $('#game').find('h1').first();
          h.find('div.sound-icon,div.sound-button').remove();
          $soundButton = $game.soundButton();
          h.prepend($soundButton); 
          $soundButton.click(function(event){
              $(this).addClass("active");
              setTimeout(function(){
                  $soundButton.removeClass("active");
              },1000);
              
          });
          $soundButton.click(playNextSound);
      }
      //create lists
      $i = $('<ul>').addClass("images").attr('data-highlight','1:li');
      $c.append($i);
      
      $m = $('<ul>').addClass("matches").attr('data-highlight','2:div.target');
      $c.append($m);   
      if($d.position=="absolute"){
          $i.addClass("positioned");
          $m.addClass("positioned");
      }
      if($d.image)$d.images = $d.image;
      $($d.images).each(function(n,i){               
         $i.append(createItem(i.source,i.sound,n,false,true));
         var t = (i.title)?i.title:false;
         $m.append(createItem(i.match,i.sound,n,t));
         if($d.position == "absolute"){
             var il = $i.find('li').last();
             var ml = $m.find('li').last();
             var x = (i.x)?i.x:0;
             var y = (i.y)?i.y:0;
             il.css({position:"absolute",left:x + "px",top: y + "px"});
             ml.css({position:"absolute",left:x + "px",top: y + "px"});
         }
      });      
      if(labelled){
          $m.addClass("labelled");
          $i.addClass("labelled");
      }
      
      unorderList($i);
      unorderList($m);

      if($d.rows && $d.position!="absolute"){
          createImageRows($i);         
          createImageRows($m);
          if($d.listsize < 354){
            //correct list position
            var m = 0.5 * (354 - $d.listsize);
            $i.css({left:m + "px"});
            $m.css({right:m + "px"});
          }
      }    
      //vertically center the lists
      var ih;
      if($d.position=="absolute"){
          var size = $i.containerSize();
          ih = size.height;
          $i.css({width:size.width + "px"});
          $m.css({width:size.width + "px"});
          //align lists
          if(size.width < 354){
              var m = 0.5 * (354 - size.width);
              $i.css({left:m + "px"});
              $m.css({right:m + "px"});
          }
      }else{
          ih = $i.outerHeight();
      }      
      var mt = 0.5 * (ch - ih);
      $i.css({position:"relative",top:mt + "px"});
      $m.css({position:"relative",top:mt + "px"});
      if(labelled && !$soundButton){
          $('#solve').show();
      }else{
          $('#solve').hide();
      }
      
   }
   
   function playNextSound(){
       if(!$currentSound){
           var s = $i.find('div.source');
           var n = Math.floor(Math.random() * s.length);
           var d = $(s.get(n));
           $currentSound = d.data('sound');
       }
       
       // play sound and then active items
       $game.playSound($currentSound, function(){
          $i.find('li').not('.empty').activate();
       });
   }   
   
   function unorderList(ul){
       var order = [];
       var li = ul.find('li');
       while(li.length){           
           var i = Math.floor(Math.random() * li.length);
           var s = li.splice(i,1);
           order.push(s[0]);
       }
       $(order).each(function(n,l){
          ul.append($(l)); 
       });       
   }
   
   function createImageRows(ul){
       var rows = $d.rows.split(",");
       var li = ul.find('li');
       var c = 0;
       $(rows).each(function(n,r){
          r = parseInt(r);
          var d = $('<ul>').addClass("row");
          ul.append(d);
          //console.log(r);
          var l = li.splice(0,r);          
          $(l).each(function(n,i){            
             d.append($(i)); 
          });          
          c+= r;
       });  
       if(li.length){
          var d = $('<ul>').addClass("row");
          ul.append(d);
          $(li).each(function(n,i){            
             d.append($(i)); 
          });
       }  
       //justify list items
       //first determine max items and max width
       var mw = 0;
       var mi = 0;
       ul.find('ul').each(function(n,u){
          var li = $(u).find('li');
          var tw = 0;
          li.each(function(n,l){
              tw += $(l).outerWidth();
          });
          if(li.length>mi)mi = li.length;
          if(tw > mw)mw = tw;
       });
       //now determine margin and set it on all items
       if($d.listsize){
           ul.css({width:$d.listsize + "px"});
       }
       
       var rw = ul.outerWidth() - mw;
       var m = (rw/(mi-1))/2;
       
       ul.find('ul').each(function(n,u){
          var li = $(u).find('li');
          li.css({marginLeft:m + "px",marginRight:m + "px"});                    
          li.first().css({marginLeft:"0px"});
          li.last().css({marginRight:"0px"});
       });
   }   
   
   function createItem(src,snd,num,title,source){
       var li = $('<li>').attr('data-num',num);   
       if(src){
           var img = $('<img>').attr('src',src);
           img.css({width:$d.size + "px",height:$d.size + "px"});
       }       
       li.css({width:$d.size + "px",height:$d.size + "px"});       
       if(source){
           var d = $('<div>').data('num',num).addClass("source").data('sound',snd);
           d.append(img);
           d.css({width:$d.size + "px",height:$d.size + "px"});
           li.append(d);
           li.click(selectItem);
           if(!$soundButton){
               d.click(function(event){
                    $game.playSound($(this).data('sound'));
               });
           }
           
       }else{         
           var t = $('<div>').addClass("target");
           t.css({width:$d.size + "px",height:$d.size + "px"});    
           li.append(t);
           if(img){
               t.append(img);
               
           }else{
               //show sound button
               var sb = $('<div>').addClass('sound');
               //t.append(sb);
           }
           li.data('sound',snd);
           li.click(placeItem);
           li.addClass("match");           
       }    
       if(title){
           var l = $('<label>').html(title);
           li.append(l);
           var w = $d.size + 20;
           var left = "-7";           
           l.css({left:left + "px",top:t + "px",width:w + "px",fontSize:$d.textsize + "px"});
           labelled = true;
       }
       return li;
   }
   
   function selectItem(event){
       if(event && $(this).hasClass("inactive") && $soundButton)return;
       $i.find('li.selected').removeClass("selected"); 
       selected = null;
       if(event){
           var d = $(this).find('div.source');
           if(!d.length)return;           
           if($soundButton){
                var snd = $(this).find('.source').data('sound');
                if(snd!=$currentSound){
                    $game.playSound("no");
                    return;
                    //$game.flash($soundButton);
                    //$i.find('li:not(.empty,.selected)').deactivate();
                    //return;
                }
           }
           $(this).addClass("selected").activate();
           $i.find('li:not(.empty,.selected)').deactivate();
           selected = $(this);
           $m.find('li:not(.solved)').activate();
       }else{
           $m.find('li:not(.solved)').deactivate();
           if($soundButton){
               $i.find('li').not('.empty').deactivate();               
           }else{
               $i.find('li').not('.empty').activate();
           }
       }       
   }
   
   function placeItem(event){
       var d = $(this).find('.source');
       if(d.length)return;
       if(selected){
           var n = $(this).data('num');
           var s = selected.find('.source').first();
           var snd = s.data('sound');
           var sn = s.data('num');           
           if(n!=sn || ($soundButton && snd != $currentSound)){
               $game.playSound('no');
               return;
               //$game.playSound('no',function(){
               //    if($soundButton && solved < $d.images.length)$game.flash($soundButton);
               //});
               //selectItem(false);
           }else{
               $currentSound = false;
               $(this).append(s).addClass("solved");
               selected.addClass("empty").animate({opacity:0});
               selectItem(false);
               solved++;
               $game.playSound('yes',function(){
                    $game.playSound(snd,function(){
                        if($soundButton && solved < $d.images.length)$game.flash($soundButton);
                        if(solved>=$d.images.length){
                            $('#solve').addClass("disabled");
                            $game.popup({type:"win",text:"Play again",sound:"win",click:function(){
                                 resetGame();
                            }});
                        }
                    });
                });   
                      
           }
       }
   }
   
   function solveGame(){
       //selectItem();
       $m.find('li').activate();
       
       $i.find('div.source').each(function(n,s){
          var p = $(s).closest('li');
          var num = $(s).data('num');
          var p = $(s).closest('li');
          p.addClass("empty");
          var sel = "li[data-num=" + num + "]";
          var li = $m.find(sel).first();
          li.append($(s)).addClass("solved");
          p.css({opacity:0});
       });
       $game.stopflash();       
       $('#solve').addClass("disabled");
   }
   
   
});
