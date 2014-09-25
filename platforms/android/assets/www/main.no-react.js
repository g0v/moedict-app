(function(){
  var isCordova, DEBUGGING, ref$, STANDALONE, any, map, LANG, MOEID, XREFLABELOF, TITLEOF, HASHOF, STARRED, res$, key, LRU, isQuery, isDroidGap, isDeviceReady, isMobile, isApp, isWebKit, isGecko, isChrome, widthIsXs, entryHistory, INDEX, XREF, CACHED, addToLru, GET, e, playing, player, seq, getEl, callLater, MOE, PUA2UNI, trs_lookup, CJKRADICALS, SIMPTRAD, httpMap, Consonants, Vowels, Tones, re, C, V, LoadedScripts, split$ = ''.split, replace$ = ''.replace, join$ = [].join, slice$ = [].slice;
  window.isCordova = isCordova = !/^https?:/.test(document.URL);
  DEBUGGING = !isCordova && !!((ref$ = window.cordova) != null && ref$.require);
  STANDALONE = window.STANDALONE || false;
  ref$ = require('prelude-ls'), any = ref$.any, map = ref$.map;
  LANG = STANDALONE || getPref('lang') || (/twblg/.exec(document.URL) ? 't' : 'a');
  MOEID = getPref('prev-id') || {
    a: '萌',
    t: '發穎',
    h: '發芽',
    c: '萌'
  }[LANG];
  $(function(){
    $('body').addClass("lang-" + LANG);
    return $('.lang-active').text($(".lang-option." + LANG + ":first").text());
  });
  XREFLABELOF = {
    a: '華',
    t: '閩',
    h: '客',
    c: '陸',
    ca: '臺'
  };
  TITLEOF = {
    a: '',
    t: '臺語',
    h: '客語',
    c: '兩岸'
  };
  HASHOF = {
    a: '#',
    t: "#'",
    h: '#:',
    c: '#~'
  };
  if (isCordova || DEBUGGING) {
    if (STANDALONE) {
      HASHOF = (ref$ = {}, ref$[STANDALONE + ""] = HASHOF[STANDALONE], ref$);
    } else {
      delete HASHOF.c;
    }
  }
  res$ = {};
  for (key in HASHOF) {
    res$[key] = getPref("starred-" + key) || "";
  }
  STARRED = res$;
  res$ = {};
  for (key in HASHOF) {
    res$[key] = getPref("lru-" + key) || "";
  }
  LRU = res$;
  isQuery = /^\?q=/.exec(location.search);
  if (/\?_escaped_fragment_=(.+)/.exec(location.search)) {
    isQuery = true;
    MOEID = decodeURIComponent(RegExp.$1);
    LANG = 't';
  }
  isDroidGap = isCordova && /android_asset/.exec(location.href);
  isDeviceReady = !isCordova;
  if (DEBUGGING) {
    isCordova = true;
  }
  isMobile = isCordova || 'ontouchstart' in window || in$('onmsgesturechange', window);
  if (isCordova || (function(){
    var ref$;
    try {
      return ((ref$ = window.locationbar) != null ? ref$.visible : void 8) === false;
    } catch (e$) {}
  }())) {
    isApp = true;
  }
  isWebKit = /WebKit/.exec(navigator.userAgent);
  isGecko = /\bGecko\/\b/.exec(navigator.userAgent);
  isChrome = /\bChrome\/\b/.exec(navigator.userAgent);
  widthIsXs = function(){
    return $('body').width() < 768;
  };
  entryHistory = [];
  INDEX = {
    t: '',
    a: '',
    h: '',
    c: ''
  };
  XREF = {
    t: {
      a: '"發穎":"萌,抽芽,發芽,萌芽"'
    },
    a: {
      t: '"萌":"發穎"',
      h: '"萌":"發芽"'
    },
    h: {
      a: '"發芽":"萌,萌芽"'
    },
    tv: {
      t: ''
    }
  };
  if (isCordova && STANDALONE !== 'c') {
    delete HASHOF.c;
    delete INDEX.c;
    $(function(){
      return $('.nav .c').remove();
    });
  }
  function xrefOf(id, srcLang, tgtLangOnly){
    var rv, parsed, i$, ref$, len$, chunk, ref1$, tgtLang, words, idx, part, x;
    srcLang == null && (srcLang = LANG);
    rv = {};
    if (typeof XREF[srcLang] === 'string') {
      parsed = {};
      for (i$ = 0, len$ = (ref$ = XREF[srcLang].split('}')).length; i$ < len$; ++i$) {
        chunk = ref$[i$];
        ref1$ = chunk.split('":{'), tgtLang = ref1$[0], words = ref1$[1];
        if (words) {
          parsed[tgtLang.slice(-1)] = words;
        }
      }
      XREF[srcLang] = parsed;
    }
    for (tgtLang in ref$ = XREF[srcLang]) {
      words = ref$[tgtLang];
      if (tgtLangOnly && tgtLang !== tgtLangOnly) {
        continue;
      }
      idx = words.indexOf('"' + id + '":');
      rv[tgtLang] = idx < 0
        ? []
        : (part = words.slice(idx + id.length + 4), idx = part.indexOf('"'), part = part.slice(0, idx), (fn$()));
      if (tgtLangOnly) {
        return rv[tgtLang];
      }
    }
    return rv;
    function fn$(){
      var i$, ref$, len$, results$ = [];
      for (i$ = 0, len$ = (ref$ = split$.call(part, ',')).length; i$ < len$; ++i$) {
        x = ref$[i$];
        results$.push(x || id);
      }
      return results$;
    }
  }
  CACHED = {};
  addToLru = function(it){
    var key, lru;
    key = "\"" + it + "\"\n";
    LRU[LANG] = key + (LRU[LANG] = replace$.call(LRU[LANG], key + "", ''));
    lru = split$.call(LRU[LANG], '\n');
    if (lru.length > 5000) {
      if (!isCordova) {
        rmPref("GET " + LANG + "/" + encodeURIComponent(lru.pop().slice(1, -1)) + ".json");
      }
      LRU[LANG] = join$.call(lru, '\n') + '\n';
    }
    return setPref("lru-" + LANG, LRU[LANG]);
  };
  GET = function(url, data, onSuccess, dataType){
    var ref$, that, success, error, beforeSend;
    if (data instanceof Function) {
      ref$ = [null, onSuccess, data], data = ref$[0], dataType = ref$[1], onSuccess = ref$[2];
    }
    if (that = CACHED[url]) {
      return onSuccess(that);
    }
    dataType == null && (dataType = 'text');
    success = function(it){
      if (/^[a-z]\/([^-a-z@=].+)\.json$/.exec(url)) {
        addToLru(decodeURIComponent(RegExp.$1));
        if (!isCordova) {
          setPref("GET " + url, it);
        }
      }
      return onSuccess(CACHED[url] = it);
    };
    error = function(){
      var that;
      if (that = getPref("GET " + url)) {
        return onSuccess(CACHED[url] = that);
      }
    };
    beforeSend = function(it){
      if (dataType === 'text') {
        return it.overrideMimeType('text/plain; charset=UTF-8');
      }
    };
    return $.ajax({
      url: url,
      data: data,
      dataType: dataType,
      success: success,
      error: error,
      beforeSend: beforeSend
    });
  };
  try {
    if (!(isCordova && !DEBUGGING)) {
      throw null;
    }
    document.addEventListener('deviceready', function(){
      isDeviceReady = true;
      $('body').on('click', 'a[target]', function(){
        var href;
        href = $(this).attr('href');
        window.open(href, '_system');
        return false;
      });
      return window.doLoad();
    }, false);
    document.addEventListener('pause', function(){
      return stopAudio();
    }, false);
  } catch (e$) {
    e = e$;
    $(function(){
      var url;
      $('#F9868').html('&#xF9868;');
      $('#loading').text('載入中，請稍候…');
      if (/^http:\/\/(?:www.)?moedict.tw/i.exec(document.URL)) {
        url = "https://www.moedict.tw/";
        if (/^#./.exec(location.hash)) {
          url += location.hash;
        }
        return location.replace(url);
      } else {
        if (/MSIE\s+[678]/.exec(navigator.userAgent)) {
          $('.navbar, .query-box').hide();
          $('#result').css('margin-top', '50px');
        }
        return window.doLoad();
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
      return $.parseJSON((ref$ = typeof localStorage != 'undefined' && localStorage !== null ? localStorage.getItem(k) : void 8) != null ? ref$ : 'null');
    } catch (e$) {}
  }
  function rmPref(k){
    try {
      return typeof localStorage != 'undefined' && localStorage !== null ? localStorage.removeItem(k) : void 8;
    } catch (e$) {}
  }
  seq = 0;
  getEl = function(){
    return $("#player-" + seq);
  };
  window.stopAudio = function(){
    var $el;
    $el = getEl();
    if ($el.length) {
      $el.parent('.audioBlock').removeClass('playing');
      $el.removeClass('icon-stop').removeClass('icon-spinner').show();
      $el.addClass('icon-play');
    }
    if (player != null) {
      player.unload();
    }
    player = null;
    return playing = null;
  };
  window.playAudio = function(el, url){
    var done, play;
    done = function(){
      return stopAudio();
    };
    play = function(){
      var $el, urls, audio;
      $el = getEl();
      if (playing === url) {
        if ($el.hasClass('icon-stop')) {
          stopAudio();
          done();
        }
        return;
      }
      stopAudio();
      seq++;
      $(el).attr('id', "player-" + seq);
      $el = getEl();
      playing = url;
      $('#result .playAudio').show();
      $('.audioBlock').removeClass('playing');
      $el.removeClass('icon-play').addClass('icon-spinner');
      $el.parent('.audioBlock').addClass('playing');
      urls = [url];
      if (/(ogg|opus)$/.exec(url) && canPlayMp3() && !isGecko) {
        urls.unshift(url.replace(/(ogg|opus)$/, 'mp3'));
      }
      audio = new window.Howl({
        buffer: true,
        urls: urls,
        onend: done,
        onloaderror: done,
        onplay: function(){
          return $el.removeClass('icon-play').removeClass('icon-spinner').addClass('icon-stop').show();
        }
      });
      audio.play();
      return player = audio;
    };
    if (window.Howl) {
      return play();
    }
    return getScript('js/howler.js', function(){
      return play();
    });
  };
  window.showInfo = function(){
    var ref, onStop, onExit;
    ref = window.open('about.html', '_blank', 'location=no');
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
  window.doLoad = function(){
    var fontSize, saveFontSize, cacheLoading, pressAbout, pressErase, pressBack, init, grokVal, grokHash, fillQuery, prevId, prevVal, bucketOf, lookup, doLookup, htmlCache, res$, key, fetch, loadJson, setPinyinBindings, setHtml, loadCacheHtml, fillJson, keyMap, fillBucket, lang, i$, results$ = [];
    if (!isDeviceReady) {
      return;
    }
    if (isCordova) {
      $('body').addClass('cordova');
    }
    if (isApp) {
      $('body').addClass('app');
    }
    if (!isApp) {
      $('body').addClass('web');
    }
    if (isCordova && !isDroidGap) {
      $('body').addClass('ios');
    }
    if (!(isMobile || isApp)) {
      $('body').addClass('desktop');
    }
    if (isDroidGap) {
      $('body').addClass('android');
    }
    if (!(STANDALONE && isDroidGap)) {
      window.IS_GOOGLE_AFS_IFRAME_ = true;
      setTimeout(function(){
        var cx, gcse, s, pollGsc;
        cx = '007966820757635393756:sasf0rnevk4';
        gcse = document.createElement('script');
        gcse.type = 'text/javascript';
        gcse.async = true;
        gcse.src = (document.location.protocol === 'https:' ? 'https:' : 'http:') + "//www.google.com/cse/cse.js?cx=" + cx;
        s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(gcse, s);
        pollGsc = function(){
          if (!$('.gsc-input').length) {
            return setTimeout(pollGsc, 500);
          }
          $('.gsc-input').attr('placeholder', '全文檢索');
          return isQuery = false;
        };
        return setTimeout(pollGsc, 500);
      }, 1);
    }
    if (!(isApp || widthIsXs())) {
      setTimeout(function(){
        return !function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+"://platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");;
      }, 1);
    }
    if (/Android\s*[12]\./.exec(navigator.userAgent)) {
      $('body').addClass('overflow-scrolling-false');
      $('body').addClass("prefer-down-false");
    } else {
      $('body').addClass('overflow-scrolling-true');
      $('body').addClass("prefer-down-false");
    }
    $('#result').addClass("prefer-pinyin-true");
    fontSize = getPref('font-size') || 14;
    $('body').bind('pinch', function(arg$, arg1$){
      var scale;
      scale = arg1$.scale;
      return $('body').css('font-size', Math.max(10, Math.min(42, scale * fontSize)) + 'pt');
    });
    saveFontSize = function(arg$, arg1$){
      var scale;
      scale = arg1$.scale;
      setPref('font-size', fontSize = Math.max(10, Math.min(42, scale * fontSize)));
      return $('body').css('font-size', fontSize + 'pt');
    };
    $('body').bind('pinchclose', saveFontSize);
    $('body').bind('pinchopen', saveFontSize);
    window.adjustFontSize = function(offset){
      setPref('font-size', fontSize = Math.max(10, Math.min(42, fontSize + offset)));
      return $('body').css('font-size', fontSize + 'pt');
    };
    window.adjustFontSize(0);
    cacheLoading = false;
    window.pressAbout = pressAbout = function(){
      return location.href = 'about.html';
    };
    window.pressErase = pressErase = function(){
      $('#query').val('').focus();
      return $('.erase-box').hide();
    };
    window.pressBack = pressBack = function(){
      var cur, token;
      stopAudio();
      if (isDroidGap && !$('.ui-autocomplete').hasClass('invisible') && widthIsXs()) {
        try {
          $('#query').autocomplete('close');
        } catch (e$) {}
        return;
      }
      if (cacheLoading) {
        return;
      }
      if (isDroidGap && entryHistory.length <= 1) {
        window.pressQuit();
      }
      cur = entryHistory[entryHistory.length - 1];
      while (entryHistory[entryHistory.length - 1] === cur) {
        entryHistory.pop();
        if (isDroidGap && entryHistory.length < 1) {
          window.pressQuit();
        }
      }
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
      stopAudio();
      return navigator.app.exitApp();
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
      $('body').on('dblclick', '.entry', function(){
        return;
        if (LANG !== 'c') {
          return;
        }
        $(this).css({
          borderRadius: '10px',
          background: '#eeeeff'
        }).attr('contentEditable', true);
        return $('#sendback').fadeIn();
      });
      $('body').on('shown.bs.dropdown', '.navbar', function(){
        if (widthIsXs()) {
          $(this).css('position', 'absolute');
          $(this).hide();
          return $(this).fadeIn(0);
        }
      });
      $('body').on('hidden.bs.dropdown', '.navbar', function(){
        return $(this).css('position', 'fixed');
      });
      if (isApp) {
        $('body').on('touchstart', '#gcse a.gs-title', function(){
          var val, url;
          $(this).removeAttr('href');
          val = $('#gcse input:visible').val();
          url = $(this).data('ctorig') || replace$.call($(this).attr('href'), /^.*?q=/, '').replace(/&.*$/, '');
          setTimeout(function(){
            $('#gcse input:visible').val(val);
            return grokVal(decodeHash(url = replace$.call(url, /^.*\//, '')));
          }, 1);
          $('.gsc-results-close-btn').click();
          return false;
        });
      }
      $('body').on('click', 'li.dropdown-submenu > a', function(){
        if (widthIsXs()) {
          $(this).next('ul').slideToggle('fast');
        }
        return false;
      });
      $('body').on('click', '#btn-starred', function(){
        if ($('#query').val() === '=*') {
          window.pressBack();
        } else {
          grokVal((HASHOF[LANG] + "=*").replace(/^#/, ''));
        }
        return false;
      });
      $('body').on('click', '#btn-clear-lru', function(){
        var lru, i$, len$, word;
        if (!confirm("確定要清除瀏覽紀錄？")) {
          return;
        }
        $('#lru').prevAll('br').remove();
        $('#lru').nextAll().remove();
        $('#lru').fadeOut('fast');
        if (!isCordova) {
          lru = split$.call(LRU[LANG], '\n');
          for (i$ = 0, len$ = lru.length; i$ < len$; ++i$) {
            word = lru[i$];
            rmPref("GET " + LANG + "/" + encodeURIComponent(word.slice(1, -1)) + ".json");
          }
        }
        LRU[LANG] = [];
        return setPref("lru-" + LANG, '');
      });
      if (isCordova || !'onhashchange' in window) {
        $('#result, .dropdown-menu').on('click', 'a[href^=#]', function(){
          var val;
          val = $(this).attr('href');
          if (val === '#') {
            return true;
          }
          if ($('.dropdown.open').length) {
            $('.navbar').css('position', 'fixed');
            $('.dropdown.open').removeClass('open');
          }
          if (val) {
            val = replace$.call(val, /.*\#/, '');
          }
          val || (val = $(this).text());
          window.grokVal(val);
          return false;
        });
      }
      if (!isDroidGap) {
        window.onpopstate = function(){
          var state;
          if (isDroidGap) {
            return window.pressBack();
          }
          state = decodeURIComponent((location.pathname + "").slice(1));
          if (!/\S/.test(state)) {
            return grokHash();
          }
          return grokVal(state);
        };
      }
      if ($('#result h1').length) {
        return setHtml($('#result').html());
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
      stopAudio();
      if (/</.exec(val) || /^\s+$/.exec(val)) {
        return;
      }
      if ((val === '\'=諺語' || val === '!=諺語' || val === ':=諺語') && !widthIsXs()) {
        setTimeout(function(){
          return $('#query').autocomplete('search');
        }, 500);
      }
      lang = 'a';
      if (/^['!]/.exec(val + "")) {
        lang = 't';
        val = val.substr(1);
      }
      if (/^:/.exec(val + "")) {
        lang = 'h';
        val = val.substr(1);
      }
      if (/^~/.exec(val + "")) {
        lang = 'c';
        val = val.substr(1);
      }
      $('.lang-active').text($(".lang-option." + lang + ":first").text());
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
    window.decodeHash = function(it){
      if (/%/.exec(it)) {
        it = decodeURIComponent(it);
      }
      if (/%[A-Fa-f]/.exec(escape(it))) {
        it = decodeURIComponent(escape(it));
      }
      return it;
    };
    window.grokHash = grokHash = function(){
      if (!/^#./.test(location.hash)) {
        return false;
      }
      try {
        grokVal(decodeHash((location.hash + "").replace(/^#+/, '')));
        return true;
      } catch (e$) {}
      return false;
    };
    window.fillQuery = fillQuery = function(it){
      var title, input;
      title = replace$.call(decodeURIComponent(it), /[（(].*/, '');
      title = replace$.call(title, /^[':!~]/, '');
      if (/^</.exec(title)) {
        return;
      }
      if (/^→/.exec(title)) {
        if (isMobile && widthIsXs()) {
          $('#query').blur();
        }
        setTimeout(function(){
          $('#query').autocomplete('search');
        }, 500);
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
        try {
          if (widthIsXs) {
            $('#query').blur();
          }
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
      if (STANDALONE) {
        return;
      }
      prevId = null;
      prevVal = null;
      if (HASHOF.c) {
        LANG = lang || (function(){
          switch (LANG) {
          case 'a':
            return 't';
          case 't':
            return 'h';
          case 'h':
            return 'c';
          case 'c':
            return 'a';
          }
        }());
      } else {
        LANG = lang || (function(){
          switch (LANG) {
          case 'a':
            return 't';
          case 't':
            return 'h';
          case 'h':
            return 'a';
          }
        }());
      }
      $('#query').val('');
      $('.ui-autocomplete li').remove();
      $('iframe').fadeIn('fast');
      $('.lang-active').text($(".lang-option." + LANG + ":first").text());
      setPref('lang', LANG);
      id || (id = {
        a: '萌',
        t: '發穎',
        h: '發芽',
        c: '萌'
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
      $('body').removeClass("lang-c");
      $('body').addClass("lang-" + LANG);
      $('#query').val(id);
      return window.doLookup(id);
    };
    bucketOf = function(it){
      var code;
      if (/^[=@]/.exec(it)) {
        return it[0];
      }
      code = it.charCodeAt(0);
      if (0xD800 <= code && code <= 0xDBFF) {
        code = it.charCodeAt(1) - 0xDC00;
      }
      return code % (LANG === 'a' ? 1024 : 128);
    };
    lookup = function(){
      var that;
      if (that = $('#query').val()) {
        $('.erase-box').show();
        return doLookup(b2g(that));
      }
      return $('.erase-box').hide();
    };
    window.doLookup = doLookup = function(val){
      var title, Index, id, hist;
      title = replace$.call(val, /[（(].*/, '');
      if (/draw/.exec(location.search) && !$('body').hasClass('autodraw')) {
        $('body').addClass('autodraw');
        strokeWords(title);
      }
      Index = INDEX[LANG];
      if (/^[=@]/.exec(title)) {} else if (isCordova || !Index) {
        if (/object/.exec(title)) {
          return;
        }
        if (Index && Index.indexOf("\"" + title + "\"") === -1) {
          return true;
        }
      } else {
        if (prevVal === val) {
          return true;
        }
        prevVal = val;
        if (!(Index.indexOf("\"" + title + "\"") >= 0)) {
          return true;
        }
      }
      id = title;
      if (prevId === id || replace$.call(id, /\(.*/, '') !== replace$.call(val, /\(.*/, '')) {
        return true;
      }
      $('#cond').val("^" + title + "$");
      hist = HASHOF[LANG].slice(1) + "" + title;
      if (!(entryHistory.length && entryHistory[entryHistory.length - 1] === hist)) {
        entryHistory.push(hist);
      }
      if (isApp || LANG !== 'a' || /^[=@]/.exec(title)) {
        $('.back').hide();
      } else {
        $('.back').show();
      }
      fetch(title);
      return true;
    };
    res$ = {};
    for (key in HASHOF) {
      res$[key] = [];
    }
    htmlCache = res$;
    fetch = function(it){
      var hash, page, e;
      if (!it) {
        return;
      }
      if (prevId === it) {
        return;
      }
      prevId = it;
      prevVal = it;
      setPref('prev-id', prevId);
      hash = HASHOF[LANG] + "" + it;
      if (!isQuery) {
        if (/^https:\/\/(?:www.)?moedict.tw/i.exec(document.URL)) {
          page = hash.slice(1);
          if (decodeURIComponent(location.pathname) + "" !== "/" + page) {
            if (history.replaceState) {
              if ((location.hash + "").length > 1) {
                history.replaceState(null, null, page);
              } else {
                history.pushState(null, null, page);
              }
            } else {
              if ((location.hash + "").replace(/^#/, '') !== page) {
                location.replace(hash);
              }
            }
          }
        } else if (location.hash + "" !== hash) {
          try {
            history.pushState(null, null, hash);
          } catch (e$) {
            e = e$;
            location.replace(hash);
          }
        }
        if (/^\?q=/.exec(location.search)) {
          location.search = '';
        }
      }
      try {
        document.title = it + " - " + TITLEOF[LANG] + "萌典";
      } catch (e$) {}
      $('.share .btn').each(function(){
        return $(this).attr({
          href: $(this).data('href').replace(/__TEXT__/, prevId) + encodeURIComponent(encodeURIComponent(hash.substr(1)))
        });
      });
      if (isMobile) {
        $('#result div, #result span, #result h1:not(:first)').hide();
        $('#result h1:first').text(replace$.call(it, /^[@=]/, '')).show();
      } else {
        $('#result div, #result span, #result h1:not(:first)').css('visibility', 'hidden');
        $('#result h1:first').text(replace$.call(it, /^[@=]/, '')).css('visibility', 'visible');
        window.scrollTo(0, 0);
      }
      if (loadCacheHtml(it)) {
        return;
      }
      if (it === '萌' && LANG === 'a') {
        return fillJson(MOE, '萌');
      }
      return loadJson(it);
    };
    loadJson = function(id, cb){
      var bucket;
      if (/^=\*/.exec(id)) {
        return fillJson("[" + STARRED[LANG] + "]", '字詞紀錄簿', cb);
      }
      if (!isCordova) {
        return GET(LANG + "/" + encodeURIComponent(replace$.call(id, /\(.*/, '')) + ".json", null, function(it){
          return fillJson(it, id, cb);
        }, 'text');
      }
      bucket = bucketOf(id);
      return fillBucket(id, bucket, cb);
    };
    setPinyinBindings = function(){
      return;
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
        var vclick;
        if ($('svg, canvas').length && !$('body').hasClass('autodraw')) {
          $('#strokes').fadeOut('fast', function(){
            $('#strokes').html('');
            return window.scrollTo(0, 0);
          });
        }
        html = html.replace('<!-- STAR -->', ~STARRED[LANG].indexOf("\"" + prevId + "\"") ? "<a class='star iconic-color icon-star' title='已加入記錄簿'></a>" : "<a class='star iconic-color icon-star-empty' title='加入字詞記錄簿'></a>");
        $('#result').html(html).ruby();
        _pua();
        $('#result h1 rb[word]').each(function(){
          var _h, _i, _ci;
          _h = HASHOF[LANG];
          _i = $(this).attr('word-order');
          _ci = $(this).attr('word');
          return $(this).wrap($('<a/>').attr({
            'word-order': _i,
            'href': _h + _ci
          })).on('mouseover', function(){
            var _i;
            _i = $(this).attr('word-order');
            return $('#result h1 a[word-order=' + _i + ']').addClass('hovered');
          }).on('mouseout', function(){
            return $('#result h1 a').removeClass('hovered');
          });
        });
        $('#result .part-of-speech a').attr('href', null);
        setPinyinBindings();
        cacheLoading = false;
        vclick = isMobile ? 'touchstart click' : 'click';
        $('.results .star').on(vclick, function(){
          var $star, key;
          $star = $(this).hide();
          key = "\"" + prevId + "\"\n";
          if ($(this).hasClass('icon-star-empty')) {
            STARRED[LANG] = key + STARRED[LANG];
          } else {
            STARRED[LANG] = replace$.call(STARRED[LANG], key + "", '');
          }
          $(this).toggleClass('icon-star-empty').toggleClass('icon-star');
          $('#btn-starred').fadeOut('fast', function(){
            return $(this).css('background', '#ddd').fadeIn(function(){
              $(this).css('background', 'transparent');
              return $star.fadeIn('fast');
            });
          });
          return setPref("starred-" + LANG, STARRED[LANG]);
        });
        $('.results .stroke').on(vclick, function(){
          if ($('svg, canvas').length) {
            return $('#strokes').fadeOut('fast', function(){
              $('#strokes').html('');
              return window.scrollTo(0, 0);
            });
          }
          window.scrollTo(0, 0);
          return strokeWords(replace$.call($('h1:first').data('title'), /[（(].*/, ''));
        });
        if (isCordova && !DEBUGGING) {
          try {
            navigator.splashscreen.hide();
          } catch (e$) {}
          $('#result .playAudio').on('touchstart', function(){
            if ($(this).hasClass('icon-play')) {
              return $(this).click();
            }
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
          tooltipClass: "prefer-pinyin-" + true,
          show: 100,
          hide: 100,
          items: 'a',
          open: function(){
            $('.ui-tooltip-content h1').ruby();
            return _pua();
          },
          content: function(cb){
            var id;
            id = $(this).attr('href').replace(/^#['!:~]?/, '');
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
            $('.ui-tooltip').remove();
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
        partialize$.apply(this, [
          setTimeout, [
            void 8, 125, function(){
              $('.ui-tooltip').remove();
              return partialize$.apply(this, [
                setTimeout, [
                  void 8, 125, function(){
                    return $('.ui-tooltip').remove();
                  }
                ], [0]
              ]);
            }
          ], [0]
        ]);
        function _pua(){
          $('hruby rb[annotation]').each(function(){
            var a;
            a = $(this).attr('annotation');
            if (isDroidGap || isChrome) {
              a = a.replace(/([aeiou])\u030d/g, function(m, v){
                return v === 'a'
                  ? '\uDB80\uDC61'
                  : v === 'e'
                    ? '\uDB80\uDC65'
                    : v === 'i'
                      ? '\uDB80\uDC69'
                      : v === 'o'
                        ? '\uDB80\uDC6F'
                        : v === 'u' ? '\uDB80\uDC75' : void 8;
              });
            } else {
              a = a.replace(/i\u030d/g, '\uDB80\uDC69');
            }
            if (/(<span[^<]*<\/span>)/.exec(a)) {
              $(RegExp.$1).appendTo($('<span/>', {
                'class': 'specific_to'
              }).appendTo($(this).parents('h1')));
            }
            return $(this).attr('annotation', replace$.call(a, /<span[^<]*<\/span>/g, ''));
          });
          return $('hruby rb[diao]').each(function(){
            var d;
            d = $(this).attr('diao');
            d = d.replace(/([\u31B4-\u31B7])[\u0358|\u030d]/g, function(m, j){
              return j === '\u31B4'
                ? '\uDB8C\uDDB4'
                : j === '\u31B5'
                  ? '\uDB8C\uDDB5'
                  : j === '\u31B6'
                    ? '\uDB8C\uDDB6'
                    : j === '\u31B7' ? '\uDB8C\uDDB7' : void 8;
            });
            return $(this).attr('diao', d);
          });
        }
        return _pua;
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
      var h, html, hasXrefs, tgtLang, ref$, words, word;
      cb == null && (cb = setHtml);
      while (/"`辨~\u20DE&nbsp`似~\u20DE"[^}]*},{"f":"([^（]+)[^"]*"/.exec(part)) {
        part = part.replace(/"`辨~\u20DE&nbsp`似~\u20DE"[^}]*},{"f":"([^（]+)[^"]*"/, '"辨\u20DE 似\u20DE $1"');
      }
      part = part.replace(/"`(.)~\u20DE"[^}]*},{"f":"([^（]+)[^"]*"/g, '"$1\u20DE $2"');
      part = part.replace(/"([hbpdcnftrelsaqETAVCDS_=])":/g, function(arg$, k){
        return keyMap[k] + ':';
      });
      h = HASHOF[LANG];
      part = part.replace(/([「【『（《])`([^~]+)~([。，、；：？！─…．·－」』》〉]+)/g, function(arg$, pre, word, post){
        return "<span class='punct'>" + pre + "<a href=\\\"" + h + word + "\\\">" + word + "</a>" + post + "</span>";
      });
      part = part.replace(/([「【『（《])`([^~]+)~/g, function(arg$, pre, word){
        return "<span class='punct'>" + pre + "<a href=\\\"" + h + word + "\\\">" + word + "</a></span>";
      });
      part = part.replace(/`([^~]+)~([。，、；：？！─…．·－」』》〉]+)/g, function(arg$, word, post){
        return "<span class='punct'><a href=\\\"" + h + word + "\\\">" + word + "</a>" + post + "</span>";
      });
      part = part.replace(/`([^~]+)~/g, function(arg$, word){
        return "<a href=\\\"" + h + word + "\\\">" + word + "</a>";
      });
      part = part.replace(/([)）])/g, "$1\u200B");
      if (/^\[\s*\[/.exec(part)) {
        html = renderStrokes(part, id);
      } else if (/^\[/.exec(part)) {
        html = renderList(part, id);
      } else {
        html = render($.parseJSON(part));
      }
      html = html.replace(/(.)\u20DD/g, "<span class='regional part-of-speech'>$1</span> ");
      html = html.replace(/(.)\u20DE/g, "</span><span class='part-of-speech'>$1</span><span>");
      html = html.replace(/(.)\u20DF/g, "<span class='specific'>$1</span>");
      html = html.replace(/(.)\u20E3/g, "<span class='variant'>$1</span>");
      html = html.replace(RegExp('<a[^<]+>' + id + '<\\/a>', 'g'), id + "");
      html = html.replace(/<a>([^<]+)<\/a>/g, "<a href=\"" + h + "$1\">$1</a>");
      html = html.replace(RegExp('(>[^<]*)' + id + '(?!</(?:h1|rb)>)', 'g'), "$1<b>" + id + "</b>");
      html = html.replace(/¹/g, '<sup>1</sup>');
      html = html.replace(/²/g, '<sup>2</sup>');
      html = html.replace(/³/g, '<sup>3</sup>');
      html = html.replace(/⁴/g, '<sup>4</sup>');
      html = html.replace(/⁵/g, '<sup>5</sup>');
      html = html.replace(/\uFFF9/g, '<span class="ruby"><span class="rb"><span class="ruby"><span class="rb">').replace(/\uFFFA/g, '</span><br><span class="rt trs pinyin">').replace(/\uFFFB/g, '</span></span></span></span><br><span class="rt mandarin">').replace(/<span class="rt mandarin">\s*<\//g, '</');
      hasXrefs = false;
      for (tgtLang in ref$ = xrefOf(id)) {
        words = ref$[tgtLang];
        if (words.length) {
          if (!hasXrefs++) {
            html += '<div class="xrefs">';
          }
          html += "<div class=\"xref-line\">\n    <span class='xref part-of-speech'>" + (XREFLABELOF[LANG + "" + tgtLang] || XREFLABELOF[tgtLang]) + "</span>\n    <span class='xref' itemprop='citation'>";
          html += (fn$()).join('、');
          html += '</span></div>';
        }
      }
      if (hasXrefs) {
        html += '</div>';
      }
      cb(htmlCache[LANG][id] = html);
      function fn$(){
        var i$, ref$, len$, results$ = [];
        for (i$ = 0, len$ = (ref$ = words).length; i$ < len$; ++i$) {
          word = ref$[i$];
          h = HASHOF[tgtLang];
          if (/`/.exec(word)) {
            results$.push(word.replace(/`([^~]+)~/g, fn$));
          } else {
            results$.push("<a class='xref' href=\"" + h + word + "\">" + word + "</a>");
          }
        }
        return results$;
        function fn$(arg$, word){
          return "<a class='xref' href=\"" + h + word + "\">" + word + "</a>";
        }
      }
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
      D: '"dialects"',
      S: '"specific_to"'
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
        addToLru(id);
        return fillJson(part, id, cb);
      });
    };
    if (isCordova) {
      for (lang in HASHOF) {
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
      for (i$ in HASHOF) {
        if (i$ !== LANG) {
          (fn1$.call(this, i$));
        }
      }
    }
    if (!STANDALONE) {
      GET("t/variants.json", function(it){
        return XREF.tv = {
          t: it
        };
      }, 'text');
    }
    for (lang in HASHOF) {
      if (lang !== 'h') {
        results$.push((fn2$.call(this, lang)));
      }
    }
    return results$;
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
    function fn2$(lang){
      return GET(lang + "/=.json", function(it){
        var $ul;
        $ul = renderTaxonomy(lang, $.parseJSON(it));
        if (STANDALONE) {
          $('.nav .lang-option.c:first').parent().prevAll().remove();
          return $(".taxonomy." + lang).parent().replaceWith($ul.children());
        }
        return $(".taxonomy." + lang).after($ul);
      }, 'text');
    }
  };
  function renderTaxonomy(lang, taxonomy){
    var $ul, i$, ref$, len$, taxo, label, submenu;
    $ul = $('<ul/>', {
      'class': 'dropdown-menu'
    });
    if (lang === 'c' && !STANDALONE) {
      $ul.css({
        bottom: 0,
        top: 'auto'
      });
    }
    for (i$ = 0, len$ = (ref$ = taxonomy instanceof Array
      ? taxonomy
      : [taxonomy]).length; i$ < len$; ++i$) {
      taxo = ref$[i$];
      if (typeof taxo === 'string') {
        $ul.append($('<li/>', {
          role: 'presentation'
        }).append($('<a/>', {
          'class': "lang-option " + lang,
          href: HASHOF[lang] + "=" + taxo
        }).text(taxo)));
      } else {
        for (label in taxo) {
          submenu = taxo[label];
          $ul.append($('<li/>', {
            'class': 'dropdown-submenu'
          }).append($('<a/>', {
            href: '#'
          }).text(label)).append(renderTaxonomy(lang, submenu)));
        }
      }
    }
    return $ul;
  }
  MOE = '{"n":8,"t":"萌","r":"`艸~","c":12,"h":[{"d":[{"q":["`說文解字~：「`萌~，`艸~`芽~`也~。」","`唐~．`韓愈~、`劉~`師~`服~、`侯~`喜~、`軒轅~`彌~`明~．`石~`鼎~`聯句~：「`秋~`瓜~`未~`落~`蒂~，`凍~`芋~`強~`抽~`萌~。」"],"type":"`名~","f":"`草木~`初~`生~`的~`芽~。"},{"q":["`韓非子~．`說~`林~`上~：「`聖人~`見~`微~`以~`知~`萌~，`見~`端~`以~`知~`末~。」","`漢~．`蔡邕~．`對~`詔~`問~`灾~`異~`八~`事~：「`以~`杜漸防萌~，`則~`其~`救~`也~。」"],"type":"`名~","f":"`事物~`發生~`的~`開端~`或~`徵兆~。"},{"type":"`名~","l":["`通~「`氓~」。"],"e":["`如~：「`萌黎~」、「`萌隸~」。"],"f":"`人民~。"},{"type":"`名~","f":"`姓~。`如~`五代~`時~`蜀~`有~`萌~`慮~。"},{"q":["`楚辭~．`王~`逸~．`九思~．`傷~`時~：「`明~`風~`習習~`兮~`龢~`暖~，`百草~`萌~`兮~`華~`榮~。」"],"type":"`動~","e":["`如~：「`萌芽~」。"],"f":"`發芽~。"},{"q":["`管子~．`牧民~：「`惟~`有道~`者~，`能~`備~`患~`於~`未~`形~`也~，`故~`禍~`不~`萌~。」","`三國演義~．`第一~`回~：「`若~`萌~`異心~，`必~`獲~`惡報~。」"],"type":"`動~","e":["`如~：「`故態復萌~」。"],"f":"`發生~。"}],"p":"méng","b":"ㄇㄥˊ","=":"0676"}],"translation":{"francais":["germer"],"Deutsch":["Leute, Menschen  (S)","Meng  (Eig, Fam)","keimen, sprießen, knospen, ausschlagen "],"English":["to sprout","to bud","to have a strong affection for (slang)","adorable (loanword from Japanese `萌~え moe, slang describing affection for a cute character)"]}}';
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
        var item, val;
        item = arg$.item;
        if (/^▶/.exec(item != null ? item.value : void 8)) {
          val = $('#query').val().replace(/^→列出含有「/, '').replace(/」的詞$/, '');
          if (LANG === 'c') {
            window.open("mailto:xldictionary@gmail.com?subject=建議收錄：" + val + "&body=出處及定義：", '_system');
          } else {
            window.open("https://www.moedict.tw/" + HASHOF[LANG].slice(1) + val, '_system');
          }
          return false;
        }
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
        if ($('#query').data('changing')) {
          return;
        }
        if (/^\(/.exec(item != null ? item.value : void 8)) {
          return false;
        }
        return $('#query').data({
          changing: true
        });
        if (item != null && item.value) {
          fillQuery(item.value);
        }
        return $('#query').data({
          changing: false
        });
        return true;
      },
      source: function(arg$, cb){
        var term, regex, results, i$, ref$, len$, v, MaxResults, more;
        term = arg$.term;
        if (term === '=諺語' && LANG === 't') {
          term = "。";
        }
        if (term === '=諺語' && LANG === 'h') {
          term = "，";
        }
        $('iframe').fadeOut('fast');
        if (!term.length) {
          return cb([]);
        }
        if (!(LANG !== 't' || /[^\u0000-\u00FF]/.exec(term) || /[,;0-9]/.exec(term))) {
          return trs_lookup(term, cb);
        }
        if (widthIsXs() && !/[「」。，?.*_% ]/.test(term)) {
          return cb(["→列出含有「" + term + "」的詞"]);
        }
        if (/^[@=]/.exec(term)) {
          return doLookup(term);
        }
        term = term.replace(/^→列出含有「/, '');
        term = term.replace(/」的詞$/, '');
        term = term.replace(/\*/g, '%');
        term = term.replace(/[-—]/g, '－');
        term = term.replace(/[,﹐]/g, '，');
        term = term.replace(/[;﹔]/g, '；');
        term = term.replace(/[﹒．]/g, '。');
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
        results || (results = xrefOf(term, LANG === 'a' ? 't' : 'a', LANG));
        if (LANG === 'h' && term === '我') {
          results.unshift('𠊎');
        }
        if (LANG === 't') {
          for (i$ = 0, len$ = (ref$ = xrefOf(term, 'tv', 't').reverse()).length; i$ < len$; ++i$) {
            v = ref$[i$];
            if (!in$(v, results)) {
              results.unshift(v);
            }
          }
        }
        if (LANG === 'c' && !(results != null && results.length)) {
          return cb(["▶找不到。建議收錄？"]);
        }
        if (LANG !== 'c' && !(results != null && results.length)) {
          return cb(["▶找不到。分享這些字？"]);
        }
        if (!(results != null && results.length)) {
          return cb(['']);
        }
        if (results.length === 1) {
          doLookup(replace$.call(results[0], /"/g, ''));
        }
        MaxResults = widthIsXs() ? 400 : 1024;
        if (results.length > MaxResults) {
          more = "(僅顯示前 " + MaxResults + " 筆)";
          results = results.slice(0, MaxResults);
          results.push(more);
        }
        return cb(map((function(it){
          return replace$.call(it, /"/g, '');
        }), results));
      }
    });
  }
  PUA2UNI = {
    '⿰𧾷百': '󾜅',
    '⿸疒哥': '󿗧',
    '⿰亻恩': '󿌇',
    '⿰虫念': '󿑂',
    '⿺皮卜': '󿕅'
  };
  trs_lookup = function(term, cb){
    return GET("https://www.moedict.tw/lookup/trs/" + term, function(data){
      data = data.replace(/[⿰⿸⿺](?:𧾷|.)./g, function(it){
        return PUA2UNI[it];
      });
      return cb(split$.call(data, '|'));
    });
  };
  CJKRADICALS = '⼀一⼁丨⼂丶⼃丿⼄乙⼅亅⼆二⼇亠⼈人⼉儿⼊入⼋八⼌冂⼍冖⼎冫⼏几⼐凵⼑刀⼒力⼓勹⼔匕⼕匚⼖匸⼗十⼘卜⼙卩⼚厂⼛厶⼜又⼝口⼞囗⼟土⼠士⼡夂⼢夊⼣夕⼤大⼥女⼦子⼧宀⼨寸⼩小⼪尢⼫尸⼬屮⼭山⼮巛⼯工⼰己⼱巾⼲干⼳幺⼴广⼵廴⼶廾⼷弋⼸弓⼹彐⼺彡⼻彳⼼心⼽戈⼾戶⼿手⽀支⽁攴⽂文⽃斗⽄斤⽅方⽆无⽇日⽈曰⽉月⽊木⽋欠⽌止⽍歹⽎殳⽏毋⽐比⽑毛⽒氏⽓气⽔水⽕火⽖爪⽗父⽘爻⽙爿⺦丬⽚片⽛牙⽜牛⽝犬⽞玄⽟玉⽠瓜⽡瓦⽢甘⽣生⽤用⽥田⽦疋⽧疒⽨癶⽩白⽪皮⽫皿⽬目⽭矛⽮矢⽯石⽰示⽱禸⽲禾⽳穴⽴立⽵竹⽶米⽷糸⺰纟⽸缶⽹网⽺羊⽻羽⽼老⽽而⽾耒⽿耳⾀聿⾁肉⾂臣⾃自⾄至⾅臼⾆舌⾇舛⾈舟⾉艮⾊色⾋艸⾌虍⾍虫⾎血⾏行⾐衣⾑襾⾒見⻅见⾓角⾔言⻈讠⾕谷⾖豆⾗豕⾘豸⾙貝⻉贝⾚赤⾛走⾜足⾝身⾞車⻋车⾟辛⾠辰⾡辵⻌辶⾢邑⾣酉⾤釆⾥里⾦金⻐钅⾧長⻓长⾨門⻔门⾩阜⾪隶⾫隹⾬雨⾭靑⾮非⾯面⾰革⾱韋⻙韦⾲韭⾳音⾴頁⻚页⾵風⻛风⾶飛⻜飞⾷食⻠饣⾸首⾹香⾺馬⻢马⾻骨⾼高⾽髟⾾鬥⾿鬯⿀鬲⿁鬼⿂魚⻥鱼⻦鸟⿃鳥⿄鹵⻧卤⿅鹿⿆麥⻨麦⿇麻⿈黃⻩黄⿉黍⿊黑⿋黹⿌黽⻪黾⿍鼎⿎鼓⿏鼠⿐鼻⿑齊⻬齐⿒齒⻮齿⿓龍⻰龙⿔龜⻳龟⿕龠';
  SIMPTRAD = (ref$ = window.SIMPTRAD) != null ? ref$ : '';
  function b2g(str){
    var rv, i$, ref$, len$, char, idx;
    str == null && (str = '');
    if (!((LANG === 'a' || LANG === 'c') && !/^@/.test(str))) {
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
    return rv.replace(/台([北中南東灣語])/g, '臺$1');
  }
  function renderRadical(char){
    var idx, h;
    idx = CJKRADICALS.indexOf(char);
    if (!(idx % 2)) {
      char = CJKRADICALS[idx + 1];
    }
    if (LANG !== 'a' && LANG !== 'c') {
      return char;
    }
    h = HASHOF[LANG];
    return "<a title='部首檢索' class='xref' style='color: white' href=\"" + h + "@" + char + "\"> " + char + "</a>";
  }
  function canPlayMp3(){
    var a;
    if (CACHED.canPlayMp3 != null) {
      return CACHED.canPlayMp3;
    }
    a = document.createElement('audio');
    return CACHED.canPlayMp3 = !!(replace$.call(typeof a.canPlayType === 'function' ? a.canPlayType('audio/mpeg;') : void 8, /^no$/, ''));
  }
  function canPlayOgg(){
    var a;
    if (CACHED.canPlayOgg != null) {
      return CACHED.canPlayOgg;
    }
    a = document.createElement('audio');
    return CACHED.canPlayOgg = !!(replace$.call(typeof a.canPlayType === 'function' ? a.canPlayType('audio/ogg; codecs="vorbis"') : void 8, /^no$/, ''));
  }
  function canPlayOpus(){
    var a;
    if (CACHED.canPlayOpus != null) {
      return CACHED.canPlayOpus;
    }
    a = document.createElement('audio');
    return CACHED.canPlayOpus = !!(replace$.call(typeof a.canPlayType === 'function' ? a.canPlayType('audio/ogg; codecs="opus"') : void 8, /^no$/, ''));
  }
  function renderStrokes(terms, id){
    var h, title, rows, list, i$, len$, strokes, chars, j$, len1$, ch;
    h = HASHOF[LANG];
    id = replace$.call(id, /^[@=]/, '');
    if (/^\s*$/.exec(id)) {
      title = "<h1 itemprop='name'>部首表</h1>";
      h += '@';
    } else {
      title = "<h1 itemprop='name'>" + id + " <a class='xref' href=\"#@\" title='部首表'>部</a></h1>";
    }
    rows = $.parseJSON(terms);
    list = '';
    for (i$ = 0, len$ = rows.length; i$ < len$; ++i$) {
      strokes = i$;
      chars = rows[i$];
      if (chars != null && chars.length) {
        list += "<span class='stroke-count'>" + strokes + "</span><span class='stroke-list'>";
        for (j$ = 0, len1$ = chars.length; j$ < len1$; ++j$) {
          ch = chars[j$];
          list += "<a class='stroke-char' href=\"" + h + ch + "\">" + ch + "</a> ";
        }
        list += "</span><hr style='margin: 0; padding: 0; height: 0'>";
      }
    }
    return title + "<div class='list'>" + list + "</div>";
  }
  function renderList(terms, id){
    var h, title;
    h = HASHOF[LANG];
    id = replace$.call(id, /^[@=]/, '');
    title = "<h1 itemprop='name'>" + id + "</h1>";
    terms = replace$.call(terms, /^[^"]*/, '');
    if (id === '字詞紀錄簿') {
      if (!terms) {
        terms += "<p class='bg-info'>（請按詞條右方的 <i class='icon-star-empty'></i> 按鈕，即可將字詞加到這裡。）</p>";
      }
    }
    if (/^";/.exec(terms)) {
      terms = "<table border=1 bordercolor=#ccc><tr><td><span class='part-of-speech'>臺</span></td><td><span class='part-of-speech'>陸</span></td></tr>" + terms + "</table>";
      terms = terms.replace(/";([^;"]+);([^;"]+)"[^"]*/g, "<tr><td><a href=\"" + h + "$1\">$1</a></td><td><a href=\"" + h + "$2\">$2</a></td></tr>");
    } else {
      terms = terms.replace(/"([^"]+)"[^"]*/g, "<span style='clear: both; display: block'>\u00B7 <a href=\"" + h + "$1\">$1</a></span>");
    }
    if (id === '字詞紀錄簿' && LRU[LANG]) {
      terms += "<br><h3 id='lru'>最近查閱過的字詞";
      terms += "<input type='button' id='btn-clear-lru' class='btn-default btn btn-tiny' value='清除' style='margin-left: 10px'>";
      terms += "</h3>\n";
      terms += LRU[LANG].replace(/"([^"]+)"[^"]*/g, "<span style='clear: both; display: block'>\u00B7 <a href=\"" + h + "$1\">$1</a></span>");
    }
    return title + "<div class='list'>" + terms + "</div>";
  }
  httpMap = {
    a: '203146b5091e8f0aafda-15d41c68795720c6e932125f5ace0c70.ssl.cf1.rackcdn.com',
    h: 'a7ff62cf9d5b13408e72-351edcddf20c69da65316dd74d25951e.ssl.cf1.rackcdn.com',
    t: '1763c5ee9859e0316ed6-db85b55a6a3fbe33f09b9245992383bd.ssl.cf1.rackcdn.com',
    'stroke-json': '829091573dd46381a321-9e8a43b8d3436eaf4353af683c892840.ssl.cf1.rackcdn.com',
    stroke: '/626a26a628fa127d6a25-47cac8eba79cfb787dbcc3e49a1a65f1.ssl.cf1.rackcdn.com'
  };
  function http(it){
    if (location.protocol !== 'https:') {
      return "http://" + it;
    }
    return "https://" + it.replace(/^([^.]+)\.[^\/]+/, function(xs, x){
      return httpMap[x] || xs;
    });
  }
  function render(json){
    var title, english, heteronyms, radical, translation, nrsCount, sCount, py, charHtml, result;
    title = json.title, english = json.english, heteronyms = json.heteronyms, radical = json.radical, translation = json.translation, nrsCount = json.non_radical_stroke_count, sCount = json.stroke_count, py = json.pinyin;
    charHtml = radical ? "<div class='radical'><span class='glyph'>" + renderRadical(replace$.call(radical, /<\/?a[^>]*>/g, '')) + "</span><span class='count'><span class='sym'>+</span>" + nrsCount + "</span><span class='count'> = " + sCount + "</span>&nbsp;<a class='iconic-circle stroke icon-pencil' title='筆順動畫' style='color: white'></a></div>" : "<div class='radical'><a class='iconic-circle stroke icon-pencil' title='筆順動畫' style='color: white'></a></div>";
    result = ls(heteronyms, function(arg$){
      var id, audio_id, ref$, bopomofo, pinyin, trs, definitions, antonyms, synonyms, variants, specific_to, alt, youyin, bAlt, pAlt, ruby, cnSpecific, basename, mp3;
      id = arg$.id, audio_id = (ref$ = arg$.audio_id) != null ? ref$ : id, bopomofo = arg$.bopomofo, pinyin = (ref$ = arg$.pinyin) != null ? ref$ : py, trs = (ref$ = arg$.trs) != null ? ref$ : '', definitions = (ref$ = arg$.definitions) != null
        ? ref$
        : [], antonyms = arg$.antonyms, synonyms = arg$.synonyms, variants = arg$.variants, specific_to = arg$.specific_to, alt = arg$.alt;
      pinyin == null && (pinyin = trs);
      if (LANG !== 'c') {
        pinyin = replace$.call(pinyin, /<[^>]*>/g, '').replace(/（.*）/, '');
      }
      if (audio_id && LANG === 'h') {
        pinyin = pinyin.replace(/(.)\u20DE/g, function(_, $1){
          var variant, mp3;
          variant = " 四海大平安".indexOf($1);
          mp3 = http("h.moedict.tw/" + variant + "-" + audio_id + ".ogg");
          if (mp3 && !canPlayOgg()) {
            mp3 = mp3.replace(/ogg$/, 'mp3');
          }
          return "</span><span class=\"audioBlock\"><div onclick='window.playAudio(this, \"" + mp3 + "\")' class='icon-play playAudio part-of-speech'>" + $1 + "</div>";
        });
      }
      bopomofo == null && (bopomofo = trs2bpmf(pinyin + ""));
      if (LANG !== 'c') {
        bopomofo = replace$.call(bopomofo, /<[^>]*>/g, '');
      }
      pinyin = pinyin.replace(/ɡ/g, 'g');
      pinyin = pinyin.replace(/ɑ/g, 'a');
      pinyin = pinyin.replace(/，/g, ', ');
      youyin = /^（[語|讀|又]音）/.exec(bopomofo) ? bopomofo.replace(/（([語|讀|又]音)）.*/, '$1') : void 8;
      bAlt = /[變|\/]/.exec(bopomofo)
        ? bopomofo.replace(/.*[\(變\)​|\/](.*)/, '$1')
        : /.+（又音）.+/.exec(bopomofo) ? bopomofo.replace(/.+（又音）/, '') : '';
      bAlt = bAlt.replace(/ /g, '\u3000').replace(/([ˇˊˋ])\u3000/g, '$1 ');
      pAlt = /[變|\/]/.exec(pinyin)
        ? pinyin.replace(/.*[\(變\)​|\/](.*)/, '$1')
        : /.+（又音）.+/.exec(bopomofo) ? function(){
          var _py, i$, to$, i;
          _py = pinyin.split(' ');
          for (i$ = 0, to$ = _py.length / 2 - 1; i$ <= to$; ++i$) {
            i = i$;
            _py.shift();
          }
          return _py.join(' ');
        }() : '';
      bopomofo = bopomofo.replace(/([^ ])(ㄦ)/g, '$1 $2').replace(/([ ]?[\u3000][ ]?)/g, ' ');
      bopomofo = bopomofo.replace(/([ˇˊˋ˪˫])[ ]?/g, '$1 ').replace(/([ㆴㆵㆶㆷ][̍͘]?)/g, '$1 ');
      ruby = function(){
        var t, b, cnSpecificBpmf, ruby, p, i$, len$, yin, span, cns, tws;
        if (LANG === 'h') {
          return;
        }
        t = title.replace(/<a[^>]+>/g, '`').replace(/<\/a>/g, '~');
        t = replace$.call(t, /<[^>]+>/g, '');
        b = bopomofo.replace(/\s?[，、；。－—,\.;]\s?/g, ' ');
        b = b.replace(/（[語|讀|又]音）[\u200B]?/, '');
        b = b.replace(/\(變\)​\/.*/, '');
        b = b.replace(/\/.*/, '');
        if (/<br>陸/.exec(b)) {
          cnSpecificBpmf = replace$.call(b, /.*<br>陸./, '');
        }
        b = b.replace(/<br>(.*)/, '');
        b = replace$.call(b, /.\u20DF/g, '');
        if (/^([\uD800-\uDBFF][\uDC00-\uDFFF]|.)$/.exec(t)) {
          ruby = '<rbc><div class="stroke" title="筆順動畫"><rb>' + t + '</rb></div></rbc>';
        } else {
          ruby = '<rbc>' + t.replace(/([^`~]+)/g, function(m, ci, o, s){
            return /^([\uD800-\uDBFF][\uDC00-\uDFFF]|[^，、；。－—])$/.exec(ci)
              ? '<rb word="' + ci + '">' + ci + '</rb>'
              : ci.replace(/([\uD800-\uDBFF][\uDC00-\uDFFF]|[^，、；。－—])/g, '<rb word="' + ci + '" word-order="' + o + '">$1</rb>');
          }).replace(/([`~])/g, '') + '</rbc>';
        }
        p = pinyin.replace(/[,\.;，、；。－—]\s?/g, ' ');
        p = p.replace(/\(變\)​.*/, '');
        p = p.replace(/\/.*/, '');
        p = p.replace(/<br>.*/, '');
        p = p.split(' ');
        for (i$ = 0, len$ = p.length; i$ < len$; ++i$) {
          yin = p[i$];
          if (yin !== '') {
            span = LANG === 't' && /\-/g.exec(yin)
              ? ' rbspan="' + (yin.match(/[\-]+/g).length + 1) + '"'
              : LANG !== 't' && /^[^eēéěè].*r$/g.exec(yin)
                ? (cnSpecificBpmf && (cns = split$.call(cnSpecificBpmf, /\s+/), tws = split$.call(b, /\s+/), tws[tws.length - 2] = cns[cns.length - 2], bAlt = b.replace(/ /g, '\u3000').replace(/\sㄦ$/, 'ㄦ'), b = join$.call(tws, ' ')), ' rbspan="2"')
                : LANG !== 't' && /[aāáǎàeēéěèiīíǐìoōóǒòuūúǔùüǖǘǚǜ]+/g.exec(yin) ? ' rbspan="' + yin.match(/[aāáǎàeēéěèiīíǐìoōóǒòuūúǔùüǖǘǚǜ]+/g).length + '"' : '';
            p[i$] = '<rt' + span + '>' + yin + '</rt>';
          }
        }
        ruby += '<rtc class="zhuyin"><rt>' + b.replace(/[ ]+/g, '</rt><rt>') + '</rt></rtc>';
        ruby += '<rtc class="romanization">';
        ruby += p.join('');
        ruby += '</rtc>';
        return ruby;
      }();
      cnSpecific = '';
      if (/陸/.exec(bopomofo)) {
        cnSpecific = 'cn-specific';
      }
      if (LANG === 'c') {
        if (/<br>/.exec(bopomofo)) {
          pinyin = pinyin.replace(/.*<br>/, '').replace(/陸./, '').replace(/\s?([,\.;])\s?/g, '$1 ');
          bopomofo = bopomofo.replace(/.*<br>/, '').replace(/陸./, '').replace(/\s?([，。；])\s?/g, '$1');
          bopomofo = bopomofo.replace(/ /g, '\u3000').replace(/([ˇˊˋ])\u3000/g, '$1 ');
        } else {
          pinyin = '';
          bopomofo = '';
        }
      } else if (LANG === 'h') {
        bopomofo = '';
      }
      if (!/</.test(title)) {
        title = "<div class='stroke' title='筆順動畫'>" + title + "</div>";
      }
      return "<!-- STAR -->\n<meta itemprop=\"image\" content=\"" + encodeURIComponent(replace$.call(h(title), /<[^>]+>/g, '')) + ".png\" />\n<meta itemprop=\"name\" content=\"" + (replace$.call(h(title), /<[^>]+>/g, '')) + "\" />\n" + charHtml + "\n<h1 class='title' data-title=\"" + (replace$.call(h(title), /<[^>]+>/g, '')) + "\">\n" + (LANG !== 'h' ? "<ruby class=\"rightangle\">" + ruby + "</ruby>" : title) + (youyin ? "<small class='youyin'>" + youyin + "</small>" : '') + (audio_id && (canPlayOgg() || canPlayMp3()) && (LANG === 't' && !(20000 < audio_id && audio_id < 50000)
        ? (basename = replace$.call(100000 + Number(audio_id), /^1/, ''), mp3 = http("t.moedict.tw/" + basename + ".ogg"))
        : LANG === 'a' && (mp3 = http("a.moedict.tw/" + audio_id + ".ogg")), /opus$/.exec(mp3) && !canPlayOpus() && (mp3 = mp3.replace(/opus$/, 'ogg')), /(opus|ogg)$/.exec(mp3) && !canPlayOgg() && (mp3 = mp3.replace(/(opus|ogg)$/, 'mp3'))), mp3 ? "<i itemscope itemtype=\"http://schema.org/AudioObject\"\n  class='icon-play playAudio' onclick='window.playAudio(this, \"" + mp3 + "\")'><meta\n  itemprop=\"name\" content=\"" + (replace$.call(mp3, /^.*\//, '')) + "\" /><meta\n  itemprop=\"contentURL\" content=\"" + mp3 + "\" /></i>" : '') + (bAlt ? "<small class='alternative'><span class='pinyin'>" + pAlt + "</span><span class='bopomofo'>" + bAlt + "</span></small>" : '') + (english ? "<span lang='en' class='english'>" + english + "</span>" : '') + (specific_to ? "<span class='specific_to'>" + specific_to + "</span>" : '') + "\n</h1>\n<div class=\"bopomofo\">\n" + (alt != null ? "<div lang=\"zh-Hans\" class=\"cn-specific\">\n  <span class='xref part-of-speech'>简</span>\n  <span class='xref'>" + (replace$.call(alt, /<[^>]*>/g, '')) + "</span>\n</div>" : '') + (cnSpecific
        ? "<small class=\"alternative cn-specific\">\n  <span class='pinyin'>" + pinyin + "</span>\n  <span class='bopomofo'>" + bopomofo + "</span>\n</small>"
        : LANG === 'h' ? "<span class='pinyin'>" + pinyin + "</span>" : '') + "\n</div>\n<div class=\"entry\" itemprop=\"articleBody\">\n" + ls(groupBy('type', definitions.slice()), function(defs){
        var ref$, t;
        return "<div class=\"entry-item\">\n" + ((ref$ = defs[0]) != null && ref$.type ? (function(){
          var i$, ref$, len$, results$ = [];
          for (i$ = 0, len$ = (ref$ = split$.call(defs[0].type, ',')).length; i$ < len$; ++i$) {
            t = ref$[i$];
            results$.push("<span class='part-of-speech'>" + t + "</span>");
          }
          return results$;
        }()).join('&nbsp;') : '') + "\n  <ol>\n  " + ls(defs, function(arg$){
          var type, def, quote, ref$, example, link, antonyms, synonyms, afterDef, isColonDef;
          type = arg$.type, def = arg$.def, quote = (ref$ = arg$.quote) != null
            ? ref$
            : [], example = (ref$ = arg$.example) != null
            ? ref$
            : [], link = (ref$ = arg$.link) != null
            ? ref$
            : [], antonyms = arg$.antonyms, synonyms = arg$.synonyms;
          if (/∥/.exec(def)) {
            afterDef = "<div style='margin: 0 0 22px -44px'>" + h(replace$.call(def, /^[^∥]+/, '')) + "</div>";
            def = replace$.call(def, /∥.*/, '');
          }
          isColonDef = LANG === 'c' && /[:：]<\/span>$/.exec(def) && !any(function(it){
            return !!(/^\s*\(\d+\)/.exec(it.def));
          }, defs);
          return (/^\s*\(\d+\)/.exec(def) || isColonDef ? '' : '<li>') + "<p class='definition' " + (isColonDef ? 'style="margin-left: -28px"' : '') + ">\n    <span class=\"def\">\n    " + h(expandDef(def)).replace(/([：。」])([\u278A-\u2793\u24eb-\u24f4])/g, '$1</span><span class="def">$2') + "</span>\n    " + ls(example, function(it){
            return "<span class='example'>" + h(it) + "</span></span>";
          }) + "\n    " + ls(quote, function(it){
            return "<span class='quote'>" + h(it) + "</span>";
          }) + "\n    " + ls(link, function(it){
            return "<span class='link'>" + h(it) + "</span>";
          }) + "\n    " + (synonyms ? "<span class='synonyms'><span class='part-of-speech'>似</span> " + h((replace$.call(synonyms, /^,/, '')).replace(/,/g, '、')) + "</span>" : '') + (antonyms ? "<span class='antonyms'><span class='part-of-speech'>反</span> " + h((replace$.call(antonyms, /^,/, '')).replace(/,/g, '、')) + "</span>" : '') + "\n  </p>\n  " + (afterDef || '');
        }) + "\n  </ol></div>";
      }) + (synonyms ? "<span class='synonyms'><span class='part-of-speech'>似</span> " + h((replace$.call(synonyms, /^,/, '')).replace(/,/g, '、')) + "</span>" : '') + (antonyms ? "<span class='antonyms'><span class='part-of-speech'>反</span> " + h((replace$.call(antonyms, /^,/, '')).replace(/,/g, '、')) + "</span>" : '') + (variants ? "<span class='variants'><span class='part-of-speech'>異</span> " + h(variants.replace(/,/g, '、')) + "</span>" : '') + "\n</div>";
    });
    return result + "" + (translation ? "<div class='xrefs'><span class='translation'>" + ('English' in translation ? "<div class='xref-line'><span class='fw_lang'>英</span><span class='fw_def'>" + ((join$.call(translation.English, ', ')).replace(/, CL:.*/g, '').replace(/\|(?:<\/?a[^>*]>|[^[,.(])+/g, '')) + "</span></div>" : '') + "" + ('francais' in translation ? "<div class='xref-line'><span class='fw_lang'>法</span><span class='fw_def'>" + join$.call(translation.francais, ', ') + "</span></div>" : '') + "" + ('Deutsch' in translation ? "<div class='xref-line'><span class='fw_lang'>德</span><span class='fw_def'>" + join$.call(translation.Deutsch, ', ') + "</span></div>" : '') + "</span></div>" : '');
    function expandDef(def){
      return def.replace(/^\s*<(\d)>\s*([介代副助動名嘆形連]?)/, function(_, num, char){
        return String.fromCharCode(0x327F + parseInt(num)) + "" + (char ? char + "\u20DE" : '');
      }).replace(/<(\d)>/g, function(_, num){
        return String.fromCharCode(0x327F + parseInt(num));
      }).replace(/\{(\d)\}/g, function(_, num){
        return String.fromCharCode(0x2775 + parseInt(num));
      }).replace(/[（(](\d)[)）]/g, function(_, num){
        return String.fromCharCode(0x2789 + parseInt(num)) + ' ';
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
      if (LANG === 't') {
        text = text.replace(/([\u31B4-\u31B7])([^\u0358])/g, "<span class='u31bX'>$1</span>$2");
        text = text.replace(/(\u31B4)\u0358/g, "<span class='u31b4-0358'>$1\u0358</span>");
        text = text.replace(/(\u31B5)\u0358/g, "<span class='u31b5-0358'>$1\u0358</span>");
        text = text.replace(/(\u31B6)\u0358/g, "<span class='u31b6-0358'>$1\u0358</span>");
        text = text.replace(/(\u31B7)\u0358/g, "<span class='u31b7-0358'>$1\u0358</span>");
        if (isDroidGap || isChrome) {
          text = text.replace(/([aieou])\u030d/g, "<span class='vowel-030d $1-030d'>$1\u030d</span>");
        } else {
          text = text.replace(/([i])\u030d/g, "<span class='vowel-030d $1-030d'>$1\u030d</span>");
        }
      }
      return text.replace(/[\uFF0E\u2022]/g, '\u00B7').replace(/\u223C/g, '\uFF0D').replace(/\u0358/g, '\u030d');
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
    if (LANG === 'h') {
      return ' ';
    }
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
  $(function(){
    var filterNodes, drawOutline, fetchStrokeXml, strokeWord;
    filterNodes = function(childNodes){
      var nodes, i$, len$, n;
      nodes = [];
      for (i$ = 0, len$ = childNodes.length; i$ < len$; ++i$) {
        n = childNodes[i$];
        if (n.nodeType === 1) {
          nodes.push(n);
        }
      }
      return nodes;
    };
    drawOutline = function(paper, outline, pathAttrs){
      var path, i$, ref$, len$, node, a, stroke;
      path = [];
      for (i$ = 0, len$ = (ref$ = outline.childNodes).length; i$ < len$; ++i$) {
        node = ref$[i$];
        if (node.nodeType !== 1) {
          continue;
        }
        a = node.attributes;
        if (!a) {
          continue;
        }
        switch (node.nodeName) {
        case "MoveTo":
          path.push(["M", parseFloat(a.x.value), parseFloat(a.y.value)]);
          break;
        case "LineTo":
          path.push(["L", parseFloat(a.x.value), parseFloat(a.y.value)]);
          break;
        case "CubicTo":
          path.push(["C", parseFloat(a.x1.value), parseFloat(a.y1.value), parseFloat(a.x2.value), parseFloat(a.y2.value), parseFloat(a.x3.value), parseFloat(a.y3.value)]);
          break;
        case "QuadTo":
          path.push(["Q", parseFloat(a.x1.value), parseFloat(a.y1.value), parseFloat(a.x2.value), parseFloat(a.y2.value)]);
        }
      }
      stroke = paper.path(path).attr(pathAttrs).transform("s0.1,0.1,0,0");
      stroke.node.setAttribute("class", "fade");
      return setTimeout(function(){
        return stroke.node.setAttribute("class", "fade in");
      }, 1);
    };
    fetchStrokeXml = function(code, next, cb){
      return $.get((isCordova ? http("stroke.moedict.tw/") : "utf8/") + code.toLowerCase() + ".xml", cb, "xml").fail(function(){
        return $('svg:last').fadeOut('fast', function(){
          $('svg:last').remove();
          return next();
        });
      });
    };
    strokeWord = function(word, cb, timeout){
      var utf8code, id, div, paper, gridLines, i$, len$, line;
      if (!$('#strokes').is(':visible')) {
        return;
      }
      window.scrollTo(0, 0);
      utf8code = escape(word).replace(/%u/, "");
      id = "stroke-" + ((Math.random() + "").replace(/^../, ''));
      div = $('<div/>', {
        id: id,
        css: {
          display: 'inline-block'
        }
      }).appendTo($('#strokes'));
      paper = Raphael(id, 204, 204);
      gridLines = ["M68,0 L68,204", "M136,0 L136,204", "M0,68 L204,68", "M0,136 L204,136"];
      for (i$ = 0, len$ = gridLines.length; i$ < len$; ++i$) {
        line = gridLines[i$];
        paper.path(line).attr({
          'stroke-width': 1,
          stroke: '#a33'
        });
      }
      return fetchStrokeXml(utf8code, function(){
        return cb(timeout);
      }, function(doc){
        var color, pathAttrs, delay, i$, ref$, len$, outline;
        window.scrollTo(0, 0);
        color = "black";
        pathAttrs = {
          stroke: color,
          "stroke-width": 0,
          "stroke-linecap": "round",
          "fill": color
        };
        delay = 350;
        for (i$ = 0, len$ = (ref$ = doc.getElementsByTagName('Outline')).length; i$ < len$; ++i$) {
          outline = ref$[i$];
          (fn$.call(this, outline));
        }
        return cb(timeout + delay);
        function fn$(outline){
          setTimeout(function(){
            return drawOutline(paper, outline, pathAttrs);
          }, timeout += delay);
        }
      });
    };
    return window.strokeWords = function(words){
      $('#strokes').html('').show();
      if ((function(){
        var ref$;
        try {
          return (ref$ = document.createElement('canvas')) != null ? ref$.getContext('2d') : void 8;
        } catch (e$) {}
      }())) {
        return getScript('js/raf.min.js', function(){
          return getScript('js/gl-matrix-min.js', function(){
            return getScript('js/sax.js', function(){
              return getScript('js/jquery.strokeWords.js', function(){
                var url, dataType;
                url = './json/';
                dataType = 'json';
                if (isCordova) {
                  if (window.DataView && window.ArrayBuffer) {
                    url = './bin/';
                    dataType = 'bin';
                  } else {
                    url = http('stroke-json.moedict.tw/');
                  }
                }
                return $('#strokes').strokeWords(words, {
                  url: url,
                  dataType: dataType,
                  svg: false
                });
              });
            });
          });
        });
      } else {
        return getScript('js/raphael.js', function(){
          var ws, step;
          ws = words.split('');
          step = function(it){
            if (ws.length) {
              return strokeWord(ws.shift(), step, it);
            }
          };
          return step(0);
        });
      }
    };
  });
  LoadedScripts = {};
  function getScript(src, cb){
    if (LoadedScripts[src]) {
      return cb();
    }
    LoadedScripts[src] = true;
    return $.ajax({
      type: 'GET',
      url: src,
      dataType: 'script',
      cache: true,
      crossDomain: true,
      complete: cb
    });
  }
  function in$(x, xs){
    var i = -1, l = xs.length >>> 0;
    while (++i < l) if (x === xs[i]) return true;
    return false;
  }
  function partialize$(f, args, where){
    var context = this;
    return function(){
      var params = slice$.call(arguments), i,
          len = params.length, wlen = where.length,
          ta = args ? args.concat() : [], tw = where ? where.concat() : [];
      for(i = 0; i < len; ++i) { ta[tw[0]] = params[i]; tw.shift(); }
      return len < wlen && len ?
        partialize$.apply(context, [f, ta, tw]) : f.apply(context, ta);
    };
  }
}).call(this);
