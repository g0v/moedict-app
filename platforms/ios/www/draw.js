(function(){
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
      var path, i$, ref$, len$, node, a;
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
        case "QuadTo":
          path.push(["Q", parseFloat(a.x1.value), parseFloat(a.y1.value), parseFloat(a.x2.value), parseFloat(a.y2.value)]);
        }
      }
      return paper.path(path).attr(pathAttrs).transform("s0.1,0.1,0,0");
    };
    fetchStrokeXml = function(code, cb){
      return $.get("utf8/" + code.toLowerCase() + ".xml", cb, "xml");
    };
    strokeWord = function(word){
      var utf8code;
      utf8code = escape(word).replace(/%u/, "");
      return fetchStrokeXml(utf8code, function(doc){
        var paper, color, pathAttrs, timeoutSeconds, delay, i$, ref$, len$, outline, results$ = [];
        paper = Raphael("result", 215, 215);
        color = "black";
        pathAttrs = {
          stroke: color,
          "stroke-width": 5,
          "stroke-linecap": "round",
          "fill": color
        };
        timeoutSeconds = 0;
        delay = 500;
        for (i$ = 0, len$ = (ref$ = doc.getElementsByTagName('Outline')).length; i$ < len$; ++i$) {
          outline = ref$[i$];
          results$.push((fn$.call(this, outline)));
        }
        return results$;
        function fn$(outline){
          return setTimeout(function(){
            return drawOutline(paper, outline, pathAttrs);
          }, timeoutSeconds += delay);
        }
      });
    };
    return window.strokeWords = function(words){
      var i$, ref$, len$, a, results$ = [];
      for (i$ = 0, len$ = (ref$ = words.split('')).length; i$ < len$; ++i$) {
        a = ref$[i$];
        results$.push(strokeWord(a));
      }
      return results$;
    };
  });
}).call(this);
