"""Shared helpers for the distractor review.

Each single-word question sentence ("word" kind) gets a stable id and a fixed list
of candidate distractors. A reviewer marks which candidates would ALSO fit the
sentence (they are then never used) and may rewrite the sentence so only the
answer fits. apply_review.py then rebuilds every version of that question from
the vetted candidates, keeping question ids and answer positions unchanged so
the Apps Script answer key keeps working.
"""
import hashlib, json, os, random, re

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.join(HERE, 'bank_base.json')
VOCAB = os.path.join(HERE, 'vocab.json')
REVIEW_DIR = os.path.join(HERE, 'review')


def load():
    bank = json.load(open(BASE, encoding='utf-8'))
    vocab = json.load(open(VOCAB, encoding='utf-8'))
    return bank, vocab


def plural(n):
    if n.endswith(('s', 'x', 'ch', 'sh')): return n + 'es'
    if n.endswith('y') and n[-2] not in 'aeiou': return n[:-1] + 'ies'
    return n + 's'


def lev(a, b):
    if abs(len(a) - len(b)) > 3: return 9
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


def sid(a, b, ans):
    return hashlib.md5((a + '____' + b + '|' + ans).encode('utf-8')).hexdigest()[:10]


def sentences(bank):
    """Unique word-question sentences in day order: {sid: info}."""
    out = {}
    for i, q in enumerate(bank['bank']):
        if q['k'] != 'word': continue
        ans = q['o'][q['c']]
        k = sid(q['a'], q['b'], ans)
        if k not in out:
            out[k] = {'sid': k, 'a': q['a'], 'b': q['b'], 'ans': ans, 'w': q['w'], 'd': q['d'], 'items': []}
        out[k]['items'].append(i)
    return dict(sorted(out.items(), key=lambda kv: (kv[1]['d'], kv[1]['w'], kv[0])))


VCUE = set("to can can't will won't would should must may might could don't doesn't didn't did does do let's not i we you they he she always often usually never sometimes also".split())
NCUE = set("the a an a(n) your my his her our their its this that these those some any no of many much every each".split())


def slot_pos(info, vocab, override=''):
    pos = vocab[info['w']]['pos'] or ['n']
    if override: return override
    if len(pos) == 1: return pos[0]
    toks = re.findall(r"[a-z'()]+", info['a'].lower())
    prev = toks[-1] if toks else ''
    if prev in VCUE and 'v' in pos: return 'v'
    if prev in NCUE and 'n' in pos: return 'n'
    if not toks and 'v' in pos: return 'v'
    return pos[0]


def candidates(info, vocab, override=''):
    """Fixed candidate distractors for one sentence, in the answer's form."""
    base, ans = info['w'], info['ans']
    rng = random.Random(info['sid'])
    v = vocab[base]
    is_pl = ans.lower() != base.lower()
    cap = ans[0].isupper() and not base[0].isupper()
    def form(e):
        e = plural(e) if is_pl else e
        return e[0].upper() + e[1:] if cap else e
    blocked = set(v['syn']) | {base}
    simple = [w for w in vocab if ' ' not in w and '-' not in w and not w[0].isupper() and w not in blocked
              and base not in vocab[w]['syn']]
    pos = slot_pos(info, vocab, override)
    same = [w for w in simple if pos in vocab[w]['pos']]
    near = [w for w in same if abs(vocab[w]['day'] - v['day']) <= 25]
    far = [w for w in same if abs(vocab[w]['day'] - v['day']) > 25]
    sem = rng.sample(near, min(4, len(near))) + rng.sample(far, min(4, len(far)))
    la = sorted(simple, key=lambda w: (lev(base, w), rng.random()))
    if is_pl: la = [w for w in la if 'n' in vocab[w]['pos']]
    la = [w for w in la if lev(base, w) <= 3 and (w[0] == base[0] or w[-2:] == base[-2:]) and w not in sem][:5]
    return {'sem': [form(w) for w in sem], 'look': [form(w) for w in la]}


def reviewed_through():
    p = os.path.join(REVIEW_DIR, 'done.txt')
    return int(open(p).read().strip() or 0) if os.path.exists(p) else 0


def load_decisions(sents=None):
    """Explicit decision lines, plus an implicit 'all candidates fine' for every
    sentence among the first N (review/done.txt) that has no explicit line."""
    dec = {}
    if sents is not None:
        for k in list(sents)[:reviewed_through()]:
            dec[k] = {'exclude': [], 'stem': '', 'pos': ''}
    if not os.path.isdir(REVIEW_DIR): return dec
    for fn in sorted(os.listdir(REVIEW_DIR)):
        if not fn.startswith('decisions-') or not fn.endswith('.txt'): continue
        for line in open(os.path.join(REVIEW_DIR, fn), encoding='utf-8'):
            line = line.rstrip('\n')
            if not line or line.startswith('#'): continue
            parts = line.split('|')
            k = parts[0].strip()
            excl = [x.strip() for x in (parts[1] if len(parts) > 1 else '').split(',') if x.strip()]
            stem = parts[2].strip() if len(parts) > 2 else ''
            dec[k] = {'exclude': excl, 'stem': stem, 'pos': parts[3].strip() if len(parts) > 3 else ''}
    return dec
