#!/usr/bin/env python3
"""題庫完整性檢查（句子題＋克漏字）。有錯誤時結束碼為 1。

句子題：答案檔前 6061 筆一致、誘答變化題答案位置和原題相同、四個選項不重複、
        每題有中文翻譯、每個選項有中文解釋（動詞題有形態標示）。
克漏字：每篇 5 格、每格 4 個不重複選項、答案檔一致、每格有詳解、有全文翻譯、
        生字解釋不超過 5 個、全文不超過 250 字；答案不在單字表裡的列為提醒。
"""
import json, os, re, sys, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B = json.load(open(os.path.join(ROOT, 'docs', 'bank.json'), encoding='utf-8'))
K = json.load(open(os.path.join(ROOT, 'docs', 'answer-key.json'), encoding='utf-8'))
bank, gl, labels = B['bank'], B.get('gl', {}), B['labels']
errs, warns = [], []
E = errs.append

# ---- 句子題
for i, q in enumerate(bank):
    tag = f'句子題 #{i}（{labels[q["d"]]} {q["w"]}）'
    if len(q['o']) != 4 or len(set(q['o'])) != 4: E(f'{tag} 選項不是 4 個不重複')
    if not 0 <= q['c'] < len(q['o']): E(f'{tag} 答案位置錯誤')
    if not q.get('z'): E(f'{tag} 缺中文翻譯')
    if '____' in q['a'] + q['b']: E(f'{tag} 題目裡多了空格')
    if 'r' in q and q['c'] != bank[q['r']]['c']: E(f'{tag} 誘答變化題答案位置和原題不同')
    for o in q['o']:
        g = gl.get('v|' + q['w'] + '|' + o) if q['k'] == 'verb' else gl.get(o)
        if not g: E(f'{tag} 選項「{o}」缺中文解釋')
for i in range(min(6061, len(bank))):
    q = bank[i]
    if i >= len(K) or K[i] != [q['c'], q['w'], q['d']]: E(f'答案檔第 {i} 筆和題庫不一致')

# ---- 克漏字
vocab = set(w.lower() for day in B['words'] for w in day)
# 不規則動詞過去式／過去分詞 → 原形
IRR = {}
for base, forms in {
    'be': 'was were been', 'become': 'became', 'begin': 'began begun', 'break': 'broke broken', 'bring': 'brought',
    'build': 'built', 'buy': 'bought', 'catch': 'caught', 'choose': 'chose chosen', 'come': 'came', 'do': 'did done',
    'draw': 'drew drawn', 'drink': 'drank drunk', 'drive': 'drove driven', 'eat': 'ate eaten', 'fall': 'fell fallen',
    'feel': 'felt', 'fight': 'fought', 'find': 'found', 'fly': 'flew flown', 'forget': 'forgot forgotten',
    'forgive': 'forgave forgiven', 'get': 'got gotten', 'give': 'gave given', 'go': 'went gone', 'grow': 'grew grown',
    'have': 'had has', 'hear': 'heard', 'hide': 'hid hidden', 'hold': 'held', 'keep': 'kept', 'know': 'knew known',
    'lay': 'laid', 'lead': 'led', 'leave': 'left', 'lend': 'lent', 'lie': 'lay lain', 'lose': 'lost', 'make': 'made',
    'mean': 'meant', 'meet': 'met', 'pay': 'paid', 'ride': 'rode ridden', 'ring': 'rang rung', 'rise': 'rose risen',
    'run': 'ran', 'say': 'said', 'see': 'saw seen', 'sell': 'sold', 'send': 'sent', 'shake': 'shook shaken',
    'shine': 'shone', 'shoot': 'shot', 'show': 'showed shown', 'sing': 'sang sung', 'sit': 'sat', 'sleep': 'slept',
    'speak': 'spoke spoken', 'spend': 'spent', 'stand': 'stood', 'steal': 'stole stolen', 'swim': 'swam swum',
    'take': 'took taken', 'teach': 'taught', 'tell': 'told', 'think': 'thought', 'throw': 'threw thrown',
    'understand': 'understood', 'wake': 'woke woken', 'wear': 'wore worn', 'win': 'won', 'write': 'wrote written',
    'learn': 'learnt', 'feed': 'fed', 'bite': 'bit bitten', 'blow': 'blew blown', 'dig': 'dug', 'hang': 'hung',
    'sweep': 'swept', 'freeze': 'froze frozen', 'beat': 'beaten', 'bear': 'bore born', 'seek': 'sought',
    'stick': 'stuck', 'strike': 'struck', 'swing': 'swung', 'tear': 'tore torn', 'shut': 'shut', 'quit': 'quit',
}.items():
    for f in forms.split(): IRR[f] = base
def known(w):
    w = w.lower()
    if w in vocab or IRR.get(w) in vocab: return True
    for suf in ('s', 'es', 'ed', 'd', 'ing', 'er', 'est', 'ly'):
        if w.endswith(suf) and (w[:-len(suf)] in vocab or w[:-len(suf)] + 'e' in vocab): return True
    if w.endswith('ied') and w[:-3] + 'y' in vocab: return True
    if w.endswith('ies') and w[:-3] + 'y' in vocab: return True
    if len(w) > 4 and w[-1] == w[-2] == w[-3]: return False
    if w.endswith(('ing', 'ed')) and w[:-4 if w.endswith('ing') else -3] in vocab: return True  # 重複子音 stopping
    return False

idx_path = os.path.join(ROOT, 'docs', 'cloze', 'index.json')
units = json.load(open(idx_path, encoding='utf-8'))['units'] if os.path.exists(idx_path) else {}
short = []
for unit in sorted(units, key=lambda u: -int(u[1:])):
    data = json.load(open(os.path.join(ROOT, 'docs', 'cloze', unit + '.json'), encoding='utf-8'))
    for p in data['passages']:
        tag = f'克漏字 {p["id"]}「{p["title"]}」'
        bl = p['blanks']
        if len(bl) != 5: E(f'{tag} 有 {len(bl)} 格，不是 5 格')
        marks = re.findall(r'\{(\d)\}', p['text'])
        if marks != [str(k) for k in range(1, len(bl) + 1)]: E(f'{tag} 空格編號不連續')
        if '[[' in p['text'] or ']]' in p['text']: E(f'{tag} 有沒處理到的 [[ ]]')
        full = p['text']
        for k, b in enumerate(bl, 1):
            ans = b['o'][b['c']] if 0 <= b['c'] < len(b['o']) else ''
            full = full.replace('{%d}' % k, ans)
            if len(b['o']) != 4 or len(set(o.lower() for o in b['o'])) != 4: E(f'{tag} 第 {k} 格選項不是 4 個不重複')
            if not b.get('why'): E(f'{tag} 第 {k} 格缺詳解')
            if b['id'] >= len(K) or K[b['id']][0] != b['c'] or K[b['id']][1] != ans: E(f'{tag} 第 {k} 格答案檔不一致')
            if not all(known(w) for w in ans.split()): warns.append(f'{tag} 第 {k} 格答案「{ans}」不在單字表')
        n = len(re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?", full))
        if n > 250: E(f'{tag} 全文 {n} 字，超過 250 字')
        if len(p['gloss']) > 5: E(f'{tag} 生字解釋 {len(p["gloss"])} 個，超過 5 個')
        for w, z in p['gloss']:
            if not w or not z: E(f'{tag} 生字解釋「{w}」不完整')
        if not re.search(r'[一-鿿]', p.get('zh', '')): E(f'{tag} 缺全文翻譯')
        if not p.get('title'): E(f'{tag} 缺標題')
    if len(data['passages']) < 30: short.append(f'{unit} {len(data["passages"])} 篇')

print(f'句子題 {len(bank)} 題；克漏字 {sum(units.values())} 篇（{len(units)} 回）')
if short: print('未滿 30 篇的回：', '、'.join(short))
missing = [l for l in labels if l not in units]
if missing: print(f'還沒有克漏字的回：{len(missing)} 回（{missing[0]} … {missing[-1]}）')
for w in warns[:30]: print('提醒：', w)
if len(warns) > 30: print(f'提醒：另有 {len(warns) - 30} 則')
for e in errs[:100]: print('錯誤：', e)
print('結果：', '有錯誤 %d 項' % len(errs) if errs else '全部通過')
sys.exit(1 if errs else 0)
