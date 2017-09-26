//esto es un fx plugin para jquery que determina como se tiene que animar la propiedad 'transform'
//usa el attributo html 5 'data' para guardar los transforms actuales. 
//Hice este plugin porque el jquery.transit no está soportada en todos los navegadores. Este si parece funcionar en todos los navegadores (inlc. IE9, Opera).
//por ahora solo se puede animar el scale y rotate. Existen mas propiedades transform.
//para animar alguna de las propiedas del transform tenes que definir un objeto llamado transform con los valores deseados.
//ej. $(element).animate({transform:{scale:2,rotate:45},left:60px});
   
$.fx.step['transform'] = function(fx){
    $elem  = $(fx.elem);

    if(!fx._transformValues){        
        //set defaults   
        fx._transformValues = {
            rotate: getData('rotate',0),
            scale: getData('scale',1),
            scaleY: getData('scaleY',1),
            scaleX: getData('scaleX',1),
        };
    }
    
    if(!fx._transformData || !fx.pos){
        var props = fx.end;                        
        var data = [];                       
        for(var n in props){                            
            var from = fx._transformValues[n];       
            var to = props[n]; 
            var set = true;
            switch(n){
                case "rotate":
                    from = parseInt(from);                                   
                    to = parseInt(to);
                    break;
                case "scale":
                    from = parseFloat(from);
                    
                    to = parseFloat(to);
                    break;
                case "scaleY":
                    from = parseFloat(from);
                    to = parseFloat(to);
                    break;
                case "scaleX":
                    from = parseFloat(from);
                    to = parseFloat(to);
                    break;                    
                default:
                    set = false;
                    break;
            }                            
            if(set)data.push({transform:n,from:from,to:to});
        }                                               
        fx._transformData = data;                        
        return true;
    }
    //console.log(fx._transformData);
    var tr = [];
    $(fx._transformData).each(function(n,d){
        
        var dist = d.to - d.from;                        
        var curr = dist * fx.pos + d.from;
        fx._transformValues[d.transform] = curr;
    });

    for(var n in fx._transformValues){
        var v = fx._transformValues[n];
        $elem.attr('data-transform-' + n,v);
        tr.push(getPropValue(n,v));
    }

    tr = tr.join(" ");
    
    $elem.css({transform:tr});

    function getPropValue(prop,value){                            
        var r;
        switch(prop){
            case "rotate":
                value = Math.round(value);
                r = 'rotate(' + value + 'deg)';
                break;
            case "scale":
                r = 'scale(' + value + ',' + value + ')';
                break;
            case "scaleY":
                r = 'scaleY(' + value + ')';
                break;
            case "scaleX":
                r = 'scaleX(' + value + ')';
                break;
        }
        return r;
    }       
    
    function getData(prop,defaultValue){        
        var d = $elem.attr('data-transform-' + prop.toLowerCase());
        if(typeof d == "undefined")return defaultValue;
        return d;
    }
    
    return true;                    
}


//esta funcion permite setear la propiedad css 'transform' de forma fácil
//Solo soporta scale y rotate
//ej. $(element).transform({scale:2,rotate:46});
    
$.fn.transform = function(props){
    
    return this.each(function(){
        var tr = [];
        var tf = ["rotate","scale","scaley","scalex"];
        if(!props){
            var s = this.style;
            s.webkitTransform = "";
            s.mozTransform = "";
            s.msTransform = "";
            s.transform = "";
            s.oTransform = "";            
            
            for(var n in tf){                
                var p = tf[n];
                $(this).attr('data-transform-' + p,null);
            }
            return;
        }
        for(var n in props){
            tr.push(getPropValue(n,props[n]));
            $(this).attr('data-transform-' + n,props[n]);
        }        
        $(this).css({transform:tr.join(" ")});
        
    });
    
    function getPropValue(prop,value){                            
        var r;
        switch(prop){
            case "rotate":
                value = Math.round(value);
                r = 'rotate(' + value + 'deg)';
                break;
            case "scale":
                r = 'scale(' + value + ',' + value + ')';
                break;
            case "scaleY":
                r = 'scaleY(' + value + ')';
                break;
            case "scaleX":
                r = 'scaleX(' + value + ')';
                break;
        }
        return r;
    }              
    
}
