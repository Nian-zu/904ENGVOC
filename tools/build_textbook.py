#!/usr/bin/env python3
"""翰林 iEnglish 三年級 L3–L4 課本練習（題型代碼 k = 'tb'）。

來源（老師提供的 Word 檔轉成文字，放在 tools/textbook/）：
  u3_words / u4_words      單字卷（中文＋英文）           → j='e' 英翻中、j='c' 中翻英
  u3_vocab / u4_vocab      單字講義（例句、歷屆會考題）   → j='s' 例句填空（附中文）、j='q' 會考題
  u3_grammar / u4_grammar  文法講義（被動式／間接問句）   → j='g' 文法選擇
  （u3_vocab / u4_vocab 後半段也有文法題 → j='g'）
  manual.py                習作、句型改寫、課文背誦句     → j='s'/'g'/'d'/'t'
題號：從 60000 開始，記在 tools/textbook_ids.json（用「單元＋題幹＋答案」當鍵），已編過的永不改變。
正確答案的位置沿用舊答案檔，重跑不影響已經作答的成績。
輸出：docs/textbook.json（題目）、docs/answer-key-tb.json（{題號: [答案位置, 字, 'L3']}）。
"""
import json, os, re, random, sys, hashlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'tools', 'textbook')
OUT = os.path.join(ROOT, 'docs', 'textbook.json')
KEY = os.path.join(ROOT, 'docs', 'answer-key-tb.json')
IDS = os.path.join(ROOT, 'tools', 'textbook_ids.json')
BASE = 60000
sys.path.insert(0, SRC)
import manual  # noqa: E402

rd = lambda n: open(os.path.join(SRC, n), encoding='utf-8-sig').read().replace('\r', '')
CJK = re.compile(r'[一-鿿]')
clean = lambda s: re.sub(r'[ \t　]+', ' ', s).strip()


# ---------- 單字卷 ----------
def words(unit):
    lines = [l.strip() for l in rd('u%d_words.txt' % unit).split('\n')]
    out, cur = [], None
    for l in lines[2:]:
        if re.fullmatch(r'\d+\.', l):
            cur = {'zh': [], 'en': ''}; out.append(cur); continue
        if cur is None or not l: continue
        if CJK.search(l) and not re.search(r'[A-Za-z]{2}', l): cur['zh'].append(l)
        elif re.search(r'[A-Za-z]', l): cur['en'] = l
    res = []
    for x in out:
        if not x['en'] or not x['zh']: continue
        zh = ''.join(x['zh']).replace('；', '；')
        en = x['en'].replace('...', '…').replace(' (=fridge)', '')
        res.append({'w': en, 'zh': zh})
    # 同一個中文（whether／if 都是「是否」）加上開頭字母，不然中翻英會有兩個答案
    from collections import Counter
    dup = Counter(x['zh'] for x in res)
    for x in res:
        if dup[x['zh']] > 1: x['zh'] += '（%s 開頭）' % x['w'][0]
    return res


# ---------- 單字講義：例句 ----------
def entries(unit):
    t = rd('u%d_vocab.txt' % unit).split('壹、')[0]
    heads = list(re.finditer(r'^\s*(\d+)\.\s+([^\[\n]+?)\s*\[[^\]]*\]\s*(（[^）]*）)?\s*(.*)$', t, re.M))
    pos, ex = {}, []
    for i, h in enumerate(heads):
        w = h.group(2).strip()
        pos[w] = (h.group(3) or '').strip('（）')
        body = t[h.end():heads[i + 1].start() if i + 1 < len(heads) else len(t)]
        lines = body.split('\n')
        for j, l in enumerate(lines):
            m = re.match(r'^\s*例：\s*(.*)$', l)
            if not m: continue
            s = m.group(1).rstrip()
            if re.match(r'^[AB]:', s): continue
            zh = ''
            mz = re.search(r'（([^）]*[一-鿿][^）]*)）\s*$', s)
            if mz: zh = mz.group(1); s = s[:mz.start()].rstrip()
            else:
                for k in range(j + 1, min(j + 3, len(lines))):
                    z = lines[k].strip()
                    if z.startswith('（'): zh = z.strip('（）'); break
                    if z: break
            # 答案：前後有兩個以上空白的字（可能是兩個字，如 blew   up）
            mm = re.search(r'(?:^|(?<=\S))\s{2,}(\S(?:.*?\S)?)\s{2,}(?=\S|$)', ' ' + s + '  ')
            if not mm: continue
            core = mm.group(1)
            ans = re.sub(r'\s+', ' ', core)
            S = ' ' + s + '  '
            a, b = S[:mm.start(1)], S[mm.end(1):]
            ex.append({'w': w, 'ans': ans, 'a': clean(a) + ' ', 'b': ' ' + clean(b), 'zh': zh})
    for x in ex:
        x['b'] = re.sub(r'^ ([,.?!’”:;])', r'\1', x['b'])
        if x['a'].strip() == '': x['a'] = ''
    return pos, ex


# ---------- 講義裡的選擇題（含歷屆會考題） ----------
def mcqs(name):
    t = rd(name)
    pat = re.compile(r'(?:\(\s+([ABCD])\s+\)|（\s*([ABCD])\s*）)\s*(?:\d+\.)?\s*')
    ms = list(pat.finditer(t)); out = []
    for i, m in enumerate(ms):
        end = ms[i + 1].start() if i + 1 < len(ms) else len(t)
        body = t[m.end():end]; ans = m.group(1) or m.group(2)
        k = body.find('(A)')
        if k < 0: continue
        stem, opts = body[:k], body[k:]
        parts = re.split(r'\(([ABCD])\)', opts); o = {}
        for j in range(1, len(parts) - 1, 2): o[parts[j]] = parts[j + 1]
        if set(o) != set('ABCD'): continue
        o['D'] = re.split(r'\n\s*\n|\n【|\n\s*\d+\.\s|\n[壹貳參肆一二三四五六七八]、|\n\s*例：|\n\s*[a-d]\.\s|\n\s*重要單字|\n\s*句型', o['D'])[0]
        stem = re.sub(r'【[^】]*】', ' ', stem)
        stem = re.sub(r'_{3,}|　{2,}', ' ___ ', stem)
        # 對話（A: / Name:）保留換行，其他換行接起來
        ls = [clean(l) for l in stem.split('\n') if clean(l)]
        st = ''
        for l in ls:
            if st and re.match(r"^(?:(?:Mrs?|Ms)\. )?[A-Z][A-Za-z\-]*\s?:", l): st += '\n' + l
            else: st += (' ' if st else '') + l
        st = re.sub(r' {2,}', ' ', st).strip()
        st = re.sub(r'(?<=[.?!]) (?=(?:(?:Mrs?|Ms)\. )?[A-Z][a-z]+:)', '\n', st).replace('Mrs.\n', 'Mrs. ').replace('Ms.\n', 'Ms. ').replace('Mr.\n', 'Mr. ')
        st = st.replace(' ___ ,', ' ___,').replace(' ___ .', ' ___.').replace(' ___ ?', ' ___?')
        if '___' not in st: st = '___ ' + st
        out.append({'c': 'ABCD'.index(ans), 'stem': st, 'o': [clean(o[x]) for x in 'ABCD'], 'pos': m.start()})
    return out


# ---------- 教案「單字解析」：課本例句＋補充例句（都有中文翻譯） ----------
def plan_ex(unit):
    t = rd('u%d_plan.txt' % unit)
    t = t[t.find('單字解析'):]
    heads = list(re.finditer(r'^\s*(\d+)\.\t([^\[\n]+?)\s*\[[^\]]*\]', t, re.M))
    out = []
    for k, h in enumerate(heads):
        w = h.group(2).strip()
        body = t[h.end():heads[k + 1].start() if k + 1 < len(heads) else len(t)]
        lines = body.split('\n')
        for n, l in enumerate(lines):
            m = re.match(r'^\t([A-Z][^\u4e00-\u9fff（]*?)\s*(（[^）]*）)?\s*$', l)
            if not m: continue
            sent = m.group(1).strip()
            if re.match(r'^[AB]:', sent) or len(sent.split()) < 4: continue
            zh = m.group(2)
            if not zh and n + 1 < len(lines) and lines[n + 1].strip().startswith('（'): zh = lines[n + 1].strip()
            if not zh: continue
            if not zh.strip('（） '): continue
            if w.startswith('not'): continue
            loc = locate(sent, w)
            if not loc: continue
            a, ans, b = loc
            out.append({'w': w, 'ans': ans, 'a': a, 'b': b, 'zh': zh.strip('（）')})
    return out


def locate(sent, w):
    base = w.split('…')[0].split('...')[0].strip()
    if not base or '(' in base: return None
    last = base.split(' ')[-1]
    stem = ' '.join(base.split(' ')[:-1])
    forms = [last, last + 's', last + 'es', last + 'ed', last + 'd', last + 'ing']
    if last.endswith('e'): forms.append(last[:-1] + 'ing')
    if re.search(r'[^aeiou]y$', last): forms += [last[:-1] + 'ies', last[:-1] + 'ied']
    if re.search(r'[^aeiou][aeiou][bdgmnprt]$', last): forms += [last + last[-1] + 'ed', last + last[-1] + 'ing']
    forms.sort(key=len, reverse=True)
    for f in forms:
        pat = (re.escape(stem) + ' ' if stem else '') + re.escape(f)
        m = re.search(r'(?<![A-Za-z’\'-])' + pat + r'(?![A-Za-z’\'-])', sent, re.I)
        if m: return sent[:m.start()], m.group(0), sent[m.end():]
    return None


FIX_OPT = {'background': 'blackboard', 'if; X': 'if; （不用填）'}   # 講義把 96 年基測題的正確選項打錯了（答案 A 應是 blackboard）


def split_blank(st):
    a, b = st.split('___', 1)
    return a, b


def main():
    rnd = random.Random(20261125)
    oldkey = json.load(open(KEY, encoding='utf-8')) if os.path.exists(KEY) else {}
    ids = json.load(open(IDS, encoding='utf-8')) if os.path.exists(IDS) else {}
    nxt = max([BASE - 1] + list(ids.values())) + 1
    items, key, seen = [], {}, set()

    def add(u, j, w, label, a, b, opts, z='', zh='', oz=None, g=None, nb=False, why=''):
        nonlocal nxt
        opts = [clean(o) if '\n' not in o else o for o in opts]
        if len(set(opts)) != 4: print('⚠ 選項重複', u, a[:40], opts); return
        k = '%d|%s|%s|%s' % (u, re.sub(r'\s+', ' ', a), re.sub(r'\s+', ' ', b), opts[0])   # 題號用的鍵（不要改格式，否則題號會變）
        nz = lambda x: re.sub(r'\s+', ' ', x.replace('’', "'").replace('‘', "'")).strip().lower()
        dk = '%d|%s|%s|%s' % (u, nz(a), nz(b), nz(opts[0]))   # 去重用：直引號／彎引號視為同一句
        if dk in seen: return
        seen.add(dk)
        if k not in ids: ids[k] = nxt; nxt += 1
        r = ids[k]
        c = oldkey[str(r)][0] if str(r) in oldkey else rnd.randrange(4)
        o = opts[1:]; rnd.shuffle(o); o.insert(c, opts[0])
        q = {'k': 'tb', 'j': j, 'u': u, 'w': w, 'p': label, 'r': r, 'g': g or 'tb%d-%s' % (u, hashlib.md5(k.encode()).hexdigest()[:8]), 'a': a, 'b': b, 'o': o, 'c': c}
        if z: q['z'] = z
        if zh: q['zh'] = zh
        if oz: q['oz'] = [oz[opts.index(x)] for x in o]
        if nb: q['nb'] = 1
        if why: q['y'] = why
        items.append(q); key[str(r)] = [c, w, 'L%d' % u]

    for u in (3, 4):
        W = words(u)
        pos, EX = entries(u)
        EX = EX + plan_ex(u)
        # 英翻中／中翻英：誘答取同一課的其他字
        for i, x in enumerate(W):
            others = [y for y in W if y is not x and y['zh'].split('（')[0] != x['zh'].split('（')[0]]
            pick = rnd.sample(others, 3)
            g = 'tbw%d-%d' % (u, i)
            p = pos.get(x['w'], '')
            add(u, 'e', x['w'], p, '', '', [x['zh']] + [y['zh'] for y in pick], zh=x['zh'], oz=[x['w']] + [y['w'] for y in pick], g=g)
            pick = rnd.sample(others, 3)
            add(u, 'c', x['w'], p, '', '', [x['w']] + [y['w'] for y in pick], zh=x['zh'], oz=[x['zh']] + [y['zh'] for y in pick], g=g)
        # 例句填空（附中文提示，同課同詞性的字當誘答，形態跟答案一樣）
        allw = list(pos.keys())

        def form(base, like_ans, like_base):
            b2 = base.split('…')[0].split('...')[0]
            if ' ' in like_base or ' ' in b2: return None
            if like_ans == like_base: return b2
            suf = like_ans[len(like_base):] if like_ans.lower().startswith(like_base.lower()) else None
            if like_ans.lower() == like_base.lower(): return b2
            if suf in ('s', 'es'):
                return b2 + ('es' if re.search(r'(s|x|z|ch|sh)$', b2) else 'ies' if re.search(r'[^aeiou]y$', b2) and False else 's') if not re.search(r'[^aeiou]y$', b2) else b2[:-1] + 'ies'
            if like_ans.endswith('ed') or like_ans.endswith('d') and like_base.endswith('e'):
                if b2.endswith('e'): return b2 + 'd'
                if re.search(r'[^aeiou]y$', b2): return b2[:-1] + 'ied'
                if re.search(r'[^aeiou][aeiou][bdgmnprt]$', b2) and len(b2) <= 4: return b2 + b2[-1] + 'ed'
                return b2 + 'ed'
            if like_ans.endswith('ing'):
                if b2.endswith('ie'): return b2[:-2] + 'ying'
                if b2.endswith('e') and not b2.endswith('ee'): return b2[:-1] + 'ing'
                if re.search(r'[^aeiou][aeiou][bdgmnprt]$', b2) and len(b2) <= 4: return b2 + b2[-1] + 'ing'
                return b2 + 'ing'
            if like_ans.endswith('ies') and like_base.endswith('y'): return b2[:-1] + 'ies' if re.search(r'[^aeiou]y$', b2) else b2 + 's'
            if like_ans.endswith('zes'): return b2 + ('es' if re.search(r'(s|x|z|ch|sh)$', b2) else 's')
            return None

        NOPL = {'tennis', 'badminton', 'smoke', 'glue', 'pleasure', 'chalk', 'fat', 'honey', 'heat', 'gas', 'e-mail', 'middle', 'area'}
        IRREG = {'rise', 'lie', 'slide', 'swing', 'blow up', 'heat', 'quiz', 'refrigerator', 'fat', 'not...anymore', 'through', 'if', 'whether', 'the cloud', 'senior center', 'cheer...up', 'in time', 'wake word', 'voice assistant'}
        for e in EX:
            base = e['w'].split('…')[0].split('...')[0].strip()
            ans = e['ans']
            lb = base if form(base, ans, base) == ans or ans.lower() == base.lower() else None
            if lb is None:   # 不規則變化（slid、lain、quizzes…）：誘答也要人工，先跳過
                continue
            P = pos.get(e['w'], '')
            need = '動詞' if ans != base and re.search(r'(ed|ing)$', ans) else '名詞' if ans != base and ans.endswith('s') and '名詞' in P else None
            cand = []
            for y in rnd.sample(allw, len(allw)):
                if y == e['w'] or y in IRREG or (P and pos.get(y) and not (set(P.split('；')) & set(pos[y].split('；')))): continue
                if need and need not in pos.get(y, ''): continue
                if need == '名詞' and y in NOPL: continue
                if ans != base and re.search(r'(ed|ing|s)$', ans) and ' ' in y: continue
                f = form(y, ans, lb) if lb else None
                if f and f.lower() != ans.lower() and f not in cand: cand.append(f)
                if len(cand) == 3: break
            if len(cand) < 3: continue
            if ans[:1].isupper(): cand = [c[:1].upper() + c[1:] for c in cand]
            add(u, 's', e['w'], '例句', e['a'], e['b'], [ans] + cand, z=e['zh'], zh=e['zh'])
        # 講義選擇題：前半是單字的歷屆會考題，後半（文法講義）是被動式／間接問句
        g_label = '文法・被動式' if u == 3 else '文法・間接問句'
        for fn, j, label in (('u%d_vocab.txt' % u, None, None), ('u%d_grammar.txt' % u, 'g', g_label)):
            text = rd(fn)
            cut = text.find('壹、') if fn.endswith('vocab.txt') else -1
            for q in mcqs(fn):
                o = [FIX_OPT.get(x, x) for x in q['o']]
                jj, lab = j, label
                if jj is None: jj, lab = ('q', '會考題') if q['pos'] < cut else ('g', g_label)
                opts = [o[q['c']]] + [x for k2, x in enumerate(o) if k2 != q['c']]
                a, b = split_blank(q['stem'])
                add(u, jj, o[q['c']], lab, a, b, opts, nb=q['stem'].count('___') > 1)

    # 手動整理：習作
    for (u, j, label, stem, opts, z) in manual.WORKBOOK:
        if '___' in stem: a, b = split_blank(stem); add(u, j, opts[0], label, a, b, opts, z=z, nb=stem.count('___') > 1)
        else: add(u, j, opts[0], label, stem + '\n', '', opts, z=z, nb=True)
    for (act, ok, bad) in manual.PASSIVE:
        add(3, 'g', ok, '句型・主動改被動', act + '\n→ 改成被動語態：\n', '', [ok] + bad, nb=True)
    for (hint, ok, bad) in manual.INDIRECT:
        if '___' in hint and ' ' not in ok.replace('will say', 'x').replace('; ', ';'):
            a, b = split_blank(hint); add(4, 'g', ok, '句型・間接問句', a, b, [ok] + bad)
        elif hint.endswith('___') or '→' in hint:
            add(4, 'g', ok, '句型・間接問句', hint.replace('___', '').rstrip() + '\n', '', [ok] + bad, nb=True)
        elif '___' in hint:
            a, b = split_blank(hint); add(4, 'g', ok, '句型・間接問句', a, b, [ok] + bad, nb=hint.count('___') > 1)
        else:
            add(4, 'g', ok, '句型・間接問句', '中翻英：' + hint + '\n', '', [ok] + bad, nb=True)
    # 課文背誦句
    P = manual.PASSAGES
    for (n, part, bad) in manual.BLANKS:
        u, zh, en = P[n]
        i = en.find(part)
        assert i >= 0, (n, part)
        add(u, 't', part, '背誦句 %d' % (n + 1), en[:i], en[i + len(part):], [part] + bad, z=zh, zh=zh, g='tbt%d-%s' % (n, hashlib.md5(part.encode()).hexdigest()[:6]))
    # 課文理解（課本對話、閱讀、補充閱讀、聽力練習）
    for (tk, q, opts, why) in manual.READING:
        u = 3 if (tk or '').startswith('L3') else 4 if tk else (3 if manual.READING.index((tk, q, opts, why)) < 24 else 4)
        stem = ('【' + manual.TEXT_NAME[tk] + '】\n' + manual.TEXTS[tk] + '\n\nQ: ' + q) if tk else q
        add(u, 'r', opts[0], '課文理解・' + (manual.TEXT_NAME[tk] if tk else '課本聽力練習'), stem + '\n', '', opts, why=why, nb=True)
    for (u, stem, opts, why) in manual.LESSON_G:
        if '___' in stem: a, b = split_blank(stem); add(u, 'g', opts[0], '課文句型', a, b, opts, why=why)
        else: add(u, 'g', opts[0], '課文句型', stem + '\n', '', opts, why=why, nb=True)
    for (n, stem, opts, why) in manual.TENSE:
        u = P[n][0]; a, b = split_blank(stem)
        add(u, 't', opts[0], '背誦句 %d・活用' % (n + 1), a, b, opts, why=why, g='tbx%d-%s' % (n, hashlib.md5(stem.encode()).hexdigest()[:6]))
    for (n, opts, zh) in manual.WHOLE:
        u = P[n][0]
        add(u, 't', opts[0], '背誦句 %d' % (n + 1), '看中文，選出正確的英文：\n' + zh + '\n', '', opts, z=zh, zh=zh, nb=True)

    units = {3: 'The Soldier Was Saved by a Dog', 4: 'Do You Know Where the File Is?'}
    json.dump({'book': '翰林 iEnglish 三年級（L3–L4）', 'units': units, 'passages': [{'u': u, 'zh': zh, 'en': en} for (u, zh, en) in P], 'items': items},
              open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    json.dump(key, open(KEY, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    json.dump(ids, open(IDS, 'w', encoding='utf-8'), ensure_ascii=False, indent=0, sort_keys=True)
    from collections import Counter
    print(len(items), Counter((q['u'], q['j']) for q in items))


if __name__ == '__main__':
    main()
