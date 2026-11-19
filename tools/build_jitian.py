#!/usr/bin/env python3
"""寂天 Ready for Reading Success 3 單字題（題型代碼 k = 'jt'）。

來源：tools/jitian/rs3.json（由老師給的單字表 xlsx 轉出：50 個單元、775 個字）
每個字出兩題：
  j = 'e'  英翻中：看英文（＋詞性）選中文意思
  j = 'c'  中翻英：看中文（＋詞性）選英文
同一個字的兩題 g 相同，一次測驗只會抽到其中一題。

誘答：優先用同一單元、相近單元、同詞性的字；意思有任何重疊（共用兩個字或同一個漢字）的不用，避免出現兩個答案。

題號：從 50000 開始，記在 tools/jitian_ids.json，已編過的永不改變。
輸出：docs/jitian.json（題目）、docs/answer-key-jt.json（{題號: [答案位置, 字, 'U12']}，給 Apps Script 重新計分）。
"""
import json, os, re, random

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'tools', 'jitian', 'rs3.json')
OUT = os.path.join(ROOT, 'docs', 'jitian.json')
KEY = os.path.join(ROOT, 'docs', 'answer-key-jt.json')
IDS = os.path.join(ROOT, 'tools', 'jitian_ids.json')
BASE = 50000


def clean(zh):
    """把三態、搭配詞、複數形等補充說明拆出來，題目只放意思。"""
    notes = []
    def grab(m):
        notes.append(re.sub(r'\s+', ' ', m.group(1)).strip())
        return ''
    zh = re.sub(r'[（(]\s*(動詞三態\s*[:：][^)）]*)[)）]', grab, zh)
    zh = re.sub(r'[（(]\s*(\+[^)）]*)[)）]', grab, zh)
    zh = re.sub(r'[（(]\s*([A-Za-z]+\s*的複數形)[)）]', grab, zh)
    zh = re.sub(r'\s*；\s*', '；', zh).strip(' ；')
    # 一個字兩種詞性寫在一起（帳戶；記述(v.)解釋）：中間加分隔
    zh = re.sub(r'(?<=\S)\s*\(((?:n|v|a|adv|prep|conj|pron)\.)\)\s*', r' ｜ (\1) ', zh)
    zh = re.sub(r'\s*/\s*', '/', zh)
    return zh, '；'.join(n.replace('動詞三態 ：', '動詞三態：').replace('動詞三態： ', '動詞三態：') for n in notes)


def group(p):
    p = p.strip('()').split('/')[0].rstrip('.')
    return {'n': 'n', 'v': 'v', 'a': 'a', 'adv': 'adv', 'phr': 'phr'}.get(p, 'x')


def parts(zh):
    z = re.sub(r'[（(][^)）]*[)）]', '', zh)
    return [x.replace('的', '').replace('地', '').replace('…', '').strip() for x in re.split(r'[；/，、]', z) if x.strip()]


def han(zh):
    return set(re.findall(r'[一-鿿]', re.sub(r'[（(][^)）]*[)）]', '', zh))) - set('的地之一')


def close(a, b):
    """兩個中文意思是否太像（會變成兩個答案）"""
    if a == b: return True
    for x in parts(a):
        for y in parts(b):
            if not x or not y: continue
            if x in y or y in x: return True
            if any(x[i:i + 2] in y for i in range(len(x) - 1)): return True
    return bool(han(a) & han(b))


def main():
    src = json.load(open(SRC, encoding='utf-8'))
    ids = json.load(open(IDS, encoding='utf-8')) if os.path.exists(IDS) else {}
    nxt = max([BASE - 1] + list(ids.values())) + 1
    W = []
    for x in src['words']:
        zh, note = clean(x['zh'])
        W.append(dict(x, zh=zh, nt=note, gp=group(x['p'])))
    items, key = [], {}

    def cands(x):
        """候選誘答：同單元 → 前後 2 單元 → 前後 6 單元 → 全部；同詞性優先"""
        out, seen = [], {x['w'].lower()}
        for rng in (0, 2, 6, 99):
            for same_pos in (True, False):
                for y in W:
                    if y['w'].lower() in seen or abs(y['u'] - x['u']) > rng: continue
                    if same_pos and y['gp'] != x['gp']: continue
                    if not same_pos and (x['gp'] == 'phr') != (y['gp'] == 'phr'): continue   # 片語配片語
                    seen.add(y['w'].lower()); out.append((rng, same_pos, y))
        return out

    for x in W:
        for j in ('e', 'c'):
            sid = f"jt|{x['u']}|{x['n']}|{x['w']}|{j}"
            if sid not in ids:
                ids[sid] = nxt; nxt += 1
            i = ids[sid]
            rnd = random.Random(sid)
            pool = cands(x)
            # 每一層內隨機，但層與層保持順序
            tiers = {}
            for t in pool: tiers.setdefault((t[0], t[1]), []).append(t[2])
            chosen = []
            for k in sorted(tiers, key=lambda k: (not k[1], k[0])):
                ys = tiers[k][:]; rnd.shuffle(ys)
                for y in ys:
                    if len(chosen) == 3: break
                    if close(y['zh'], x['zh']) or any(close(y['zh'], z['zh']) for z in chosen): continue
                    if j == 'c' and any(y['w'].lower() == z['w'].lower() for z in chosen): continue
                    chosen.append(y)
                if len(chosen) == 3: break
            assert len(chosen) == 3, x
            opts = [x] + chosen
            order = list(range(4)); rnd.shuffle(order)
            opts = [opts[k] for k in order]
            c = order.index(0)
            q = {'k': 'jt', 'j': j, 'u': x['u'], 'w': x['w'], 'p': x['p'], 'zh': x['zh'], 'r': i, 'g': f"jt{x['u']}-{x['n']}",
                 'c': c, 'o': [y['zh'] if j == 'e' else y['w'] for y in opts], 'oz': [y['w'] if j == 'e' else y['zh'] for y in opts]}
            if x['nt']: q['nt'] = x['nt']
            if x['lv'] in ('1', '2'): q['lv'] = int(x['lv'])
            items.append(q)
            key[str(i)] = [c, x['w'], 'U%d' % x['u']]
    # ---------- 例句選擇題（j = 's'）：tools/jitian/sentences.txt，句子與誘答人工編寫 ----------
    byw = {}
    for x in W: byw.setdefault(x['w'].lower(), x)
    nsent = 0
    for line in open(os.path.join(ROOT, 'tools', 'jitian', 'sentences.txt'), encoding='utf-8'):
        line = line.rstrip('\n')
        if not line.strip() or line.startswith('#'): continue
        u, w, sent, ans, ds, zh = line.split('|')
        x = next((y for y in W if y['u'] == int(u) and y['w'] == w), None)
        assert x, ('找不到單字', u, w)
        assert sent.count('___') == 1, sent
        opts = [(ans, w)]
        for d in ds.split(','):
            f, _, base = d.partition('=')
            base = base or f
            assert base.lower() in byw, ('誘答不在單字表', base)
            assert f.lower() != ans.lower(), line
            opts.append((f, base))
        assert len(opts) == 4, line
        sid = f"jt|{x['u']}|{x['n']}|{x['w']}|s"
        if sid not in ids:
            ids[sid] = nxt; nxt += 1
        i = ids[sid]
        order = list(range(4)); random.Random(sid).shuffle(order)
        o = [opts[k] for k in order]
        c = order.index(0)
        a, b = sent.split('___')
        q = {'k': 'jt', 'j': 's', 'u': x['u'], 'w': x['w'], 'p': x['p'], 'zh': x['zh'], 'r': i, 'g': f"jt{x['u']}-{x['n']}",
             'a': a, 'b': b, 'z': zh, 'c': c, 'o': [f for f, _ in o],
             'oz': [byw[base.lower()]['w'] + ' ' + byw[base.lower()]['zh'] if f.lower() != byw[base.lower()]['w'].lower() else byw[base.lower()]['zh'] for f, base in o]}
        if x['nt']: q['nt'] = x['nt']
        items.append(q); nsent += 1
        key[str(i)] = [c, x['w'], 'U%d' % x['u']]
    print('例句選擇題', nsent, '題')
    json.dump({'book': src['book'], 'units': src['units'], 'items': items}, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    json.dump(key, open(KEY, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    json.dump(ids, open(IDS, 'w', encoding='utf-8'), ensure_ascii=False, indent=0, sort_keys=True)
    print('寂天題目', len(items), '題，', len(W), '個字')


if __name__ == '__main__':
    main()
