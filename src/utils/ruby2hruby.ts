/**
 * Port of moedict-webkit RightAngle 流程到瀏覽器可執行版本。
 */

const UNICODE = {
  zhuyin: {
    initial: /[\u3105-\u3119\u312A-\u312C\u31A0-\u31A3]/,
    medial: /[\u3127-\u3129]/,
    final: /[\u311A-\u3129\u312D\u31A4-\u31B3\u31B8-\u31BA]/,
    tone: /[\u02D9\u02CA\u02C5\u02C7\u02CB\u02EA\u02EB]/,
    ruyun: /[\u31B4-\u31B7][\u0307\u0358\u030d]?/,
  },
};

const rZyS = UNICODE.zhuyin.initial.source;
const rZyJ = UNICODE.zhuyin.medial.source;
const rZyY = UNICODE.zhuyin.final.source;
const rZyD = `${UNICODE.zhuyin.tone.source}|${UNICODE.zhuyin.ruyun.source}`;

const TYPESET = {
  zhuyin: {
    form: new RegExp(`^\u02D9?(${rZyS})?(${rZyJ})?(${rZyY})?(${rZyD})?$`),
    diao: new RegExp(`(${rZyD})`, 'g'),
  },
};

function toCodePointString(entity: string): string {
  const codePoint = Number.parseInt(entity, 16);
  if (Number.isNaN(codePoint)) return entity;
  if (codePoint <= 0xffff) return String.fromCharCode(codePoint);
  const cp = codePoint - 0x10000;
  return String.fromCharCode((cp >> 10) + 0xd800) + String.fromCharCode((cp % 0x400) + 0xdc00);
}

function normalizeAnnotation(text: string): string {
  return text
    .replace(/\u0061[\u0307\u030d\u0358]/g, '\uDB80\uDC61')
    .replace(/\u0065[\u0307\u030d\u0358]/g, '\uDB80\uDC65')
    .replace(/\u0069[\u0307\u030d\u0358]/g, '\uDB80\uDC69')
    .replace(/\u006F[\u0307\u030d\u0358]/g, '\uDB80\uDC6F')
    .replace(/\u0075[\u0307\u030d\u0358]/g, '\uDB80\uDC75');
}

export function ruby2hruby(html: string): string {
  try {
    if (typeof DOMParser === 'undefined') return html;

    const parser = new DOMParser();
    const doc = parser.parseFromString(`<ruby class="rightangle">${html}</ruby>`, 'text/html');
    const ruby = doc.querySelector('ruby');
    if (!ruby) return html;

    const originalClass = ruby.getAttribute('class') || '';
    const maxspan = ruby.querySelectorAll('rb').length;
    const rus: HTMLElement[] = [];

    const zhuyinRtcs = Array.from(ruby.querySelectorAll('rtc.zhuyin'));
    zhuyinRtcs.forEach((rtc) => {
      const rbs = Array.from(ruby.querySelectorAll('rb'));
      const rts = Array.from(rtc.querySelectorAll('rt'));
      rts.forEach((rt, idx) => {
        const rb = rbs[idx];
        if (!rb) return;

        const rbClone = rb.cloneNode(true);
        const zhuyin = rt.textContent || '';
        const yin = zhuyin.replace(TYPESET.zhuyin.diao, '');
        const diao = zhuyin
          .replace(yin, '')
          .replace(/[\u02C5]/g, '\u02C7')
          .replace(/[\u030D]/g, '\u0358')
          .replace(/[\u0358]/g, '\u0307');

        const form = zhuyin.replace(TYPESET.zhuyin.form, (_s, s, j, y) =>
          [s ? 'S' : null, j ? 'J' : null, y ? 'Y' : null].filter(Boolean).join(''),
        );

        const ru = doc.createElement('ru');
        const zhuyinEl = doc.createElement('zhuyin');
        const yinEl = doc.createElement('yin');
        const diaoEl = doc.createElement('diao');

        yinEl.innerHTML = yin;
        diaoEl.innerHTML = diao;
        zhuyinEl.appendChild(yinEl);
        zhuyinEl.appendChild(diaoEl);
        ru.appendChild(rbClone);
        ru.appendChild(zhuyinEl);
        ru.setAttribute('zhuyin', '');
        ru.setAttribute('diao', diao);
        ru.setAttribute('length', String(yin ? Array.from(yin).length : 0));
        ru.setAttribute('form', form);

        rb.replaceWith(ru);
        rus.push(ru);
      });
      rtc.remove();
    });

    const spans: number[] = [];
    const rtcs = Array.from(ruby.querySelectorAll('rtc'));
    rtcs.forEach((rtc, order) => {
      const rts = Array.from(rtc.querySelectorAll('rt'));
      rts.forEach((rt, idx) => {
        let span = 0;
        let baseNodes: Element[] = [];

        if (order === 0) {
          const rbspan = Math.min(Number(rt.getAttribute('rbspan') || 1), maxspan);
          while (rbspan > span) {
            const rb = rus.shift();
            if (!rb) break;
            baseNodes.push(rb);
            span += Number(rb.getAttribute('span') || 1);
          }

          if (rbspan < span) {
            if (baseNodes.length > 1) return;
            const single = baseNodes[0];
            if (!single) return;
            baseNodes = Array.from(single.querySelectorAll('rb')).slice(0, rbspan);
            span = rbspan;
          }
          spans[idx] = span;
        } else {
          span = spans[idx];
          const orderZeroRu = Array.from(ruby.querySelectorAll('ru[order="0"]'))[idx];
          if (!orderZeroRu) return;
          baseNodes = [orderZeroRu];
        }

        const firstBase = baseNodes[0];
        if (!firstBase) return;

        const ru = doc.createElement('ru');
        const rtClone = rt.cloneNode(true) as Element;
        ru.innerHTML = baseNodes.map((node) => node.outerHTML).join('');
        ru.appendChild(rtClone);
        ru.setAttribute('span', String(span));
        ru.setAttribute('order', String(order));
        ru.setAttribute('class', originalClass);
        ru.setAttribute('annotation', normalizeAnnotation(rt.textContent || ''));

        firstBase.replaceWith(ru);
        baseNodes.slice(1).forEach((node) => node.remove());
      });
    });

    ruby.querySelectorAll('rtc').forEach((rtc) => rtc.remove());
    ruby.querySelectorAll('rt').forEach((rt) => {
      rt.setAttribute('style', 'text-indent: -9999px; color: transparent');
    });

    return ruby.innerHTML.replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) => toCodePointString(hex));
  } catch {
    return html;
  }
}

export function rightAngle(html: string): string {
  const inner = ruby2hruby(html);
  return `<hruby class="rightangle" rightangle="rightangle">${inner}</hruby>`;
}
