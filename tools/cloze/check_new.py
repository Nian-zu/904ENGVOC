#!/usr/bin/env python3
"""新交件的克漏字抄本檢查：抓「同一個模板複製多回」的問題。

用法：python3 tools/cloze/check_new.py D67 D66 ...      （只檢查這幾回，和既有所有回比對）
      python3 tools/cloze/check_new.py --all            （全部互相比對）
check_bank.py 已經檢查單篇格式與單字範圍，這支專門看重複與題材單一。
"""
import json, os, re, sys, glob, itertools
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CL = os.path.join(ROOT, 'tools', 'cloze')
B = json.load(open(os.path.join(ROOT, 'docs', 'bank.json'), encoding='utf-8'))
WORDS = {str(l): [w.lower() for w in ws] for l, ws in zip(B['labels'], B['words'])}

def forms(w):
    s = {w, w + 's', w + 'es', w + 'ed', w + 'ing'}
    if w.endswith('e'): s |= {w + 'd', w[:-1] + 'ing'}
    if w.endswith('y'): s |= {w[:-1] + 'ies', w[:-1] + 'ied'}
    return s

def parse(path):
    unit = os.path.basename(path)[:-4]
    out = []
    for ch in re.split(r'^## ', open(path, encoding='utf-8').read(), flags=re.M)[1:]:
        ls = ch.split('\n')
        body = '\n'.join(l for l in ls[1:] if l and l[0] not in '>+=')
        out.append(dict(unit=unit, title=ls[0].strip(), body=body,
                        opts=[o.split('|') for o in re.findall(r'\[\[([^\]]+)\]\]', body)]))
    return out

def norm(t):
    t = re.sub(r'\[\[([^|\]]+)[^\]]*\]\]', r'\1', t)
    return re.sub(r'[^a-z ]', ' ', t.lower()).split()

def sents(p):
    return [s.strip() for s in re.split(r'(?<=[.!?])\s+', re.sub(r'\[\[([^|\]]+)[^\]]*\]\]', r'\1', p['body'])) if len(s.split()) >= 8]

args = sys.argv[1:]
allf = sorted(glob.glob(os.path.join(CL, 'D*.txt')), key=lambda p: int(re.search(r'D(\d+)', p).group(1)))
new = allf if (not args or args == ['--all']) else [p for p in allf if os.path.basename(p)[:-4] in args]
if not new: sys.exit('找不到指定的回數')
old = [p for p in allf if p not in new]
E, W = [], []

newp = {os.path.basename(p)[:-4]: parse(p) for p in new}
oldp = [q for p in old for q in parse(p)]

for unit, ps in newp.items():
    uw = set()
    for w in WORDS.get(unit, []): uw |= forms(w)
    if len(ps) != 30: E.append(f'{unit} 只有 {len(ps)} 篇（要 30 篇）')
    for i, p in enumerate(ps, 1):
        tag = f'{unit}-{i:02d}「{p["title"][:16]}」'
        ans = [o[0] for o in p['opts']]
        if len(ans) != 5: E.append(f'{tag} 有 {len(ans)} 格（要 5 格）')
        n = sum(1 for a in ans if a.lower() in uw)
        if n < 3: E.append(f'{tag} 只有 {n} 格是這回的單字（要至少 3 格）')
    ts = Counter(p['title'] for p in ps)
    for t, c in ts.items():
        if c > 1: E.append(f'{unit} 標題重複 {c} 次：{t}')
    # 題材單一：政策／流程類關鍵詞
    POL = ('指引', '流程', '稽核', '規範', '透明', '查證', '通報', '分級', '無障礙', '政策')
    pol = [p['title'] for p in ps if any(k in p['title'] for k in POL)]
    if len(pol) > 6: W.append(f'{unit} 有 {len(pol)} 篇標題像政策／流程文件（建議 ≤6）：{pol[0]} …')

# 跨回重複
seen = defaultdict(list)
for p in oldp + [q for ps in newp.values() for q in ps]:
    seen[p['title']].append(p['unit'])
for t, us in seen.items():
    if len({u for u in us}) > 1 and any(u in newp for u in us):
        E.append(f'標題在多回出現（{"、".join(sorted(set(us)))}）：{t}')

idx = defaultdict(set)
for p in oldp:
    for s in sents(p): idx[s.lower()].add(p['unit'])
for unit, ps in newp.items():
    rep = []
    for p in ps:
        for s in sents(p):
            if s.lower() in idx: rep.append((p['title'], sorted(idx[s.lower()])[0], s[:50]))
    if rep:
        E.append(f'{unit} 有 {len(rep)} 句和別回一字不差，例如「{rep[0][2]}…」（與 {rep[0][1]} 相同）')

# 來源網址重複使用
sp = os.path.join(CL, 'sources.md')
if os.path.exists(sp):
    for unit in newp:
        c = Counter()
        for l in open(sp, encoding='utf-8'):
            if l.startswith(unit + '-'):
                for u in re.findall(r'https?://[^；\s]+', l): c[u] += 1
        for u, n in c.items():
            if n > 2: E.append(f'{unit} 同一個網址被引用 {n} 次（最多 2 次）：{u[:70]}')

print('\n'.join('錯誤： ' + e for e in E) or '', end='\n' if E else '')
print('\n'.join('提醒： ' + w for w in W) or '', end='\n' if W else '')
print(f'結果： {"有 %d 項錯誤" % len(E) if E else "全部通過"}（檢查 {len(newp)} 回，共 {sum(len(v) for v in newp.values())} 篇）')
sys.exit(1 if E else 0)
