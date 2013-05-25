(function(){
  var DEBUGGING, LANG, MOEID, isCordova, isDroidGap, isDeviceReady, isMobile, isWebKit, entryHistory, INDEX, XREF, CACHED, GET, e, Howl, playing, player, callLater, MOE, CJKRADICALS, SIMPTRAD, ref$, Consonants, Vowels, Tones, re, C, V, split$ = ''.split, replace$ = ''.replace, join$ = [].join, slice$ = [].slice;
  DEBUGGING = true;
  LANG = getPref('lang') || (/twblg/.exec(document.URL) ? 't' : 'a');
  MOEID = getPref('prev-id') || {
    a: '萌',
    t: '發穎',
    h: '發芽'
  }[LANG];
  $(function(){
    return $('body').addClass("lang-" + LANG);
  });
  isCordova = !/^https?:/.test(document.URL);
  isDroidGap = isCordova && /android_asset/.exec(location.href);
  isDeviceReady = !isCordova;
  if (DEBUGGING) {
    isCordova = true;
  }
  isMobile = isCordova || /Android|iPhone|iPad|Mobile/.exec(navigator.userAgent);
  isWebKit = /WebKit/.exec(navigator.userAgent);
  entryHistory = [];
  INDEX = {
    t: '',
    a: ''
  };
  XREF = {
    t: '"發穎":"萌,抽芽,發芽,萌芽"',
    a: '"萌":"發穎"',
    tv: ''
  };
  function xrefOf(id, lang){
    var idx, part, x;
    lang == null && (lang = LANG);
    idx = XREF[lang].indexOf('"' + id + '":');
    if (!(idx >= 0)) {
      return [];
    }
    part = XREF[lang].slice(idx + id.length + 4);
    idx = part.indexOf('"');
    part = part.slice(0, idx);
    return (function(){
      var i$, ref$, len$, results$ = [];
      for (i$ = 0, len$ = (ref$ = split$.call(part, ',')).length; i$ < len$; ++i$) {
        x = ref$[i$];
        results$.push(x || id);
      }
      return results$;
    }());
  }
  CACHED = {};
  GET = function(url, data, onSuccess, dataType){
    var ref$;
    if (data instanceof Function) {
      ref$ = [null, onSuccess, data], data = ref$[0], dataType = ref$[1], onSuccess = ref$[2];
    }
    if (CACHED[url]) {
      return onSuccess(CACHED[url]);
    }
    return $.get(url, data, function(it){
      return onSuccess(CACHED[url] = it);
    }, dataType).fail(function(){});
  };
  try {
    if (!(isCordova && !DEBUGGING)) {
      throw null;
    }
    document.addEventListener('deviceready', function(){
      try {
        navigator.splashscreen.hide();
      } catch (e$) {}
      isDeviceReady = true;
      return window.doLoad();
    }, false);
  } catch (e$) {
    e = e$;
    $(function(){
      var url;
      $('#F9868').html('&#xF9868;');
      $('#loading').text('載入中，請稍候…');
      if (/http:\/\/(?:www.)?moedict.tw/i.exec(document.URL)) {
        url = "https://www.moedict.tw/";
        if (/^#./.exec(location.hash)) {
          url += location.hash;
        }
        return location.replace(url);
      } else {
        window.doLoad();
        if (/MSIE\s+[678]/.exec(navigator.userAgent)) {
          return $.getScript('https://ajax.googleapis.com/ajax/libs/chrome-frame/1/CFInstall.min.js', function(){
            window.gcfnConfig = {
              imgpath: 'https://raw.github.com/atomantic/jquery.ChromeFrameNotify/master/img/',
              msgPre: '',
              msgLink: '敬請安裝 Google 內嵌瀏覽框，以取得更完整的萌典功能。',
              msgAfter: ''
            };
            return $.getScript('https://raw.github.com/atomantic/jquery.ChromeFrameNotify/master/jquery.gcnotify.min.js', function(){});
          });
        }
      }
    });
  }
  function setPref(k, v){
    try {
      return typeof localStorage != 'undefined' && localStorage !== null ? localStorage.setItem(k, typeof JSON != 'undefined' && JSON !== null ? JSON.stringify(v) : void 8) : void 8;
    } catch (e$) {}
  }
  function getPref(k){
    var ref$;
    try {
      return typeof JSON != 'undefined' && JSON !== null ? JSON.parse((ref$ = typeof localStorage != 'undefined' && localStorage !== null ? localStorage.getItem(k) : void 8) != null ? ref$ : 'null') : void 8;
    } catch (e$) {}
  }
  if (!DEBUGGING && (isCordova || isMobile)) {
    window.Howl = Howl = (function(){
      Howl.displayName = 'Howl';
      var prototype = Howl.prototype, constructor = Howl;
      function Howl(arg$){
        var urls, onend, onloaderror;
        urls = arg$.urls, onend = arg$.onend, onloaderror = arg$.onloaderror;
        this.el = document.createElement('audio');
        this.el.setAttribute('src', urls[0]);
        this.el.setAttribute('type', /mp3$/.exec(urls[0]) ? 'audio/mpeg' : 'audio/ogg');
        this.el.setAttribute('autoplay', true);
        this.el.setAttribute('controls', true);
        this.el.addEventListener('error', onloaderror);
        try {
          this.el.remove();
          this.el = null;
        } catch (e$) {}
        this.el.addEventListener('ended', onend);
        try {
          this.el.remove();
          this.el = null;
        } catch (e$) {}
      }
      prototype.play = function(){
        return this.el.play();
      };
      prototype.stop = function(){
        var ref$;
        try {
          return (ref$ = this.el) != null ? ref$.currentTime = 0 : void 8;
        } catch (e$) {}
      };
      return Howl;
    }());
  }
  window.playAudio = function(el, url){
    var done, play;
    done = function(){
      playing = null;
      player = null;
      return $(el).fadeIn('fast');
    };
    play = function(){
      var urls, audio;
      if (playing === url) {
        return;
      }
      if (player != null) {
        player.stop();
      }
      playing = url;
      $('#result .playAudio').show();
      $(el).fadeOut('fast');
      urls = [url];
      if (/ogg$/.exec(url)) {
        urls.push(url.replace(/ogg$/, 'mp3'));
      }
      audio = new window.Howl({
        buffer: true,
        urls: urls,
        onend: done,
        onloaderror: done
      });
      audio.play();
      return player = audio;
    };
    if (window.Howl) {
      return play();
    }
    return $.getScript('js/howler.min.js', function(){
      return play();
    });
  };
  window.showInfo = function(){
    var ref, onStop, onExit;
    ref = window.open('Android.html', '_blank', 'location=no');
    onStop = function(arg$){
      var url;
      url = arg$.url;
      if (/quit\.html/.exec(url)) {
        return ref.close();
      }
    };
    onExit = function(){
      ref.removeEventListener('loadstop', onStop);
      return ref.removeEventListener('exit', onExit);
    };
    ref.addEventListener('loadstop', onStop);
    return ref.addEventListener('exit', onExit);
  };
  callLater = function(it){
    return setTimeout(it, isMobile ? 10 : 1);
  };
  window.pressDown = function(){
    var val;
    if (/Android\s*[12]\./.exec(navigator.userAgent)) {
      alert("抱歉，Android 2.x 版僅能於上方顯示搜尋框。");
      return;
    }
    $('body').removeClass("prefer-down-" + !!getPref('prefer-down'));
    val = !getPref('prefer-down');
    setPref('prefer-down', val);
    return $('body').addClass("prefer-down-" + !!getPref('prefer-down'));
  };
  window.doLoad = function(){
    var fontSize, saveFontSize, cacheLoading, pressAbout, pressErase, pressBack, init, grokVal, grokHash, fillQuery, prevId, prevVal, bucketOf, lookup, doLookup, htmlCache, fetch, loadJson, setPinyinBindings, setHtml, loadCacheHtml, fillJson, keyMap, fillBucket, i$, ref$, len$, lang;
    if (!isDeviceReady) {
      return;
    }
    if (isCordova) {
      $('body').addClass('cordova');
    }
    if (!isCordova) {
      $('body').addClass('web');
    }
    if (isCordova && !isDroidGap) {
      $('body').addClass('ios');
    }
    if (isDroidGap) {
      $('body').addClass('android');
    }
    if (/Android\s*[12]\./.exec(navigator.userAgent)) {
      $('body').addClass('overflow-scrolling-false');
      $('body').addClass("prefer-down-false");
    } else {
      $('body').addClass("prefer-down-" + !!getPref('prefer-down'));
    }
    $('#result').addClass("prefer-pinyin-" + !!getPref('prefer-pinyin'));
    fontSize = getPref('font-size') || 14;
    $('body').bind('pinch', function(arg$, arg1$){
      var scale;
      scale = arg1$.scale;
      return $('body').css('font-size', Math.max(14, Math.min(22, scale * fontSize)) + 'pt');
    });
    saveFontSize = function(arg$, arg1$){
      var scale;
      scale = arg1$.scale;
      setPref('font-size', fontSize = Math.max(14, Math.min(22, scale * fontSize)));
      return $('body').css('font-size', fontSize + 'pt');
    };
    $('body').bind('pinchclose', saveFontSize);
    $('body').bind('pinchopen', saveFontSize);
    window.adjustFontSize = function(offset){
      setPref('font-size', fontSize = Math.max(14, Math.min(22, fontSize + offset)));
      return $('body').css('font-size', fontSize + 'pt');
    };
    window.adjustFontSize(0);
    cacheLoading = false;
    window.pressAbout = pressAbout = function(){
      if (!isDroidGap) {
        return location.href = 'about.html';
      }
    };
    window.pressErase = pressErase = function(){
      $('#query').val('').focus();
      $('.lang').show();
      return $('.erase').hide();
    };
    window.pressBack = pressBack = function(){
      var token;
      if (player != null) {
        player.stop();
      }
      if (isDroidGap && !$('.ui-autocomplete').hasClass('invisible') && $('body').width() < 768) {
        try {
          $('#query').autocomplete('close');
        } catch (e$) {}
        return;
      }
      if (cacheLoading) {
        return;
      }
      entryHistory.pop();
      token = Math.random();
      cacheLoading = token;
      setTimeout(function(){
        if (cacheLoading === token) {
          return cacheLoading = false;
        }
      }, 10000);
      callLater(function(){
        var id;
        id = entryHistory.length ? entryHistory[entryHistory.length - 1] : MOEID;
        return window.grokVal(id);
      });
      return false;
    };
    try {
      document.addEventListener('backbutton', function(){
        if (entryHistory.length <= 1) {
          window.pressQuit();
        } else {
          window.pressBack();
        }
      }, false);
    } catch (e$) {}
    window.pressQuit = function(){
      return callLater(function(){
        return navigator.app.exitApp();
      });
    };
    init = function(){
      $('#query').keyup(lookup).change(lookup).keypress(lookup).keydown(lookup).on('input', lookup);
      $('#query').on('focus', function(){
        return this.select();
      });
      $('#query').on('click', function(){
        try {
          if ($('#query').val()) {
            return $('#query').autocomplete('search');
          }
        } catch (e$) {}
      });
      $('#query').show();
      if (!isCordova) {
        $('#query').focus();
      }
      if (!('onhashchange' in window)) {
        $('body').on('click', 'a', function(){
          var val;
          val = $(this).attr('href');
          if (val) {
            val = replace$.call(val, /.*\#/, '');
          }
          val || (val = $(this).text());
          window.grokVal(val);
          return false;
        });
      }
      if (window.grokHash()) {
        return;
      }
      if (isCordova) {
        fillQuery(MOEID);
        return $('#query').val('');
      } else if (!/^#./.test(location.hash)) {
        return fetch(MOEID);
      }
    };
    window.grokVal = grokVal = function(val){
      var lang, prevVal;
      if (player != null) {
        player.stop();
      }
      if (/</.exec(val)) {
        return;
      }
      lang = 'a';
      if (/^!/.exec(val + "")) {
        lang = 't';
        val = val.substr(1);
      }
      if (lang !== LANG) {
        LANG = LANG;
        prevVal = '';
        return window.pressLang(lang, val);
      }
      val = b2g(val);
      if (val === prevVal) {
        return true;
      }
      $('#query').show();
      fillQuery(val);
      fetch(val);
      if (val === prevVal) {
        return true;
      }
      return false;
    };
    window.grokHash = grokHash = function(){
      var decode;
      if (!/^#./.test(location.hash)) {
        return false;
      }
      decode = function(it){
        if (/%/.exec(it)) {
          it = decodeURIComponent(it);
        }
        if (/%[A-Fa-f]/.exec(escape(it))) {
          it = decodeURIComponent(escape(it));
        }
        return it;
      };
      try {
        grokVal(decode(location.hash.substr(1)));
      } catch (e$) {}
      return false;
    };
    window.fillQuery = fillQuery = function(it){
      var title, input;
      title = replace$.call(decodeURIComponent(it), /[（(].*/, '');
      title = replace$.call(title, /^!/, '');
      if (/^</.exec(title)) {
        return;
      }
      $('#query').val(title);
      if (!isCordova) {
        $('#cond').val("^" + title + "$");
      }
      input = $('#query').get(0);
      if (isMobile) {
        try {
          $('#query').autocomplete('close');
        } catch (e$) {}
      } else {
        input.focus();
        try {
          input.select();
        } catch (e$) {}
      }
      lookup(title);
      return true;
    };
    prevId = prevVal = null;
    window.pressLang = function(lang, id){
      lang == null && (lang = '');
      id == null && (id = '');
      $('.ui-autocomplete li').remove();
      $('#query').val('');
      prevId = null;
      prevVal = null;
      LANG = lang || (LANG === 'a' ? 't' : 'a');
      setPref('lang', LANG);
      id || (id = {
        a: '萌',
        t: '發穎',
        h: '發芽'
      }[LANG]);
      if (!isCordova) {
        GET(LANG + "/xref.json", function(it){
          return XREF[LANG] = it;
        }, 'text');
        GET(LANG + "/index.json", function(it){
          return INDEX[LANG] = it;
        }, 'text');
      }
      $('body').removeClass("lang-t");
      $('body').removeClass("lang-a");
      $('body').removeClass("lang-h");
      $('body').addClass("lang-" + LANG);
      $('#query').val(id);
      return window.doLookup(id);
    };
    bucketOf = function(it){
      var code;
      code = it.charCodeAt(0);
      if (0xD800 <= code && code <= 0xDBFF) {
        code = it.charCodeAt(1) - 0xDC00;
      }
      return code % (LANG === 'a' ? 1024 : 128);
    };
    lookup = function(){
      var that;
      if (that = $('#query').val()) {
        $('.erase').show();
        $('.lang').hide();
        return doLookup(b2g(that));
      }
      $('.lang').show();
      return $('.erase').hide();
    };
    window.doLookup = doLookup = function(val){
      var title, Index, id, hist;
      title = replace$.call(val, /[（(].*/, '');
      Index = INDEX[LANG];
      if (isCordova || !Index) {
        if (/object/.exec(title)) {
          return;
        }
        if (Index && Index.indexOf("\"" + title + "\"") === -1) {
          return true;
        }
        id = title;
      } else {
        if (prevVal === val) {
          return true;
        }
        prevVal = val;
        if (!(Index.indexOf("\"" + title + "\"") >= 0)) {
          return true;
        }
        id = title;
      }
      if (prevId === id || replace$.call(id, /\(.*/, '') !== replace$.call(val, /\(.*/, '')) {
        return true;
      }
      $('#cond').val("^" + title + "$");
      hist = (LANG === 'a' ? '' : '!') + "" + title;
      if (!(entryHistory.length && entryHistory[entryHistory.length - 1] === hist)) {
        entryHistory.push(hist);
      }
      if (isCordova) {
        $('.back').show();
      }
      fetch(title);
      return true;
    };
    htmlCache = {
      t: [],
      a: []
    };
    fetch = function(it){
      var hash;
      if (!it) {
        return;
      }
      prevId = it;
      prevVal = it;
      setPref('prev-id', prevId);
      hash = (LANG === 'a' ? '#' : '#!') + "" + it;
      try {
        if (location.hash + "" !== hash) {
          history.pushState(null, null, hash);
        }
      } catch (e$) {}
      if (isMobile) {
        $('#result div, #result span, #result h1:not(:first)').hide();
        $('#result h1:first').text(it).show();
      } else {
        $('#result div, #result span, #result h1:not(:first)').css('visibility', 'hidden');
        $('#result h1:first').text(it).css('visibility', 'visible');
        window.scrollTo(0, 0);
      }
      if (loadCacheHtml(it)) {
        return;
      }
      if (it === '萌') {
        return fillJson(MOE, '萌');
      }
      return loadJson(it);
    };
    loadJson = function(id, cb){
      var bucket;
      if (!isCordova) {
        return GET(LANG + "/" + encodeURIComponent(replace$.call(id, /\(.*/, '')) + ".json", null, function(it){
          return fillJson(it, id, cb);
        }, 'text');
      }
      bucket = bucketOf(id);
      return fillBucket(id, bucket, cb);
    };
    setPinyinBindings = function(){
      return $('#result.prefer-pinyin-true .bopomofo .bpmf, #result.prefer-pinyin-false .bopomofo .pinyin').unbind('click').click(function(){
        var val;
        val = !getPref('prefer-pinyin');
        setPref('prefer-pinyin', val);
        $('#result').removeClass("prefer-pinyin-" + !val).addClass("prefer-pinyin-" + val);
        return callLater(setPinyinBindings);
      });
    };
    setHtml = function(html){
      return callLater(function(){
        $('#result').html(html);
        $('#result .part-of-speech a').attr('href', null);
        setPinyinBindings();
        cacheLoading = false;
        if (isCordova && !DEBUGGING) {
          $('#result .playAudio').on('touchstart', function(){
            return $(this).click();
          });
          return;
        }
        $('#result .trs.pinyin').each(function(){
          return $(this).attr('title', trs2bpmf($(this).text()));
        }).tooltip({
          tooltipClass: 'bpmf'
        });
        $('#result a[href]:not(.xref)').tooltip({
          disabled: true,
          tooltipClass: "prefer-pinyin-" + !!getPref('prefer-pinyin'),
          show: 100,
          hide: 100,
          items: 'a',
          content: function(cb){
            var id;
            id = $(this).text();
            callLater(function(){
              if (htmlCache[LANG][id]) {
                cb(htmlCache[LANG][id]);
                return;
              }
              return loadJson(id, function(it){
                return cb(it);
              });
            });
          }
        });
        $('#result a[href]:not(.xref)').hoverIntent({
          timeout: 250,
          over: function(){
            try {
              return $(this).tooltip('open');
            } catch (e$) {}
          },
          out: function(){
            try {
              return $(this).tooltip('close');
            } catch (e$) {}
          }
        });
        return setTimeout(function(){
          $('.ui-tooltip').remove();
          return setTimeout(function(){
            return $('.ui-tooltip').remove();
          }, 250);
        }, 250);
      });
    };
    loadCacheHtml = function(it){
      var html;
      html = htmlCache[LANG][it];
      if (!html) {
        return false;
      }
      setHtml(html);
      return true;
    };
    fillJson = function(part, id, cb){
      var h, html, words, word;
      cb == null && (cb = setHtml);
      while (/"`辨~\u20DE&nbsp`似~\u20DE"[^}]*},{"f":"([^（]+)[^"]*"/.exec(part)) {
        part = part.replace(/"`辨~\u20DE&nbsp`似~\u20DE"[^}]*},{"f":"([^（]+)[^"]*"/, '"辨\u20DE 似\u20DE $1"');
      }
      part = part.replace(/"`(.)~\u20DE"[^}]*},{"f":"([^（]+)[^"]*"/g, '"$1\u20DE $2"');
      part = part.replace(/"([hbpdcnftrelsaqETAVCD_=])":/g, function(arg$, k){
        return keyMap[k] + ':';
      });
      h = (LANG === 'a' ? '#' : '#!') + "";
      part = part.replace(/([「【『（《])`([^~]+)~([。，、；：？！─…．·－」』》〉]+)/g, function(arg$, pre, word, post){
        return "<span class='punct'>" + pre + "<a href='" + h + word + "'>" + word + "</a>" + post + "</span>";
      });
      part = part.replace(/([「【『（《])`([^~]+)~/g, function(arg$, pre, word){
        return "<span class='punct'>" + pre + "<a href='" + h + word + "'>" + word + "</a></span>";
      });
      part = part.replace(/`([^~]+)~([。，、；：？！─…．·－」』》〉]+)/g, function(arg$, word, post){
        return "<span class='punct'><a href='" + h + word + "'>" + word + "</a>" + post + "</span>";
      });
      part = part.replace(/`([^~]+)~/g, function(arg$, word){
        return "<a href='" + h + word + "'>" + word + "</a>";
      });
      if ((typeof JSON != 'undefined' && JSON !== null ? JSON.parse : void 8) != null) {
        html = render(JSON.parse(part));
      } else {
        html = eval("render(" + part + ")");
      }
      html = html.replace(/(.)\u20DE/g, "</span><span class='part-of-speech'>$1</span><span>");
      html = html.replace(RegExp('<a[^<]+>' + id + '<\\/a>', 'g'), id + "");
      html = html.replace(/<a>([^<]+)<\/a>/g, "<a href='" + h + "$1'>$1</a>");
      html = html.replace(RegExp('(>[^<]*)' + id, 'g'), "$1<b>" + id + "</b>");
      html = html.replace(/\uFFF9/g, '<span class="ruby"><span class="rb"><span class="ruby"><span class="rb">').replace(/\uFFFA/g, '</span><br><span class="rt trs pinyin">').replace(/\uFFFB/g, '</span></span></span></span><br><span class="rt mandarin">').replace(/<span class="rt mandarin">\s*<\//g, '</');
      words = xrefOf(id);
      if (words.length) {
        html += '<div class="xrefs">';
        html += "<div class=\"xref-line\">\n    <span class='xref'><span class='part-of-speech'>" + (LANG === 't' ? '華' : '閩') + "</span>";
        html += (function(){
          var i$, ref$, len$, results$ = [];
          for (i$ = 0, len$ = (ref$ = words).length; i$ < len$; ++i$) {
            word = ref$[i$];
            h = (LANG === 't' ? '#' : '#!') + "";
            results$.push("<a class='xref' href='" + h + word + "'>" + word + "</a>");
          }
          return results$;
        }()).join('、');
        html += '</span></div></div>';
      }
      cb(htmlCache[LANG][id] = html);
    };
    keyMap = {
      h: '"heteronyms"',
      b: '"bopomofo"',
      p: '"pinyin"',
      d: '"definitions"',
      c: '"stroke_count"',
      n: '"non_radical_stroke_count"',
      f: '"def"',
      t: '"title"',
      r: '"radical"',
      e: '"example"',
      l: '"link"',
      s: '"synonyms"',
      a: '"antonyms"',
      q: '"quote"',
      _: '"id"',
      '=': '"audio_id"',
      E: '"english"',
      T: '"trs"',
      A: '"alt"',
      V: '"vernacular"',
      C: '"combined"',
      D: '"dialects"'
    };
    fillBucket = function(id, bucket, cb){
      return GET("p" + LANG + "ck/" + bucket + ".txt", function(raw){
        var key, idx, part;
        key = escape(id);
        idx = raw.indexOf('"' + key + '"');
        if (idx === -1) {
          return;
        }
        part = raw.slice(idx + key.length + 3);
        idx = part.indexOf('\n');
        part = part.slice(0, idx);
        return fillJson(part, id, cb);
      });
    };
    if (isCordova) {
      for (i$ = 0, len$ = (ref$ = ['a', 't']).length; i$ < len$; ++i$) {
        lang = ref$[i$];
        (fn$.call(this, lang));
      }
    } else {
      GET(LANG + "/xref.json", function(it){
        XREF[LANG] = it;
        return init();
      }, 'text');
      GET(LANG + "/index.json", function(it){
        INDEX[LANG] = it;
        return initAutocomplete();
      }, 'text');
      for (i$ = 0, len$ = (ref$ = ['a', 't']).length; i$ < len$; ++i$) {
        lang = ref$[i$];
        if (lang !== LANG) {
          (fn1$.call(this, lang));
        }
      }
    }
    return GET("t/variants.json", function(it){
      return XREF.tv = it;
    }, 'text');
    function fn$(lang){
      GET(lang + "/xref.json", function(it){
        XREF[lang] = it;
        if (lang === LANG) {
          return init();
        }
      }, 'text');
      GET(lang + "/index.1.json", function(p1){
        return GET(lang + "/index.2.json", function(p2){
          INDEX[lang] = p1 + p2;
          if (lang === LANG) {
            return initAutocomplete();
          }
        }, 'text');
      }, 'text');
    }
    function fn1$(lang){
      GET(lang + "/xref.json", function(it){
        return XREF[lang] = it;
      }, 'text');
    }
  };
  MOE = '{"n":8,"t":"萌","r":"`艸~","Deutsch":"Leute, Menschen (u.E.) (S)","c":12,"francais":"germer","English":"to sprout","h":[{"d":[{"q":["`說文解字~：「`萌~，`艸~`芽~`也~。」","`唐~．`韓愈~、`劉~`師~`服~、`侯~`喜~、`軒轅~`彌~`明~．`石~`鼎~`聯句~：「`秋~`瓜~`未~`落~`蒂~，`凍~`芋~`強~`抽~`萌~。」"],"type":"`名~","f":"`草木~`初~`生~`的~`芽~。"},{"q":["`韓非子~．`說~`林~`上~：「`聖人~`見~`微~`以~`知~`萌~，`見~`端~`以~`知~`末~。」","`漢~．`蔡邕~．`對~`詔~`問~`灾~`異~`八~`事~：「`以~`杜漸防萌~，`則~`其~`救~`也~。」"],"type":"`名~","f":"`事物~`發生~`的~`開端~`或~`徵兆~。"},{"type":"`名~","l":["`通~「`氓~」。"],"e":["`如~：「`萌黎~」、「`萌隸~」。"],"f":"`人民~。"},{"type":"`名~","f":"`姓~。`如~`五代~`時~`蜀~`有~`萌~`慮~。"},{"q":["`楚辭~．`王~`逸~．`九思~．`傷~`時~：「`明~`風~`習習~`兮~`龢~`暖~，`百草~`萌~`兮~`華~`榮~。」"],"type":"`動~","e":["`如~：「`萌芽~」。"],"f":"`發芽~。"},{"q":["`管子~．`牧民~：「`惟~`有道~`者~，`能~`備~`患~`於~`未~`形~`也~，`故~`禍~`不~`萌~。」","`三國演義~．`第一~`回~：「`若~`萌~`異心~，`必~`獲~`惡報~。」"],"type":"`動~","e":["`如~：「`故態復萌~」。"],"f":"`發生~。"}],"p":"méng","b":"ㄇㄥˊ","=":"0676"}],"translation":{"francais":["germer"],"Deutsch":["Leute, Menschen (u.E.) (S)","Meng (u.E.) (Eig, Fam)","keimen, sprießen, knospen, ausschlagen (u.E.)"],"English":["to sprout","to bud","to have a strong affection for (slang)","adorable (loanword from Japanese `萌~え moe, slang describing affection for a cute character)"]}}';
  function initAutocomplete(){
    $.widget("ui.autocomplete", $.ui.autocomplete, {
      _close: function(){
        return this.menu.element.addClass('invisible');
      },
      _resizeMenu: function(){
        var ul;
        ul = this.menu.element;
        ul.outerWidth(Math.max(ul.width("").outerWidth() + 1, this.element.outerWidth()));
        return ul.removeClass('invisible');
      },
      _value: function(it){
        if (it) {
          fillQuery(it);
        }
        return this.valueMethod.apply(this.element, arguments);
      }
    });
    return $('#query').autocomplete({
      position: {
        my: "left bottom",
        at: "left top"
      },
      select: function(e, arg$){
        var item;
        item = arg$.item;
        if (/^\(/.exec(item != null ? item.value : void 8)) {
          return false;
        }
        if (item != null && item.value) {
          fillQuery(item.value);
        }
        return true;
      },
      change: function(e, arg$){
        var item;
        item = arg$.item;
        if (/^\(/.exec(item != null ? item.value : void 8)) {
          return false;
        }
        if (item != null && item.value) {
          fillQuery(item.value);
        }
        return true;
      },
      source: function(arg$, cb){
        var term, regex, results, i$, ref$, len$, v, MaxResults, more;
        term = arg$.term;
        if (!term.length) {
          return cb([]);
        }
        if (!/[^\u0000-\u00FF]/.test(term)) {
          return cb([]);
        }
        term = term.replace(/\*/g, '%');
        regex = term;
        if (/\s$/.exec(term) || /\^/.exec(term)) {
          regex = replace$.call(regex, /\^/g, '');
          regex = replace$.call(regex, /\s*$/g, '');
          regex = '"' + regex;
        } else {
          if (!/[?._%]/.test(term)) {
            regex = '[^"]*' + regex;
          }
        }
        if (/^\s/.exec(term) || /\$/.exec(term)) {
          regex = replace$.call(regex, /\$/g, '');
          regex = replace$.call(regex, /\s*/g, '');
          regex += '"';
        } else {
          if (!/[?._%]/.test(term)) {
            regex = regex + '[^"]*';
          }
        }
        regex = replace$.call(regex, /\s/g, '');
        if (/[%?._]/.exec(term)) {
          regex = regex.replace(/[?._]/g, '[^"]');
          regex = regex.replace(/%/g, '[^"]*');
          regex = "\"" + regex + "\"";
        }
        regex = regex.replace(/\(\)/g, '');
        try {
          results = INDEX[LANG].match(RegExp(b2g(regex) + '', 'g'));
        } catch (e$) {}
        results || (results = xrefOf(term, LANG === 't' ? 'a' : 't'));
        if (LANG === 't') {
          for (i$ = 0, len$ = (ref$ = xrefOf(term, 'tv').reverse()).length; i$ < len$; ++i$) {
            v = ref$[i$];
            if (!in$(v, results)) {
              results.unshift(v);
            }
          }
        }
        if (!(results != null && results.length)) {
          return cb(['']);
        }
        if (results.length === 1) {
          doLookup(replace$.call(results[0], /"/g, ''));
        }
        MaxResults = 400;
        if (results.length > MaxResults) {
          more = "(僅顯示前 " + MaxResults + " 筆)";
          results = results.slice(0, MaxResults);
          results.push(more);
        }
        return cb((replace$.call(results.join(','), /"/g, '')).split(','));
      }
    });
  }
  CJKRADICALS = '⼀一⼁丨⼂丶⼃丿⼄乙⼅亅⼆二⼇亠⼈人⼉儿⼊入⼋八⼌冂⼍冖⼎冫⼏几⼐凵⼑刀⼒力⼓勹⼔匕⼕匚⼖匸⼗十⼘卜⼙卩⼚厂⼛厶⼜又⼝口⼞囗⼟土⼠士⼡夂⼢夊⼣夕⼤大⼥女⼦子⼧宀⼨寸⼩小⼪尢⼫尸⼬屮⼭山⼮巛⼯工⼰己⼱巾⼲干⼳幺⼴广⼵廴⼶廾⼷弋⼸弓⼹彐⼺彡⼻彳⼼心⼽戈⼾戶⼿手⽀支⽁攴⽂文⽃斗⽄斤⽅方⽆无⽇日⽈曰⽉月⽊木⽋欠⽌止⽍歹⽎殳⽏毋⽐比⽑毛⽒氏⽓气⽔水⽕火⽖爪⽗父⽘爻⽙爿⺦丬⽚片⽛牙⽜牛⽝犬⽞玄⽟玉⽠瓜⽡瓦⽢甘⽣生⽤用⽥田⽦疋⽧疒⽨癶⽩白⽪皮⽫皿⽬目⽭矛⽮矢⽯石⽰示⽱禸⽲禾⽳穴⽴立⽵竹⽶米⽷糸⺰纟⽸缶⽹网⽺羊⽻羽⽼老⽽而⽾耒⽿耳⾀聿⾁肉⾂臣⾃自⾄至⾅臼⾆舌⾇舛⾈舟⾉艮⾊色⾋艸⾌虍⾍虫⾎血⾏行⾐衣⾑襾⾒見⻅见⾓角⾔言⻈讠⾕谷⾖豆⾗豕⾘豸⾙貝⻉贝⾚赤⾛走⾜足⾝身⾞車⻋车⾟辛⾠辰⾡辵⻌辶⾢邑⾣酉⾤釆⾥里⾦金⻐钅⾧長⻓长⾨門⻔门⾩阜⾪隶⾫隹⾬雨⾭靑⾮非⾯面⾰革⾱韋⻙韦⾲韭⾳音⾴頁⻚页⾵風⻛风⾶飛⻜飞⾷食⻠饣⾸首⾹香⾺馬⻢马⾻骨⾼高⾽髟⾾鬥⾿鬯⿀鬲⿁鬼⿂魚⻥鱼⻦鸟⿃鳥⿄鹵⻧卤⿅鹿⿆麥⻨麦⿇麻⿈黃⻩黄⿉黍⿊黑⿋黹⿌黽⻪黾⿍鼎⿎鼓⿏鼠⿐鼻⿑齊⻬齐⿒齒⻮齿⿓龍⻰龙⿔龜⻳龟⿕龠';
  SIMPTRAD = (ref$ = window.SIMPTRAD) != null ? ref$ : '';
  function b2g(str){
    var rv, i$, ref$, len$, char, idx;
    if (LANG === 't') {
      return str;
    }
    rv = '';
    for (i$ = 0, len$ = (ref$ = split$.call(str, '')).length; i$ < len$; ++i$) {
      char = ref$[i$];
      idx = SIMPTRAD.indexOf(char);
      rv += idx % 2
        ? char
        : SIMPTRAD[idx + 1];
    }
    return rv;
  }
  function renderRadical(char){
    var idx;
    idx = CJKRADICALS.indexOf(char);
    if (idx % 2) {
      return char;
    }
    return CJKRADICALS[idx + 1];
  }
  function canPlayMp3(){
    var a;
    if (CACHED.canPlayMp3 != null) {
      return CACHED.canPlayMp3;
    }
    a = document.createElement('audio');
    return CACHED.canPlayMp3 = !!(replace$.call(typeof a.canPlayType === 'function' ? a.canPlayType('audio/mpeg') : void 8, /no/, ''));
  }
  function canPlayOgg(){
    var a;
    if (CACHED.canPlayOgg != null) {
      return CACHED.canPlayOgg;
    }
    a = document.createElement('audio');
    return CACHED.canPlayOgg = !!(replace$.call(typeof a.canPlayType === 'function' ? a.canPlayType('audio/ogg') : void 8, /no/, ''));
  }
  function render(arg$){
    var title, english, heteronyms, radical, translation, nrsCount, sCount, charHtml, result;
    title = arg$.title, english = arg$.english, heteronyms = arg$.heteronyms, radical = arg$.radical, translation = arg$.translation, nrsCount = arg$.non_radical_stroke_count, sCount = arg$.stroke_count;
    charHtml = radical ? "<div class='radical'><span class='glyph'>" + renderRadical(replace$.call(radical, /<\/?a[^>]*>/g, '')) + "</span><span class='count'><span class='sym'>+</span>" + nrsCount + "</span><span class='count'> = " + sCount + "</span> 畫</div>" : '';
    result = ls(heteronyms, function(arg$){
      var id, audio_id, ref$, bopomofo, pinyin, trs, definitions, antonyms, synonyms, variants, basename, mp3;
      id = arg$.id, audio_id = (ref$ = arg$.audio_id) != null ? ref$ : id, bopomofo = arg$.bopomofo, pinyin = arg$.pinyin, trs = (ref$ = arg$.trs) != null ? ref$ : '', definitions = (ref$ = arg$.definitions) != null
        ? ref$
        : [], antonyms = arg$.antonyms, synonyms = arg$.synonyms, variants = arg$.variants;
      pinyin == null && (pinyin = trs);
      pinyin = replace$.call(pinyin, /<[^>]*>/g, '').replace(/（.*）/, '');
      bopomofo == null && (bopomofo = trs2bpmf(pinyin + ""));
      bopomofo = replace$.call(bopomofo.replace(/ /g, '\u3000').replace(/([ˇˊˋ])\u3000/g, '$1 '), /<[^>]*>/g, '');
      return charHtml + "\n<h1 class='title'>" + h(title) + (audio_id && (canPlayOgg() || canPlayMp3()) && (LANG === 't' && !(20000 < audio_id && audio_id < 50000)
        ? (basename = replace$.call(100000 + Number(audio_id), /^1/, ''), mp3 = "http://t.moedict.tw/" + basename + ".ogg")
        : LANG === 'a' && (mp3 = "http://a.moedict.tw/" + audio_id + ".ogg"), mp3 && !canPlayOgg() && (mp3 = mp3.replace(/ogg$/, 'mp3'))), mp3 ? "<span class='playAudio' onclick='window.playAudio(this, \"" + mp3 + "\")'>▶</span>" : '') + (english ? "<span class='english'>(" + english + ")</span>" : '') + "</h1>" + (bopomofo ? "<div class='bopomofo'>" + (pinyin ? "<span class='pinyin'>" + h(pinyin) + "</span>" : '') + "<span class='bpmf'>" + h(bopomofo) + "</span></div>" : '') + "<div class=\"entry\">\n" + ls(groupBy('type', definitions.slice()), function(defs){
        return "<div>\n" + (defs[0].type ? "<span class='part-of-speech'>" + defs[0].type + "</span>" : '') + "\n<ol>\n" + ls(defs, function(arg$){
          var type, def, quote, ref$, example, link, antonyms, synonyms;
          type = arg$.type, def = arg$.def, quote = (ref$ = arg$.quote) != null
            ? ref$
            : [], example = (ref$ = arg$.example) != null
            ? ref$
            : [], link = (ref$ = arg$.link) != null
            ? ref$
            : [], antonyms = arg$.antonyms, synonyms = arg$.synonyms;
          return "<li><p class='definition'>\n    <span class=\"def\">" + h(expandDef(def)).replace(/([：。」])([\u278A-\u2793\u24eb-\u24f4])/g, '$1</span><span class="def">$2') + "</span>\n    " + ls(example, function(it){
            return "<span class='example'>" + h(it) + "</span></span>";
          }) + "\n    " + ls(quote, function(it){
            return "<span class='quote'>" + h(it) + "</span>";
          }) + "\n    " + ls(link, function(it){
            return "<span class='link'>" + h(it) + "</span>";
          }) + "\n    " + (synonyms ? "<span class='synonyms'><span class='part-of-speech'>似</span> " + h(synonyms.replace(/,/g, '、')) + "</span>" : '') + "\n    " + (antonyms ? "<span class='antonyms'><span class='part-of-speech'>反</span> " + h(antonyms.replace(/,/g, '、')) + "</span>" : '') + "\n</p></li>";
        }) + "</ol></div>";
      }) + "\n" + (synonyms ? "<span class='synonyms'><span class='part-of-speech'>似</span> " + h(synonyms.replace(/,/g, '、')) + "</span>" : '') + "\n" + (antonyms ? "<span class='antonyms'><span class='part-of-speech'>反</span> " + h(antonyms.replace(/,/g, '、')) + "</span>" : '') + "\n" + (variants ? "<span class='variants'><span class='part-of-speech'>異</span> " + h(variants.replace(/,/g, '、')) + "</span>" : '') + "\n</div>";
    });
    return result + "" + (translation ? "<div class='xrefs'><span class='translation'>" + ('English' in translation ? "<div class='xref-line'><span class='fw_lang'>英</span><span class='fw_def'>" + ((join$.call(translation.English, ', ')).replace(/, CL:.*/, '')) + "</span></div>" : '') + "" + ('francais' in translation ? "<div class='xref-line'><span class='fw_lang'>法</span><span class='fw_def'>" + join$.call(translation.francais, ', ') + "</span></div>" : '') + "" + ('Deutsch' in translation ? "<div class='xref-line'><span class='fw_lang'>德</span><span class='fw_def'>" + join$.call(translation.Deutsch, ', ') + "</span></div>" : '') + "</span></div>" : '');
    function expandDef(def){
      return def.replace(/^\s*<(\d)>\s*([介代副助動名嘆形連]?)/, function(_, num, char){
        return String.fromCharCode(0x327F + parseInt(num)) + "" + (char ? char + "\u20DE" : '');
      }).replace(/<(\d)>/g, function(_, num){
        return String.fromCharCode(0x327F + parseInt(num));
      }).replace(/[（(](\d)[)）]/g, function(_, num){
        return String.fromCharCode(0x2789 + parseInt(num));
      }).replace(/\(/g, '（').replace(/\)/g, '）');
    }
    function ls(entries, cb){
      var x;
      entries == null && (entries = []);
      return (function(){
        var i$, ref$, len$, results$ = [];
        for (i$ = 0, len$ = (ref$ = entries).length; i$ < len$; ++i$) {
          x = ref$[i$];
          results$.push(cb(x));
        }
        return results$;
      }()).join("");
    }
    function h(text){
      text == null && (text = '');
      if (!isCordova) {
        text = text.replace(/\uFF0E/g, '\u00B7');
      }
      text = text.replace(/\u223C/g, '\uFF0D');
      if (isCordova) {
        if (isDroidGap) {
          return text.replace(/\u030d/g, '\u0358');
        }
        return text.replace(/\u0358/g, '\u030d');
      }
      return text;
    }
    function groupBy(prop, xs){
      var x, pre, y;
      if (xs.length <= 1) {
        return [xs];
      }
      x = xs.shift();
      x[prop] == null && (x[prop] = '');
      pre = [x];
      while (xs.length) {
        y = xs[0];
        y[prop] == null && (y[prop] = '');
        if (x[prop] !== y[prop]) {
          break;
        }
        pre.push(xs.shift());
      }
      if (!xs.length) {
        return [pre];
      }
      return [pre].concat(slice$.call(groupBy(prop, xs)));
    }
    return groupBy;
  }
  Consonants = {
    p: 'ㄅ',
    b: 'ㆠ',
    ph: 'ㄆ',
    m: 'ㄇ',
    t: 'ㄉ',
    th: 'ㄊ',
    n: 'ㄋ',
    l: 'ㄌ',
    k: 'ㄍ',
    g: 'ㆣ',
    kh: 'ㄎ',
    ng: 'ㄫ',
    h: 'ㄏ',
    tsi: 'ㄐ',
    ji: 'ㆢ',
    tshi: 'ㄑ',
    si: 'ㄒ',
    ts: 'ㄗ',
    j: 'ㆡ',
    tsh: 'ㄘ',
    s: 'ㄙ'
  };
  Vowels = {
    a: 'ㄚ',
    an: 'ㄢ',
    ang: 'ㄤ',
    ann: 'ㆩ',
    oo: 'ㆦ',
    onn: 'ㆧ',
    o: 'ㄜ',
    e: 'ㆤ',
    enn: 'ㆥ',
    ai: 'ㄞ',
    ainn: 'ㆮ',
    au: 'ㄠ',
    aunn: 'ㆯ',
    am: 'ㆰ',
    om: 'ㆱ',
    m: 'ㆬ',
    ong: 'ㆲ',
    ng: 'ㆭ',
    i: 'ㄧ',
    inn: 'ㆪ',
    u: 'ㄨ',
    unn: 'ㆫ',
    ing: 'ㄧㄥ',
    'in': 'ㄧㄣ',
    un: 'ㄨㄣ'
  };
  Tones = {
    p: 'ㆴ',
    t: 'ㆵ',
    k: 'ㆶ',
    h: 'ㆷ',
    p$: "ㆴ\u0358",
    t$: "ㆵ\u0358",
    k$: "ㆶ\u0358",
    h$: "ㆷ\u0358",
    "\u0300": '˪',
    "\u0301": 'ˋ',
    "\u0302": 'ˊ',
    "\u0304": '˫',
    "\u030d": '$'
  };
  re = function(it){
    var k;
    return (function(){
      var results$ = [];
      for (k in it) {
        results$.push(k);
      }
      return results$;
    }()).sort(function(x, y){
      return y.length - x.length;
    }).join('|');
  };
  C = re(Consonants);
  V = re(Vowels);
  function trs2bpmf(trs){
    if (LANG === 'a') {
      return trs;
    }
    return trs.replace(/[A-Za-z\u0300-\u030d]+/g, function(it){
      var tone;
      tone = '';
      it = it.toLowerCase();
      it = it.replace(/([\u0300-\u0302\u0304\u030d])/, function(it){
        tone = Tones[it];
        return '';
      });
      it = it.replace(/^(tsh?|[sj])i/, '$1ii');
      it = it.replace(/ok$/, 'ook');
      it = it.replace(RegExp('^(' + C + ')((?:' + V + ')+[ptkh]?)$'), function(){
        return Consonants[arguments[1]] + arguments[2];
      });
      it = it.replace(/[ptkh]$/, function(it){
        tone = Tones[it + tone];
        return '';
      });
      it = it.replace(RegExp('(' + V + ')', 'g'), function(it){
        return Vowels[it];
      });
      return it + (tone || '\uFFFD');
    }).replace(/[- ]/g, '').replace(/\uFFFD/g, ' ').replace(/\. ?/g, '。').replace(/\? ?/g, '？').replace(/\! ?/g, '！').replace(/\, ?/g, '，');
  }
  function in$(x, arr){
    var i = -1, l = arr.length >>> 0;
    while (++i < l) if (x === arr[i] && i in arr) return true;
    return false;
  }
}).call(this);
