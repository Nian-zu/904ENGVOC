#!/usr/bin/env python3
"""動詞變化題的「雙重判斷」版本：把 be／will 放進空格，同時考時態和形式。

原題：He is ＿＿ his room now.（tidying）→ 看到 is 就能選 V-ing
新版：He ＿＿ his room now.  is tidying ／ was tidying ／ is tidied ／ tidied
      要同時判斷「現在還是過去」「主動還是被動」「進行還是簡單式」

只處理三種句型（提示很明確、其他選項一定錯的才做）：
  T1  主詞＋is/are/am＋V-ing，句中有 now、Look!、Listen! 等現在正在發生的線索
  T3  主詞＋過去式，句中有 yesterday、last…、…ago 等明確的過去時間
  T4  主詞＋will＋原形，句中有 tomorrow、next…、tonight 等未來時間

新版用原題的題號計分（r），正確答案位置和原題相同，所以 Apps Script 的答案檔不用動。
放在原題同一天、同一個句子群組（g），一次測驗只會抽到其中一個版本。
在 build.sh 裡排在 add_why.py 之後、build_extra.py 之前。
"""
import json, os, random, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BANK = os.path.join(ROOT, 'docs', 'bank.json')
NORIG = 6061

PRON = {'i': ('am', 'was', 'have', 'p1'), 'you': ('are', 'were', 'have', 'pl'), 'we': ('are', 'were', 'have', 'pl'),
        'they': ('are', 'were', 'have', 'pl'), 'he': ('is', 'was', 'has', 'sg'), 'she': ('is', 'was', 'has', 'sg'),
        'it': ('is', 'was', 'has', 'sg')}
PL_IRR = {'children', 'people', 'men', 'women', 'feet', 'teeth', 'mice', 'police', 'parents', 'grandparents', 'kids'}
SG_S = {'news', 'bus', 'class', 'glass', 'boss', 'gas', 'dress', 'grass', 'chess', 'mathematics', 'physics'}
DET = {'the', 'a', 'an', 'my', 'your', 'his', 'her', 'our', 'their', 'its', 'this', 'that', 'these', 'those', 'some', 'every', 'each',
       'little', 'big', 'old', 'young', 'new', 'baby', 'best', 'whole', 'tom', "tom's", "mom's", "dad's"}
OBJ = DET | {'me', 'him', 'us', 'them', 'it', 'two', 'three', 'four', 'five', 'many', 'lots', 'a', 'all', 'everything', 'something', 'dinner',
             'lunch', 'breakfast'}
# 雙受詞動詞：He is given a book. 這種被動句也通，不拿被動當誘答
DITRANS = {'give', 'show', 'tell', 'send', 'teach', 'ask', 'offer', 'pay', 'lend', 'bring', 'buy', 'cook', 'make', 'promise', 'hand',
           'pass', 'read', 'write', 'sell', 'find', 'leave', 'owe', 'serve', 'award', 'feed', 'call', 'name', 'elect', 'allow', 'invite'}
# p.p. 常當形容詞（is done / is gone / is lost…），被動版可能說得通，不拿來當誘答
ADJPP = {'do', 'go', 'lose', 'break', 'finish', 'close', 'open', 'tire', 'interest', 'excite', 'marry', 'dress', 'prepare', 'shock',
         'surprise', 'worry', 'bore', 'scare', 'amaze', 'confuse', 'embarrass', 'satisfy', 'disappoint', 'please', 'relax', 'hurt',
         'injure', 'damage', 'cover', 'fill', 'lock', 'freeze', 'dry', 'cook', 'change', 'fix', 'clean', 'wash', 'burn', 'pack', 'park',
         'stick', 'drown', 'stuck', 'stay', 'get', 'grow', 'plan', 'use', 'bless', 'concern', 'involve', 'crowd', 'paint', 'decorate',
         'load', 'mix', 'excuse', 'free', 'warm', 'heat', 'cool', 'shut', 'end', 'calm', 'empty'}

# 原形本身也是形容詞的字（is clean、is dry 說得通），不拿「be＋原形」當誘答
ADJBASE = {'clean', 'dry', 'open', 'empty', 'tidy', 'free', 'warm', 'cool', 'calm', 'clear', 'close', 'slow', 'smooth', 'wet', 'quiet',
           'mean', 'last', 'fine', 'right', 'wrong', 'live', 'present', 'lower', 'separate', 'perfect', 'correct', 'complete', 'double',
           'equal', 'level', 'light', 'dark', 'busy', 'ready', 'short', 'round', 'square', 'total', 'upset', 'welcome', 'present', 'fit'}
NOW = re.compile(r"\b(now|right now|at the moment|at present|currently)\b|^(look|listen|shh|hurry|be quiet|quiet)\b|\b(look|listen)!", re.I)
PAST = re.compile(r"\b(yesterday|last (night|week|month|year|summer|winter|weekend|sunday|monday|tuesday|wednesday|thursday|friday|saturday|time)|\d+ (days|weeks|months|years|hours|minutes) ago|ago|in (19|20)\d\d)\b", re.I)
FUT = re.compile(r"\b(tomorrow|next (week|month|year|summer|winter|weekend|sunday|monday|tuesday|wednesday|thursday|friday|saturday|time)|tonight|soon|later|in the future)\b", re.I)


def subj_info(subj):
    t = re.findall(r"[A-Za-z']+", subj)
    if not t or len(t) > 4: return None
    low = [x.lower() for x in t]
    if any(x in ('and', 'or', 'who', 'what', 'which', 'where', 'when', 'why', 'how', 'there', 'here', 'if', 'because') for x in low): return None
    if len(t) == 1 and low[0] in PRON: return PRON[low[0]]
    last = low[-1]
    if not all(x in DET or re.fullmatch(r"[a-z']+", x) for x in low): return None
    if len(t) == 1 and t[0][0].isupper(): return PRON['he']   # 人名
    if last in PL_IRR: return PRON['they']
    if last.endswith('s') and last not in SG_S and not t[-1][0].isupper(): return PRON['they']
    return PRON['he']


def forms(bank):
    """每個動詞的 s／過去式／p.p.／V-ing（從題庫的中文標籤推回來）。"""
    F = {}
    for k, lab in bank['gl'].items():
        if not k.startswith('v|') or k.count('|') < 2: continue
        _, w, o = k.split('|', 2)
        f = F.setdefault(w, {'base': w})
        if lab.startswith('第三人稱'): f['s'] = o
        elif lab.startswith('現在分詞'): f['ing'] = o
        elif lab.startswith('過去式、過去分詞'): f['past'] = o; f['pp'] = o
        elif lab.startswith('過去式'): f['past'] = o
        elif lab.startswith('過去分詞'): f['pp'] = o
    return F


GLOSS = {
    'bebase': '錯誤用法：be 動詞後面不能直接接原形動詞', 'prog': '現在進行式（am/is/are＋V-ing：現在正在做）', 'pastprog': '過去進行式（was/were＋V-ing：過去某時正在做）',
    'pass': '現在式被動（am/is/are＋p.p.：被…）', 'past': '過去式（過去發生的事）', 'pres': '現在簡單式（習慣、事實）',
    'perf': '現在完成式（has/have＋p.p.：已經…／一直…）', 'will': '未來式（will＋原形：將要…）',
}


def main():
    bank = json.load(open(BANK, encoding='utf-8'))
    items, gl = bank['bank'], bank['gl']
    F = forms(bank)
    inday = set(i for d in bank['days'] for i in d)
    made = {'T1': 0, 'T3': 0, 'T4': 0}
    new = []
    for i in range(min(NORIG, len(items))):
        q = items[i]
        if q['k'] != 'verb' or i not in inday: continue
        w, a, b, ans = q['w'], q['a'], q['b'], q['o'][q['c']]
        f = F.get(w, {})
        sent = (a + ans + b).strip()
        out = None
        m = re.fullmatch(r"(.*?)(?: (is|are|am) |'(s|re|m) )", a)
        if m and f.get('ing') == ans and NOW.search(sent):
            subj = m.group(1).strip()
            info = subj_info(subj)
            if info:
                be = m.group(2) or {'s': 'is', 're': 'are', 'm': 'am'}[m.group(3)]
                pbe = 'were' if be == 'are' else 'was'
                first = (re.findall(r"[A-Za-z']+", b) or [''])[0].lower()
                passive_ok = f.get('pp') and w not in DITRANS and w not in ADJPP and first in OBJ
                x3 = (f'{be} {f["pp"]}', 'pass') if passive_ok else (f'{be} {w}', 'bebase') if w not in ADJBASE else ((f.get('s') if be == 'is' else w), 'pres')
                if f.get('past') and x3[0]:
                    right = f'{be} {ans}'
                    wrong = [(f'{pbe} {ans}', 'pastprog'), x3, (f['past'], 'past')]
                    cue = NOW.search(sent).group(0).strip()
                    if cue.lower() in ('look', 'listen'): cue += '!'
                    why = (f'{cue} 表示「現在正在做」→ 現在進行式 {be}＋V-ing：{right}。{pbe} {ans} 是過去進行式；'
                           + {'pass': f'{x3[0]} 是被動，主詞不是「被」做的；', 'bebase': f'{x3[0]} 是錯的，be 動詞後面不能直接接原形；',
                              'pres': f'{x3[0]} 是現在簡單式（平常的習慣），不是正在做；'}[x3[1]]
                           + f'{f["past"]} 是過去式。')
                    out = ('T1', subj, right, 'prog', wrong, why)
        if not out and f.get('past') and ans == f['past'] and f['past'] != w and PAST.search(sent) and f.get('pp'):
            info = subj_info(a)
            if info and a.strip():
                be, pbe, have, num = info
                subj = a.strip()
                pres = f.get('s') if have == 'has' else w
                if pres:
                    cue = PAST.search(sent).group(0)
                    wrong = [(f'{have} {f["pp"]}', 'perf'), (pres, 'pres'), (f'will {w}', 'will')]
                    why = (f'{cue} 是明確的過去時間 → 過去式 {ans}。{have} {f["pp"]} 是現在完成式，不能配明確的過去時間；'
                           f'{pres} 是現在式；will {w} 是未來式。')
                    out = ('T3', subj, ans, 'past', wrong, why)
        m = re.fullmatch(r"(.*?) will ", a)
        if not out and m and ans == w and FUT.search(sent) and f.get('past') and f.get('pp') and f.get('ing'):
            subj = m.group(1).strip()
            info = subj_info(subj)
            if info:
                be, pbe, have, _ = info
                cue = FUT.search(sent).group(0)
                right = f'will {w}'
                wrong = [(f['past'], 'past'), (f'{have} {f["pp"]}', 'perf'), (f'{pbe} {f["ing"]}', 'pastprog')]
                why = (f'{cue} 是未來的時間 → will＋原形：{right}。{f["past"]} 是過去式；{have} {f["pp"]} 是現在完成式；'
                       f'{pbe} {f["ing"]} 是過去進行式。')
                out = ('T4', subj, right, 'will', wrong, why)
        if not out: continue
        t, subj, right, rk, wrong, why = out
        opts = [x[0] for x in wrong]
        if len(set(opts + [right])) != 4 or any(not x for x in opts): continue
        random.Random('dual|' + str(i)).shuffle(wrong)
        o = [x[0] for x in wrong]
        o.insert(q['c'], right)
        for txt, kind in wrong + [(right, rk)]:
            gl.setdefault('v|' + w + '|' + txt, GLOSS[kind])
        nq = {'d': q['d'], 'k': 'verb', 'a': subj + ' ', 'b': b, 'o': o, 'c': q['c'], 'z': q.get('z', ''), 'w': w,
              'g': q.get('g', ''), 'y': why, 'r': i, 'dual': 1,
              'yc': '先看時間線索決定時態，再看主詞是「做」還是「被做」，兩關都過才是答案。'}
        new.append(nq)
        made[t] += 1
    start = len(items)
    for j, nq in enumerate(new):
        items.append(nq)
        bank['days'][nq['d']].append(start + j)
    json.dump(bank, open(BANK, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('雙重判斷版本：', made, '共', len(new), '題')


if __name__ == '__main__':
    main()
