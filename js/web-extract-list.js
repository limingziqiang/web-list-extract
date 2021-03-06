// ==UserScript==
// @name         web-extract-list
// @namespace    http://your.homepage/
// @version      1.0
// @description  针对网页列表做数据翻页提取
// @author       jstarseven
// @match        https://www.lancai.cn/about/notice.html
// @grant        none
// ==/UserScript==

//全局变量
var submitUrl = "http://127.0.0.1:8282/topic/collectTopic";
var open_store = [];
var task_json = {
    "type": "list",
    "home_url": "https://www.lancai.cn/about/notice.html",
    "selector": "ul#noticeList > li",
    "max_page": 1,
    "page_selector": "#noticeListContent > div.media-page-box.clearfix.media-page.pull-right > a.pageTurnNext",
    "iframe_selector": "",
    "datas": [
        {
            "selector": " div.about-list-content > div > a ",
            "column": "title",
            "from": "text",
            "iframe_selector": "",
            "open_tab": [
                {
                    "selector": " #noticeDetailWrapper > h4 ",
                    "column": "detail-title",
                    "from": "text",
                    "iframe_selector": ""
                },
                {
                    "selector": " #noticeDetailWrapper > p ",
                    "column": "detail-desc",
                    "from": "text",
                    "iframe_selector": ""
                },
                {
                    "selector": " #noticeDetailWrapper > div ",
                    "column": "detail-content",
                    "from": "text",
                    "iframe_selector": ""
                }
            ]
        },
        {
            "selector": " div.about-list-content  >  p:nth-child(2) ",
            "column": "content",
            "from": "text",
            "iframe_selector": ""
        },
        {
            "selector": " div.about-list-content  >  p:nth-child(3)  >  span.pull-right ",
            "column": "time",
            "from": "text",
            "iframe_selector": ""
        }
    ]
};

(function () {
    'use strict';
    createPseudoStyle('surfilter_inject_mouse_css', "plum");
    var listTimer = setInterval(function () {
        var cur_page = sessionStorage.getItem("cur_page");
        if (!isNullParam(cur_page) && cur_page > task_json.max_page) {
            clearInterval(listTimer);
            open_store.push("listend");
            return;
        }
        new analyzerJson(task_json).executor();
    }, 5000);
    var openTabTimer = setInterval(function () {
        var open_item = open_store.shift();
        if ("listend" == open_item) {
            clearInterval(openTabTimer);
            var showJsonTimer = setInterval(function () {
                var elements = getTaskDataMap().elements;
                //判断是否开始展示json数据
                var lastJson = elements[elements.length - 1];
                if (getCount(JSON.stringify(task_json), "column") != countProp(lastJson.value))
                    return;
                var win = window.open('about:blank', 'web.format.json');
                var style = win.document.createElement("style");
                style.innerHTML = 'pre {outline: 1px solid #ccc; padding: 5px; margin: 5px; }' +
                    '.string { color: green; } ' +
                    '.number { color: darkorange; }' +
                    '.boolean { color: blue; } ' +
                    '.null { color: magenta; } ' +
                    '.key { color: red; }';
                win.document.head.appendChild(style);
                var pre = win.document.createElement("pre");
                win.document.body.appendChild(pre);
                $(pre).html(jsonSyntaxHighLight(elements));
                clearInterval(showJsonTimer);
                submitMess(task_json.home_url, elements);
                clearTaskDataMap();
            }, 2000);
        }
        if (isNullParam(open_item))return;
        $(open_item).simulate('click');
    }, 2000);
})();


/**
 * 消息数据提交
 * @param home_url
 * @param topics
 */
function submitMess(home_url, topics) {
    if (isNullParam(home_url) || isNullParam(topics))return;
    for(var i=0;i<topics.length;i++){
        var param = {
            "home_url": home_url,
            "topics": JSON.stringify(topics[i])
        };
        $.ajax({
            type: "POST",
            url: submitUrl,
            data: param,
            dataType: "jsonp",
            jsonp: "callbackparam",
            async: true,
            success: function (data) {
                console.log("message date submit success !");
            },
            error: function () {
                console.log("message date submit fail !");
            }
        });
    }
}
/**
 * 创建伪元素样式Pseudo Element style
 * @param styleName
 * @param back_color
 * @returns {Element}
 */
function createPseudoStyle(styleName, back_color) {
    var style = document.createElement("style");
    style.innerHTML =
        '.' + styleName + '{position:relative;} ' +
        '.' + styleName + ':after{' +
        'position:absolute;' +
        'pointer-events:none;' +
        'left:0px;top:0px;' +
        'display:inline-block;' +
        'margin:-2px;width:100%;' +
        'height:100%;' +
        'border:dashed 2px #FF69B4;' +
        'background:' + back_color + ';' +
        'opacity:0.25;' +
        'content:" ";' +
        '}';
    document.head.appendChild(style);
    return style;
}

/**
 * 抽取元素数据信息进行处理
 * @param item
 * @param element
 * @returns {string}
 */
function extractDeal(item, element) {
    var from = item.from;
    var content = '';
    if (isNullParam(from) || "text" == from)
        content = $(element).text();
    if ("html" == from)
        content = $(element).html();
    console.log(new Date() + ":extract data success < " + content + " >");
    return content;
}

/**
 * 列表数据提取
 * @param list_start
 * @param action
 */
function analyzerJson(task_json) {
    if (isNullParam(task_json.type) || "list" != task_json.type) {
        console.log(new Date() + ":json type is null");
        return;
    }
    if (isNullParam(task_json.selector)) {
        console.log(new Date() + ":list selector is null");
        return;
    }
    if (isNullParam(task_json.datas)) {
        console.log(new Date() + ":list datas is null");
        return;
    }
    this.type = task_json.type;
    this.selector = task_json.selector;
    this.max_page = task_json.max_page;
    this.page_selector = task_json.page_selector;
    this.iframe_selector = task_json.iframe_selector;
    this.datas = task_json.datas;
    this.executor = function () {
        var list_all, page_ele;
        if (!isNullParam(this.page_selector))
            page_ele = document.querySelectorAll(this.page_selector);
        if (isNullParam(this.iframeselector)) {
            list_all = document.querySelectorAll(this.selector);
        } else {//元素存在于iframe中
            list_all = document.querySelector(this.iframeselector).contentWindow.document.querySelectorAll(this.selector);
        }
        var cur_page = isNullParam(sessionStorage.getItem("cur_page")) ? 1 : Number(sessionStorage.getItem("cur_page"));
        console.log(new Date() + "start extract " + cur_page + " data");
        for (var i = 0; i < list_all.length; i++) {
            var data_items = this.datas, list_item_ele = list_all[i], list_item = {};
            var list_item_key = "page-" + cur_page + "-" + i;
            for (var j = 0; j < data_items.length; j++) {
                var item_sel = data_items[j].selector, item_col = data_items[j].column;
                var item_ifr_sel = data_items[j].iframe_selector, item_open_type = data_items[j].open_tab;
                var datas_item_ele = $(list_item_ele).find(item_sel);
                if (!isNullParam(item_ifr_sel))
                    datas_item_ele = document.querySelector(item_ifr_sel).contentWindow.document.querySelector(item_sel);
                list_item[item_col] = extractDeal(data_items[j], datas_item_ele);
                if (!isNullParam(item_open_type))
                    new newTabAction(datas_item_ele, list_item_key, item_open_type).executor();
            }
            addTaskDataMap(list_item_key, list_item);
        }
        //添加选中样式
        $(this.selector).addClass("surfilter_inject_mouse_css");
        console.log(new Date() + "end extract " + cur_page + " data");
        //点击跳转下一页
        if (!isNullParam(page_ele)) {
            sessionStorage.setItem("cur_page", cur_page + 1);
            $(this.page_selector).simulate('click');
        }
    };
}

/**
 * 新建标签
 * @param click_ele
 * @param list_item_key
 * @param open_tab
 */
function newTabAction(click_ele, list_item_key, open_tab) {
    this.executor = function () {
        console.log(new Date() + "open new tab <" + list_item_key + ">");
        if (isNullParam(click_ele) || isNullParam(list_item_key) || isNullParam(open_tab))
            return;
        var click_dom = click_ele.get(0);
        click_dom.setAttribute('target', '_blank');
        var click_href = click_dom.getAttribute("href");
        if (!isNullParam(click_href)) {
            var data_key = click_href + "&data_key=" + list_item_key;
            click_dom.setAttribute("href", click_href.indexOf("?") > 0 ? data_key : data_key.replace("&data_key", "?data_key"));
        }
        var config = {
            "cur_key": list_item_key,
            "cur_opentab": open_tab
        };
        localStorage.setItem(list_item_key, JSON.stringify(config));
        open_store.push(click_dom);
    };
}

/**
 *获取当前任务配置信息
 */
function getTaskDataMap() {
    var data_maps = localStorage.getItem("data_maps");
    var datas = new Map();
    if (isNullParam(data_maps)) {
        data_maps = datas;
    } else {
        datas.elements = JSON.parse(data_maps).elements;
        return datas;
    }
    return data_maps;
}

/**
 *清空当前任务配置信息
 */
function clearTaskDataMap() {
    localStorage.setItem("data_maps", "");
}

/**
 * 当前任务添加配置信息
 * @param step_id  脚本步骤id
 * @param config   [doms,json]
 */
function addTaskDataMap(key, values) {
    if (isNullParam(key) || isNullParam(values))
        return;
    var data_maps = getTaskDataMap();
    data_maps.put(key, values);
    localStorage.setItem("data_maps", JSON.stringify(data_maps));
}

/**
 * 格式化json
 * @param json
 * @returns {string|XML}
 */
function jsonSyntaxHighLight(json) {
    if (typeof json != 'string')
        json = JSON.stringify(json, undefined, 2);
    json = json.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}
//-------------------------------------------------------------------------------------------------------------------------------------

/**
 * 关闭当前窗口
 */
function closeWebPage() {
    if (navigator.userAgent.indexOf("MSIE") > 0) {
        if (navigator.userAgent.indexOf("MSIE 6.0") > 0) {
            window.opener = null;
            window.close();
        } else {
            window.open('', '_top');
            window.top.close();
        }
    } else if (navigator.userAgent.indexOf("Firefox") > 0) {
        window.location.href = 'about:blank ';
    } else {
        window.opener = null;
        window.open('', '_self', '');
        window.close();
    }
}

/**
 * 判断参数值是否是空值
 * @param param
 * @returns {boolean}
 */
function isNullParam(param) {
    return !!(param == "" || null == param || param == undefined);
}

/**
 * 统计对象属性值个数
 * @param obj
 * @returns {number}
 */
function countProp(obj) {
    var count = 0;
    for (var name in obj)count++;
    return count;
}

/**
 * 统计字符串中指定字符个数
 * @param str1
 * @param str2
 * @returns {Number}
 */
function getCount(str1, str2) {
    var r = new RegExp(str2, "gi");
    return str1.match(r).length;
}

/*
 * MAP对象，实现MAP功能   
 *   
 * 接口：   
 * size()     获取MAP元素个数   
 * isEmpty()    判断MAP是否为空   
 * clear()     删除MAP所有元素   
 * put(key, value)   向MAP中增加元素（key, value)    
 * remove(key)    删除指定KEY的元素，成功返回True，失败返回False   
 * get(key)    获取指定KEY的元素值VALUE，失败返回NULL   
 * element(index)   获取指定索引的元素（使用element.key，element.value获取KEY和VALUE），失败返回NULL   
 * containsKey(key)  判断MAP中是否含有指定KEY的元素   
 * containsValue(value) 判断MAP中是否含有指定VALUE的元素   
 * values()    获取MAP中所有VALUE的数组（ARRAY）   
 * keys()     获取MAP中所有KEY的数组（ARRAY）   
 */
function Map() {
    this.elements = [];

    //获取MAP元素个数     
    this.size = function () {
        return this.elements.length;
    };

    //判断MAP是否为空     
    this.isEmpty = function () {
        return (this.elements.length < 1);
    };

    //删除MAP所有元素     
    this.clear = function () {
        this.elements = [];
    };

    //向MAP中增加元素（key, value)      
    this.put = function (_key, _value) {
        for (var i = 0; i < this.elements.length; i++) {
            if (this.elements[i].key == _key) {
                this.elements[i].value = _value;
                return;
            }
        }
        this.elements.push({
            key: _key,
            value: _value
        });
    };

    //删除指定KEY的元素，成功返回True，失败返回False     
    this.remove = function (_key) {
        var bln = false;
        try {
            for (var i = 0; i < this.elements.length; i++) {
                if (this.elements[i].key == _key) {
                    this.elements.splice(i, 1);
                    return true;
                }
            }
        } catch (e) {
            bln = false;
        }
        return bln;
    };

    //获取指定KEY的元素值VALUE，失败返回NULL     
    this.get = function (_key) {
        try {
            for (var i = 0; i < this.elements.length; i++) {
                if (this.elements[i].key == _key) {
                    return this.elements[i].value;
                }
            }
        } catch (e) {
            return null;
        }
    };

    //获取指定索引的元素（使用element.key，element.value获取KEY和VALUE），失败返回NULL     
    this.element = function (_index) {
        if (_index < 0 || _index >= this.elements.length) {
            return null;
        }
        return this.elements[_index];
    };

    //判断MAP中是否含有指定KEY的元素     
    this.containsKey = function (_key) {
        var bln = false;
        try {
            for (var i = 0; i < this.elements.length; i++) {
                if (this.elements[i].key == _key) {
                    bln = true;
                }
            }
        } catch (e) {
            bln = false;
        }
        return bln;
    };

    //判断MAP中是否含有指定VALUE的元素     
    this.containsValue = function (_value) {
        var bln = false;
        try {
            for (var i = 0; i < this.elements.length; i++) {
                if (this.elements[i].value == _value) {
                    bln = true;
                }
            }
        } catch (e) {
            bln = false;
        }
        return bln;
    };

    //获取MAP中所有VALUE的数组（ARRAY）     
    this.values = function () {
        var arr = [];
        for (var i = 0; i < this.elements.length; i++) {
            arr.push(this.elements[i].value);
        }
        return arr;
    };

    //获取MAP中所有KEY的数组（ARRAY）     
    this.keys = function () {
        var arr = [];
        for (var i = 0; i < this.elements.length; i++) {
            arr.push(this.elements[i].key);
        }
        return arr;
    };

}


/*!
 * jQuery Simulate v@VERSION - simulate browser mouse and keyboard events
 * https://github.com/jquery/jquery-simulate
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * Date: @DATE
 */

;(function ($, undefined) {

    var rkeyEvent = /^key/,
        rmouseEvent = /^(?:mouse|contextmenu)|click/;

    $.fn.simulate = function (type, options) {
        return this.each(function () {
            new $.simulate(this, type, options);
        });
    };

    $.simulate = function (elem, type, options) {
        var method = $.camelCase("simulate-" + type);

        this.target = elem;
        this.options = options;

        if (this[method]) {
            this[method]();
        } else {
            this.simulateEvent(elem, type, options);
        }
    };

    $.extend($.simulate, {

        keyCode: {
            BACKSPACE: 8,
            COMMA: 188,
            DELETE: 46,
            DOWN: 40,
            END: 35,
            ENTER: 13,
            ESCAPE: 27,
            HOME: 36,
            LEFT: 37,
            NUMPAD_ADD: 107,
            NUMPAD_DECIMAL: 110,
            NUMPAD_DIVIDE: 111,
            NUMPAD_ENTER: 108,
            NUMPAD_MULTIPLY: 106,
            NUMPAD_SUBTRACT: 109,
            PAGE_DOWN: 34,
            PAGE_UP: 33,
            PERIOD: 190,
            RIGHT: 39,
            SPACE: 32,
            TAB: 9,
            UP: 38
        },

        buttonCode: {
            LEFT: 0,
            MIDDLE: 1,
            RIGHT: 2
        }
    });

    $.extend($.simulate.prototype, {

        simulateEvent: function (elem, type, options) {
            var event = this.createEvent(type, options);
            this.dispatchEvent(elem, type, event, options);
        },

        createEvent: function (type, options) {
            if (rkeyEvent.test(type)) {
                return this.keyEvent(type, options);
            }

            if (rmouseEvent.test(type)) {
                return this.mouseEvent(type, options);
            }
        },

        mouseEvent: function (type, options) {
            var event, eventDoc, doc, body;
            options = $.extend({
                bubbles: true,
                cancelable: (type !== "mousemove"),
                view: window,
                detail: 0,
                screenX: 0,
                screenY: 0,
                clientX: 1,
                clientY: 1,
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                metaKey: false,
                button: 0,
                relatedTarget: undefined
            }, options);

            if (document.createEvent) {
                event = document.createEvent("MouseEvents");
                event.initMouseEvent(type, options.bubbles, options.cancelable,
                    options.view, options.detail,
                    options.screenX, options.screenY, options.clientX, options.clientY,
                    options.ctrlKey, options.altKey, options.shiftKey, options.metaKey,
                    options.button, options.relatedTarget || document.body.parentNode);

                // IE 9+ creates events with pageX and pageY set to 0.
                // Trying to modify the properties throws an error,
                // so we define getters to return the correct values.
                if (event.pageX === 0 && event.pageY === 0 && Object.defineProperty) {
                    eventDoc = event.relatedTarget.ownerDocument || document;
                    doc = eventDoc.documentElement;
                    body = eventDoc.body;

                    Object.defineProperty(event, "pageX", {
                        get: function () {
                            return options.clientX +
                                ( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) -
                                ( doc && doc.clientLeft || body && body.clientLeft || 0 );
                        }
                    });
                    Object.defineProperty(event, "pageY", {
                        get: function () {
                            return options.clientY +
                                ( doc && doc.scrollTop || body && body.scrollTop || 0 ) -
                                ( doc && doc.clientTop || body && body.clientTop || 0 );
                        }
                    });
                }
            } else if (document.createEventObject) {
                event = document.createEventObject();
                $.extend(event, options);
                // standards event.button uses constants defined here: http://msdn.microsoft.com/en-us/library/ie/ff974877(v=vs.85).aspx
                // old IE event.button uses constants defined here: http://msdn.microsoft.com/en-us/library/ie/ms533544(v=vs.85).aspx
                // so we actually need to map the standard back to oldIE
                event.button = {
                        0: 1,
                        1: 4,
                        2: 2
                    }[event.button] || ( event.button === -1 ? 0 : event.button );
            }

            return event;
        },

        keyEvent: function (type, options) {
            var event;
            options = $.extend({
                bubbles: true,
                cancelable: true,
                view: window,
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                metaKey: false,
                keyCode: 0,
                charCode: undefined
            }, options);

            if (document.createEvent) {
                try {
                    event = document.createEvent("KeyEvents");
                    event.initKeyEvent(type, options.bubbles, options.cancelable, options.view,
                        options.ctrlKey, options.altKey, options.shiftKey, options.metaKey,
                        options.keyCode, options.charCode);
                    // initKeyEvent throws an exception in WebKit
                    // see: http://stackoverflow.com/questions/6406784/initkeyevent-keypress-only-works-in-firefox-need-a-cross-browser-solution
                    // and also https://bugs.webkit.org/show_bug.cgi?id=13368
                    // fall back to a generic event until we decide to implement initKeyboardEvent
                } catch (err) {
                    event = document.createEvent("Events");
                    event.initEvent(type, options.bubbles, options.cancelable);
                    $.extend(event, {
                        view: options.view,
                        ctrlKey: options.ctrlKey,
                        altKey: options.altKey,
                        shiftKey: options.shiftKey,
                        metaKey: options.metaKey,
                        keyCode: options.keyCode,
                        charCode: options.charCode
                    });
                }
            } else if (document.createEventObject) {
                event = document.createEventObject();
                $.extend(event, options);
            }

            if (!!/msie [\w.]+/.exec(navigator.userAgent.toLowerCase()) || (({}).toString.call(window.opera) === "[object Opera]")) {
                event.keyCode = (options.charCode > 0) ? options.charCode : options.keyCode;
                event.charCode = undefined;
            }

            return event;
        },

        dispatchEvent: function (elem, type, event) {
            if (elem.dispatchEvent) {
                elem.dispatchEvent(event);
            } else if (type === "click" && elem.click && elem.nodeName.toLowerCase() === "input") {
                elem.click();
            } else if (elem.fireEvent) {
                elem.fireEvent("on" + type, event);
            }
        },

        simulateFocus: function () {
            var focusinEvent,
                triggered = false,
                element = $(this.target);

            function trigger() {
                triggered = true;
            }

            element.bind("focus", trigger);
            element[0].focus();

            if (!triggered) {
                focusinEvent = $.Event("focusin");
                focusinEvent.preventDefault();
                element.trigger(focusinEvent);
                element.triggerHandler("focus");
            }
            element.unbind("focus", trigger);
        },

        simulateBlur: function () {
            var focusoutEvent,
                triggered = false,
                element = $(this.target);

            function trigger() {
                triggered = true;
            }

            element.bind("blur", trigger);
            element[0].blur();

            // blur events are async in IE
            setTimeout(function () {
                // IE won't let the blur occur if the window is inactive
                if (element[0].ownerDocument.activeElement === element[0]) {
                    element[0].ownerDocument.body.focus();
                }

                // Firefox won't trigger events if the window is inactive
                // IE doesn't trigger events if we had to manually focus the body
                if (!triggered) {
                    focusoutEvent = $.Event("focusout");
                    focusoutEvent.preventDefault();
                    element.trigger(focusoutEvent);
                    element.triggerHandler("blur");
                }
                element.unbind("blur", trigger);
            }, 1);
        }
    });


    /** complex events **/

    function findCenter(elem) {
        var offset,
            document = $(elem.ownerDocument);
        elem = $(elem);
        offset = elem.offset();

        return {
            x: offset.left + elem.outerWidth() / 2 - document.scrollLeft(),
            y: offset.top + elem.outerHeight() / 2 - document.scrollTop()
        };
    }

    function findCorner(elem) {
        var offset,
            document = $(elem.ownerDocument);
        elem = $(elem);
        offset = elem.offset();

        return {
            x: offset.left - document.scrollLeft(),
            y: offset.top - document.scrollTop()
        };
    }

    $.extend($.simulate.prototype, {
        simulateDrag: function () {
            var i = 0,
                target = this.target,
                eventDoc = target.ownerDocument,
                options = this.options,
                center = options.handle === "corner" ? findCorner(target) : findCenter(target),
                x = Math.floor(center.x),
                y = Math.floor(center.y),
                coord = {clientX: x, clientY: y},
                dx = options.dx || ( options.x !== undefined ? options.x - x : 0 ),
                dy = options.dy || ( options.y !== undefined ? options.y - y : 0 ),
                moves = options.moves || 3;

            this.simulateEvent(target, "mousedown", coord);

            for (; i < moves; i++) {
                x += dx / moves;
                y += dy / moves;

                coord = {
                    clientX: Math.round(x),
                    clientY: Math.round(y)
                };

                this.simulateEvent(eventDoc, "mousemove", coord);
            }

            if ($.contains(eventDoc, target)) {
                this.simulateEvent(target, "mouseup", coord);
                this.simulateEvent(target, "click", coord);
            } else {
                this.simulateEvent(eventDoc, "mouseup", coord);
            }
        }
    });

})(jQuery);
