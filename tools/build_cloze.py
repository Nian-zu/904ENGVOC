#!/usr/bin/env python3
"""克漏字原稿 tools/cloze/D*.txt → docs/cloze/D*.json、docs/cloze/index.json，並把每一格加進 docs/answer-key.json。

每一格有固定題號（tools/cloze_ids.json：「D183-01-1」→ 數字），從 6061 往後編，已編過的永不改變。
answer-key.json 前 6061 筆是句子題，不會動到。
"""
import json, os, random, re, sys, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'tools', 'cloze')
OUT = os.path.join(ROOT, 'docs', 'cloze')
IDS = os.path.join(ROOT, 'tools', 'cloze_ids.json')
KEY = os.path.join(ROOT, 'docs', 'answer-key.json')
BASE = 6061
BLANK = re.compile(r'\[\[([^\]]+)\]\]')


def parse(path):
    unit = os.path.splitext(os.path.basename(path))[0]
    text = open(path, encoding='utf-8').read()
    out, errs = [], []
    for n, chunk in enumerate(re.split(r'^## ', text, flags=re.M)[1:], 1):
        lines = [l.rstrip() for l in chunk.split('\n')]
        title = lines[0].strip()
        body, why, gloss, zh = [], {}, [], []
        for l in lines[1:]:
            if l.startswith('> '):
                m = re.match(r'>\s*(\d)\s+(.*)', l)
                if m: why[int(m.group(1))] = m.group(2).strip()
                else: errs.append(f'{unit}-{n:02d} 詳解格式不對：{l}')
            elif l.startswith('+ '):
                w, _, z = l[2:].partition('=')
                gloss.append([w.strip(), z.strip()])
            elif l.startswith('= '):
                zh.append(l[2:].strip())
            elif l.strip():
                body.append(l.strip())
        raw = ' '.join(body)
        blanks, k = [], 0
        def rep(m):
            nonlocal k
            k += 1
            opts = [o.strip() for o in m.group(1).split('|')]
            blanks.append(opts)
            return '{%d}' % k
        txt = BLANK.sub(rep, raw)
        out.append({'n': n, 'title': title, 'text': txt, 'opts': blanks, 'why': why, 'gloss': gloss, 'zh': ' '.join(zh)})
    return unit, out, errs


def main():
    vocab = json.load(open(os.path.join(ROOT, 'docs', 'bank.json'), encoding='utf-8'))
    labels = vocab['labels']
    ids = json.load(open(IDS, encoding='utf-8')) if os.path.exists(IDS) else {}
    key = json.load(open(KEY, encoding='utf-8'))
    key = key[:BASE] + key[BASE:]  # 句子題不動
    nxt = max([BASE - 1] + list(ids.values())) + 1
    index, errs = {}, []
    os.makedirs(OUT, exist_ok=True)
    for path in sorted(glob.glob(os.path.join(SRC, 'D*.txt')), key=lambda p: -int(re.sub(r'\D', '', os.path.basename(p)))):
        unit, ps, e = parse(path)
        errs += e
        if unit not in labels:
            errs.append(f'{unit}：不是有效的回數'); continue
        d = labels.index(unit)
        pub = []
        for p in ps:
            pid = f'{unit}-{p["n"]:02d}'
            blanks = []
            for b, opts in enumerate(p['opts'], 1):
                bid = f'{pid}-{b}'
                if bid not in ids:
                    ids[bid] = nxt; nxt += 1
                i = ids[bid]
                order = list(range(len(opts)))
                random.Random(bid).shuffle(order)
                o = [opts[j] for j in order]
                c = order.index(0)
                while len(key) <= i: key.append(None)
                key[i] = [c, opts[0], d]
                blanks.append({'id': i, 'o': o, 'c': c, 'why': p['why'].get(b, '')})
            pub.append({'id': pid, 'title': p['title'], 'text': p['text'], 'blanks': blanks, 'gloss': p['gloss'], 'zh': p['zh']})
        json.dump({'unit': unit, 'd': d, 'passages': pub}, open(os.path.join(OUT, unit + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        index[unit] = len(pub)
    # 沒用到的題號（文章被刪掉）在答案檔留 null 以外的舊值也無妨；這裡補齊空洞
    key = [k if k is not None else [0, '', 0] for k in key]
    json.dump({'units': index}, open(os.path.join(OUT, 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    json.dump(key, open(KEY, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    json.dump(ids, open(IDS, 'w', encoding='utf-8'), ensure_ascii=False, indent=0, sort_keys=True)
    print('克漏字：', ', '.join(f'{u} {n} 篇' for u, n in sorted(index.items(), key=lambda x: -int(x[0][1:]))) or '（無）')
    for e in errs: print('錯誤：', e)
    sys.exit(1 if errs else 0)


if __name__ == '__main__':
    main()
