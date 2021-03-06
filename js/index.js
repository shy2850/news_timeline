/**
 * 这一版本代码要多坑爹有多坑爹, 相当多的冗余代码和超大资源等 
 * 这些都是产品要求的, 我劝说失败以后无奈只能修改。 
 * 如果需要使用, 请参考同路径下的 index-1.0.js 
**/
;(function(S){

// 定时器封装
S.add("tl/requestAFrame",function(S){
    var requestAFrame = (function () {
        return  window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                function (fn) {
                    return window.setTimeout(fn, 1000/60); 
                };
    })();
    var _timeoutQueue = {}, index = 0;
    function queueTimeout(){
        for(var i in _timeoutQueue){
            var fn = _timeoutQueue[i];
            if( index % fn.timer === 0 ){   //如果按照时间轮训到了，执行代码
                if( !fn.times-- ){          //如果可执行次数为0, 移除方法
                    delete _timeoutQueue[i];
                }else{
                    var _r = fn();  
                    if(_r === false){
                        delete _timeoutQueue[i];
                    }
                }
            }
        }
        requestAFrame(queueTimeout);
        index = ( index + 1) % (18000) ; //最高时隔5分钟
    }
    queueTimeout(); 
    return {
        /**
         * 按照指定key添加轮训事件 【首次添加一般不会立即执行】
         * k    : 轮询事件的key
         * fn   : 要轮训的事件    return false; 
         * timer: 轮训间隔,单位ms, 默认是200, 只支持 1000/60 的倍数
         * times: 轮询事件执行次数, 达到指定次数后清除
        **/
        addTimeout: function(k,fn,timer,times){
            fn.timer = Math.floor( (timer||200) * 60 / 1000);
            fn.times = times || Infinity;
            _timeoutQueue[k] = fn;
        }
    };
});

// 日期控件封装
S.add("tl/dateUtil",function(S){
    //两位整数格式化，小于10高位补零
    var fmt_num = function(n){
        return n < 10 ? "0" + n : n;
    };
    
    var _ = {
        reg : /([yMdhms\$]{1,2})/g,
        days :["星期日","星期一","星期二","星期三","星期四","星期五","星期六"],
        yy : function(d){return d.getFullYear()},
        M  : function(d){return 1+d.getMonth()},
        MM : function(d){return fmt_num(1+d.getMonth())},
        d  : function(d){return d.getDate()},
        dd : function(d){return fmt_num(d.getDate())},
        h  : function(d){return d.getHours()},
        hh : function(d){return fmt_num(d.getHours())},
        m  : function(d){return d.getMinutes()},
        mm : function(d){return fmt_num(d.getMinutes())},
        s  : function(d){return d.getSeconds()},
        ss : function(d){return fmt_num(d.getSeconds())},
        $  : function(d){return this.days[d.getDay()]},
        $$ : function(d){return this.days[d.getDay()]}
    };

    return {
        format : function(date,format,rule){
            if( window.jQuery ){
                rule = jQuery.extend({},_,rule); //如果引入jQuery了, 支持修改对应规则
            }
            return format.replace(_.reg,function(match,key){
                return _[key](date);
            });
        },
        parse : function(str,format){
            format = format || "yy/MM/dd hh:mm:ss";     //没有定义格式的话, 使用默认的格式

            var map = {}, nums = str.match( /\d{1,4}/g ), fmts = format.match( _.reg );
            for (var i = 0; i < fmts.length; i++) {
                map[ fmts[i] ] = nums[i];
            }; //for循环完成格式和数据的对应关系。

            //完成替换并且返回创建的Date结果。
            return new Date( "yy/MM/dd hh:mm:ss".replace(_.reg,function(match,key){
                return map[key] || 0;
            }) );
        }
    }   
});

// 列表渲染
S.add("tl/render",function(S,D){
    var tm = {
        0: {
            date: "yy年",
            stamp: "yy年"
        },
        1: {
            date: "yy年M月",
            stamp: "yy年M月"
        },
        2: {
            date: "yy年M月d日",
            stamp: "M月d日"
        },
        3: {
            date: "yy年M月d日",
            stamp: "hh:mm′"
        },
        4: {
            date: "yy年M月d日",
            stamp: "hh:mm′"
        },
        5: {
            date: "yy年M月d日",
            stamp: "hh:mm′ss″"
        }
    };

    return function(list){
        var lis = [], slides = [];
        S.each(list,function(i,idx){
            var d = new Date()
                m = tm[i.timeLevel]; // 默认使用分钟级别展示
            d.setTime( i.time );
            i.timeStamp = D.format(d, m.stamp);
            i.timeDate = D.format(d, m.date);
            i.titleWithUrl = i.url ? ('<a href="'+i.url+'" target="_blank">'+i.title+'</a>') : i.title;
            slides.push( D.format(d, m.stamp) );
            lis.push( '<li class="'+(idx%2?"right":"left")+'" data-timedate="{{timeDate}}" data-href="{{url}}" title="{{desc}}"><img class="bg" src="{{typeData}}@300x200" alt="{{title}}"/><div class="title-info"><h4>{{titleWithUrl}}</h4><div class="time-info">{{timeDate}}</div></div></li>'.replace(/\{\{(\w+)\}\}/g,function(w,k){
                return i[k] || "";
            }) );
        });

        this.list = lis.join("");
        this.slides = '<li><a href="javascript:void(0);">'+slides.join('</a></li><li><a href="javascript:void(0);">')+'</a></li>';
    };
},{requires:["tl/dateUtil"]});

// 场景定位
S.add("tl/snapshot",function(S,Node){
    var $ = Node.all,
        label = $(".time-label").html( document.title.replace( "_新时空_新华网", "" ) ),
        stars = $("#stars"),
        bg = stars.prev().prev();
    var SnapShot = function(ul,slide){
        var lis = ul.children(),
            slides = slide.children(),
            length = lis.length;
        this.on = function(p){
            if( p.t > length-1 ){
                p.t = length-1;
            }else if( p.t < 0 ){
                p.t = 0;
            }

            var index = p.t | 0;
            slide.css({
                left: p.t > 2 ? ( 2 - p.t ) * 98 : 0
            });
            if( p.t | 0 == p.tar | 0 ){
                slides.item(index).addClass("current").siblings().removeClass("current");
            }
            lis.each(function(ele,i){
                var pos = ele.attr("class"),
                mgs = pos === "left" ? "margin-right" : "margin-left",
                zoom = 1 - (i-p.t) / length * 3,  // 缩放相对比例
                style = {
                    width: zoom * 40 + "%",
                    height: zoom * 50 + "%",
                    zIndex: length - i,
                    marginBottom: 13 * (i - p.t) + "%"
                };

                // 缩放过于严重的只显示图片不显示文字和标题
                style["text-indent"] = zoom < .5 ? "-9999em" : "0";

                style[mgs] = -5 * (i-p.t)/Math.max(i,p.t,3) +"%";  // 微量偏移, 使看起来远处集中一些
                style.display = i + 1 < p.t ? "none":"block";   // 景深过高, 隐藏起来

                var opacity = i + 1 - p.t;  // 放大和缩小的透明度比例不同, 分别做算法
                style.opacity = opacity // <= 1 ? opacity : (1 - opacity / length / 2);
                ele.css(style);
                $("h4",ele).css({
                    fontSize: 18 * zoom 
                });

                // 顶部换时间
                // if( i === index ){
                //     label.html( ele.attr("data-timedate") );
                // }
            });
            
            if( ! (S.UA.ie < 9) ){
                stars.css({
                    transform: "scale("+ ( 1 + p.t / length) +")"
                });
                bg.css({
                    transform: "scale("+ ( 1 + p.t / length / 2) +")"
                });
            }

        };
    };
    return SnapShot;
},{requires:["node"]});


S.add("tl/index",function(S,Node,R,Render,SnapShot){
    var $ = Node.all,
        doc = $(document),
        width = doc.width(),
        height = doc.height(),
        way = $("#way"),
        bg = way.prev(),
        stars = $("#stars"),
        ul = $("#list"),
        slide = $("#slide"),
        render = new Render(data.content);

    // 列表渲染
    ul.html( render.list );
    slide.html( render.slides );
    way.attr({
        src: way.attr("src").replace(/\.png/,"-2.png")
    });
    bg.attr({
        src: bg.attr("src").replace(/\.jpg/,"-2.jpg") 
    });
    stars.attr({
        src: stars.attr("src").replace(/\.png/,"-2.png")
    });

    //场景设置
    var snap = new SnapShot(ul,slide),
        win = $(window),
        per = {
            t: 0,
            tar: 0,
            speed: .0625,
            reset: function(){
                if( navigator.userAgent.match(/mobile/i) ){     
                    this.speed = .125;
                }else{
                    this.speed = win.height() > 400 ? .125 : .0625;
                }
            }
        };
    

    // 场景每帧效果设置
    R.addTimeout("snap",function(){
        if( Math.abs(per.tar - per.t) > .001 ){
            per.t += per.tar > per.t ? per.speed : -per.speed
        }
        snap.on(per);
    },20);

    // 所有事件绑定
    var mousedown = false,
        downY = 0,
        perSet = per.t,
        body = document.body;
    $(document).on("mousewheel",function(e){
        per.tar = per.t + e.deltaY * per.speed * 4;
        //per.t = per.tar;
        if( auto.status === "pause" ){
            auto.status = "run";
            $(".autoRun").toggleClass("run").toggleClass("pause");
        }
        return false;
    }).on("keyup",function(e){
        switch(e.keyCode){
            case 37:
            case 38: per.tar = Math.floor(per.t) - 1; break;
            case 39:
            case 40: per.tar = Math.floor(per.t) + 1; break;
        }
        return false;
    });
    $(".time-slide").delegate("click",".left",function(){
        per.tar = Math.floor(per.t) - 1;
    }).delegate("click",".right",function(){
        per.tar = Math.floor(per.t) + 1;
    });
    ul.children().on("click",function(e){
        var _t = $(this),
            index = _t.index();
        if( per.tar !== index ){
            per.tar = $(this).index();
            e.preventDefault();
        }else{
            var href = _t.attr("data-href");
            href && window.open(href);
        }
    });
    slide.children().on("click",function(){
        per.tar = $(this).index();
    });

    //自动播放效果
    var auto = {
        status: (data.autoRun?"pause":"run"),
        prefix: "http://tmisc.home.news.cn/story/news_timeline/",
        add: .125,
        speed: .0125
    };

    slide.parent().append( 
        $('<a href="javascript:void(0);" class="autoRun '+auto.status+'"><img src="'+auto.prefix+'img/run.png'+'" alt="run" title="自动播放" class="to-pause"/><img class="to-run" src="'+auto.prefix+'img/pause.png'+'" alt="pause" title="暂停播放"/></a>') 
    ).delegate("click",".autoRun", function(e){
        if(auto.status === "pause"){
            auto.status = "run";
        }else{
            auto.status = "pause";
        }
        $(e.currentTarget).toggleClass("run").toggleClass("pause");
    });

    R.addTimeout("autoRun",function(){
        if(per.tar >= data.content.length-1){
            auto.add = -Math.abs(auto.add);
        }else if( per.tar <= 1 ){
            auto.add = Math.abs(auto.add);
        }
        if( auto.status === "pause" ){
            per.speed = auto.speed;
            per.tar = (per.tar + auto.add) % data.content.length; 
        }else{
            per.reset();
        }
    },200);


    // 设备速度调整
    if( navigator.userAgent.match(/mobile/i) ){     
        // 移动端渲染比较慢，把比率提高。
        per.speed = .5;
        auto.speed = .05;
        auto.add = .5;
    }else{
        // 高度过大，渲染比较慢，直接把比率提高。
        win.on("resize", function(e){
            per.reset();
        }).fire("resize");
    }

},{requires:["node","tl/requestAFrame","tl/render","tl/snapshot"]});


})(KISSY);
