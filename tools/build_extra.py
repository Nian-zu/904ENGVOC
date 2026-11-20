#!/usr/bin/env python3
"""把講義 Unit 2–4 做成題目，併進每日範圍。

來源（tools/extra/）：
  u2_polysemy.json  Unit 2 一字多義：看例句，選這個字在句中的意思      → k = 'sense'
  u3_phrases.json   Unit 3 片語：看例句，選畫線片語的意思              → k = 'phrase'
  u4_cap.json       Unit 4 文法會考真題（原題、標年份題號）              → k = 'cap'
  u5_traps.json     文法陷阱題：同一個提示字、答案卻不同的對照題        → k = 'verb'、trap = 1
                    （例：is cleaning／is cleaned、has to clean／has cleaned、to see／look forward to seeing），
                    破除「看到 is 就選 V-ing、看到 has 就選 p.p.」這種只看提示字的作答習慣

每一題放在跟它有關的單字那一天；講義的字不在 1200 字清單裡的，平均分到題目最少的天。
同一個字（片語）的所有意思放在同一天，學生才會碰到「同字不同義」。

題號：從 40000 開始，記在 tools/extra_ids.json，已編過的永不改變。
答案寫在 docs/answer-key-extra.json（{題號: [答案位置, 字, 天]}），不動克漏字共用的 answer-key.json。
可以重複執行：會先把舊的 sense/phrase/cap 題拿掉再重加。
"""
import json, os, re, random, hashlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'tools', 'extra')
BANK = os.path.join(ROOT, 'docs', 'bank.json')
KEY = os.path.join(ROOT, 'docs', 'answer-key-extra.json')
IDS = os.path.join(ROOT, 'tools', 'extra_ids.json')
BASE = 40000
KINDS = ('sense', 'phrase', 'cap')

IRR = {
    'be': ['am', 'is', 'are', 'was', 'were', 'been', 'being'], 'bite': ['bit', 'bitten'], 'fly': ['flew', 'flown'],
    'fall': ['fell', 'fallen'], 'ring': ['rang', 'rung'], 'slide': ['slid'], 'break': ['broke', 'broken'],
    'catch': ['caught'], 'leave': ['left'], 'lose': ['lost'], 'mean': ['meant'], 'tell': ['told'],
    'get': ['got', 'gotten'], 'keep': ['kept'], 'learn': ['learnt'], 'pay': ['paid'], 'shake': ['shook', 'shaken'],
    'take': ['took', 'taken'], 'throw': ['threw', 'thrown'], 'wake': ['woke', 'woken'], 'eat': ['ate', 'eaten'],
    'hold': ['held'], 'hear': ['heard'], 'find': ['found'], 'give': ['gave', 'given'], 'go': ['went', 'gone', 'goes'],
    'burn': ['burnt'], 'make': ['made'], 'run': ['ran'], 'show': ['shown'], 'stand': ['stood'],
    'write': ['wrote', 'written'], 'feed': ['fed'], 'lead': ['led'], 'deal': ['dealt'], 'dream': ['dreamt'],
    'swing': ['swung'], 'have': ['has', 'had'], 'do': ['did', 'done', 'does'], 'put': [], 'set': [], 'cut': [],
    'hit': [], 'hurt': [], 'half': ['halves'], 'cost': [], 'wear': ['wore', 'worn'], 'sit': ['sat'], 'come': ['came'],
}


def forms(w):
    w = w.lower()
    f = {w, w + 's', w + 'es', w + 'ed', w + 'd', w + 'ing', w + 'er', w + 'est'}
    if w.endswith('e'): f |= {w[:-1] + 'ing', w[:-1] + 'ed'}
    if w.endswith('y'): f |= {w[:-1] + 'ies', w[:-1] + 'ied'}
    if re.search(r'[^aeiou][aeiou][bdgklmnprt]$', w): f |= {w + w[-1] + 'ing', w + w[-1] + 'ed', w + w[-1] + 'er'}
    f |= set(IRR.get(w, []))
    return f


def word_re(w):
    return r"\b(?:%s)\b" % '|'.join(sorted(map(re.escape, forms(w)), key=len, reverse=True))


def phrase_span(phrase, sent):
    """在句子裡找片語（第一個字可變化、可分片語中間可夾 1–4 個字）；回傳 (start, end) 或 None。"""
    p = phrase.lower().replace('’', "'").rstrip(',').strip()
    m = re.match(r'^(\w+) \(([^)]*)\)$', p)   # look (at / for / up)：字本身＋（可有可無的）介副詞
    if m:
        parts = '|'.join(x.strip() for x in m.group(2).split('/'))
        m2 = re.search(word_re(m.group(1)) + r'(?:\s+(?:%s)\b)?' % parts, sent, flags=re.I)
        return (m2.start(), m2.end()) if m2 else None
    p = p.replace("one's", '(?:my|your|his|her|our|their)').replace('...', ' ')
    # 'arrive at / in'、'get on / off'、'look (at / for / up)' 之類：取任一
    alts = []
    m = re.match(r'^(.*?)(\w+) / (\w+)(.*)$', p)
    if m: alts = [m.group(1) + m.group(2) + m.group(4), m.group(1) + m.group(3) + m.group(4)]
    else: alts = [p]
    best = None
    for a in alts:
        toks = [t for t in a.split() if t]
        if not toks: continue
        parts = []
        for i, t in enumerate(toks):
            if t.startswith('(?:'): parts.append(t)
            elif i == 0 or t in ('used',): parts.append(word_re(t))
            else: parts.append(r'\b' + re.escape(t) + r'\b')
        gap = r"(?:\s+[\w'.$,-]+){0,4}?\s+"
        rx = parts[0] + ''.join((gap if i >= 1 else r'\s+') + x for i, x in enumerate(parts[1:], 1))
        rx2 = r'\s+'.join(parts)
        for r in (rx2, rx):
            m = re.search(r, sent, flags=re.I)
            if m and (best is None or m.start() < best[0]): best = (m.start(), m.end()); break
    return best


def parts_of(zh):
    zh = re.sub(r'（[^）]*）', '', zh)
    return [p.replace('的', '').replace('地', '').replace('……', '').strip() for p in zh.split('；') if p.strip()]


def overlap(a, b):
    for x in parts_of(a):
        for y in parts_of(b):
            if not x or not y: continue
            if x in y or y in x: return True
            if any(x[i:i + 2] in y for i in range(len(x) - 1)): return True
    return False


# 意思太接近、放在一起會有兩個答案的（人工挑出來的）
CLOSE = [{'右邊', '向右地'}, {'從事（體育運動）', '玩；玩耍'}, {'僅僅；才', '只有'}, {'僅有的；唯一的', '只有'},
         {'夢想', '夢見'}, {'右邊的', '向右地'}]


def han(z):
    return set(re.findall(r'[\u4e00-\u9fff]', re.sub(r'（[^）]*）', '', z))) - set('的地')


def pick(correct, prefer, pool, seed):
    """prefer：同一個字（片語）的其他意思、或同動詞／同介副詞的片語——只排除意思重疊的。
    pool：其他字的意思——跟答案有任何一個字相同就不用，避免變成同義詞（例如 落下／掉落）。"""
    rnd = random.Random(seed)
    out = [correct]
    def bad(c):
        return any(c == x or overlap(c, x) or {c, x} in CLOSE for x in out)
    for cand in prefer:
        if len(out) == 4: break
        if not bad(cand): out.append(cand)
    for cand in rnd.sample(pool, len(pool)):
        if len(out) == 4: break
        if not bad(cand) and not (han(cand) & han(correct)): out.append(cand)
    return out


def main():
    bank = json.load(open(BANK, encoding='utf-8'))
    key = {}
    ids = json.load(open(IDS, encoding='utf-8')) if os.path.exists(IDS) else {}
    nxt = max([BASE - 1] + list(ids.values())) + 1

    # 先拿掉舊的（都在最後面）
    items = bank['bank']
    cut = next((i for i, q in enumerate(items) if q['k'] in KINDS or q.get('trap')), len(items))
    items[:] = items[:cut]
    bank['days'] = [[i for i in d if i < cut] for d in bank['days']]

    W = {}
    for d, ws in enumerate(bank['words']):
        for w in ws: W.setdefault(w.lower(), d)
    ndays = len(bank['days'])
    load = [0] * ndays

    def day_for(words, seed):
        for w in words:
            if w in W: return W[w]
        # 不在 1200 字清單：放到目前新題最少的天（同樣少就依雜湊挑，分散開來）
        h = int(hashlib.md5(seed.encode()).hexdigest(), 16)
        low = min(load)
        cands = [d for d in range(ndays) if load[d] == low]
        return cands[h % len(cands)]

    new, errs = [], []

    def add(q, sid, d):
        if sid not in ids: ids[sid] = nxt_id()
        i = ids[sid]
        q['d'] = d; q['r'] = i; q['g'] = 'x%d' % i
        new.append(q)
        key[str(i)] = [q['c'], q['w'], d]

    def nxt_id():
        nonlocal nxt
        nxt += 1
        return nxt - 1

    # ---------- Unit 2 一字多義 ----------
    ZH = json.load(open(os.path.join(SRC, 'zh_examples.json'), encoding='utf-8'))   # 例句中文翻譯
    u2 = json.load(open(os.path.join(SRC, 'u2_polysemy.json'), encoding='utf-8'))
    groups = {}
    for r in u2: groups.setdefault(r['w'], []).append(r)
    pool2 = sorted({r['zh'] for r in u2})
    for w, rows in groups.items():
        head = 'course' if w == 'of course' else w.split(' (')[0].split()[0]
        d = day_for([head], 'u2-' + w); load[d] += 1
        for r in rows:
            same = [x['zh'] for x in groups[w] if x['zh'] != r['zh']]
            if w == 'course': same += [x['zh'] for x in groups.get('of course', [])]
            if w == 'of course': same += [x['zh'] for x in groups.get('course', [])]
            for n, ex in enumerate(r['ex']):
                if w in ('of course', 'put on') or '(' in w:
                    sp = phrase_span(w, ex)
                else:
                    m = re.search(word_re(head), ex, flags=re.I)
                    sp = (m.start(), m.end()) if m else None
                if not sp: errs.append(f'U2 找不到 {w}：{ex}'); continue
                o = pick(r['zh'], same, pool2, 'u2|' + w + '|' + ex)
                order = list(range(len(o))); random.Random('o|' + ex).shuffle(order)
                add({'k': 'sense', 'a': ex[:sp[0]], 'm': ex[sp[0]:sp[1]], 'b': ex[sp[1]:], 'w': w, 'z': ZH[ex],
                     'o': [o[j] for j in order], 'c': order.index(0)}, f'u2|{w}|{r["zh"]}|{ex}', d)

    # ---------- Unit 3 片語 ----------
    u3 = json.load(open(os.path.join(SRC, 'u3_phrases.json'), encoding='utf-8'))
    pool3 = sorted({r['zh'] for r in u3})
    STOP = {'be', 'get', 'a', 'the', 'one', "one's", 'to', 'of', 'in', 'on', 'at', 'for', 'up', 'down', 'off', 'out',
            'with', 'away', 'by', 'from', 'about', 'onto', 'after', 'around', 'into', 'ahead', 'school'}
    g3 = {}
    for r in u3: g3.setdefault(r['w'], []).append(r)
    for w, rows in g3.items():
        toks = [t for t in re.findall(r"[a-z]+", w.lower()) if t not in STOP]
        d = day_for(toks, 'u3-' + w); load[d] += 1
        first = w.split()[0]
        part = w.split()[-1]
        for r in rows:
            same = [x['zh'] for x in rows if x['zh'] != r['zh']]
            near = [x['zh'] for x in u3 if x['w'] != w and (x['w'].split()[0] == first or x['w'].split()[-1] == part)]
            for n, ex in enumerate(r['ex']):
                sp = phrase_span(w, ex)
                if not sp: errs.append(f'U3 找不到 {w}：{ex}'); continue
                o = pick(r['zh'], same + sorted(near), pool3, 'u3|' + w + '|' + ex)
                order = list(range(len(o))); random.Random('o|' + ex).shuffle(order)
                add({'k': 'phrase', 'a': ex[:sp[0]], 'm': ex[sp[0]:sp[1]], 'b': ex[sp[1]:], 'w': w, 'z': ZH[ex],
                     'o': [o[j] for j in order], 'c': order.index(0)}, f'u3|{w}|{r["zh"]}|{ex}', d)

    # ---------- Unit 4 文法會考真題 ----------
    u4 = json.load(open(os.path.join(SRC, 'u4_cap.json'), encoding='utf-8'))
    # 詳解（與 u4_cap.json 同順序）：中文翻譯、為什麼選這個、其他選項錯在哪、口訣
    XP = json.load(open(os.path.join(SRC, 'u4_explain.json'), encoding='utf-8'))
    assert [e['tag'] for e in XP] == [x['tag'] for x in u4], 'u4_explain.json 和 u4_cap.json 順序不一致'
    for x, e in zip(u4, XP):
        a, b = x['stem'].split('＿＿')
        right = x['o'][x['c']]
        # 放在題目裡出現的 1200 字所在的天之中，目前新題最少的那天
        words = [t.lower() for t in re.findall(r"[A-Za-z]+", x['stem'] + ' ' + right)]
        hits = sorted({W[t] for t in words if t in W})
        d = min(hits, key=lambda v: (load[v], v)) if hits else day_for([], 'u4-' + x['tag'])
        load[d] += 1
        add({'k': 'cap', 'a': a, 'b': b, 'o': x['o'], 'c': x['c'], 'w': right,
             't': x['tag'], 'p': x['topic'], 'z': e['zh'], 'x': [e['why'], e['no'], e['tip']]}, f'u4|{x["tag"]}|{x["stem"][:40]}', d)

    # ---------- 文法陷阱題 ----------
    u5 = json.load(open(os.path.join(SRC, 'u5_traps.json'), encoding='utf-8'))
    for x in u5:
        a, b = x['stem'].split('＿＿')
        right = x['o'][x['c']]
        order = list(range(4)); random.Random('t|' + x['stem']).shuffle(order)
        o = [x['o'][j] for j in order]
        d = day_for([x['v']], 'u5-' + x['stem']); load[d] += 1
        add({'k': 'verb', 'trap': 1, 'a': a, 'b': b, 'o': o, 'c': o.index(right), 'w': x['v'],
             'z': x['zh'], 'y': x['why'], 'tc': x['trap']}, f'u5|{x["stem"]}', d)

    # 寫回
    start = len(items)
    for j, q in enumerate(new):
        items.append(q)
        bank['days'][q['d']].append(start + j)
    json.dump(bank, open(BANK, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    json.dump(key, open(KEY, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    json.dump(ids, open(IDS, 'w', encoding='utf-8'), ensure_ascii=False, indent=0, sort_keys=True)
    from collections import Counter
    print('新增', Counter(q['k'] for q in new), '；有新題的天數', sum(1 for v in load if v), '/', ndays)
    for e in errs: print('⚠️', e)


if __name__ == '__main__':
    main()
