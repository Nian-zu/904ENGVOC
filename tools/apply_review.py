"""Rebuild docs/bank.json from tools/bank_base.json plus all review decisions.

For every reviewed sentence:
  * the stem is replaced when the reviewer rewrote it;
  * every version (original, look-alike, mixed, fun...) gets new distractors drawn
    only from that sentence's vetted candidates (excluded words never appear);
  * the answer stays at the same option index, so question ids and the answer key
    used by Apps Script do not change.
Unreviewed sentences are left exactly as they are.
"""
import json, os, random, re
from review_lib import load, sentences, candidates, load_decisions, HERE

bank, vocab = load()
sents = sentences(bank)
dec = load_decisions(sents)
items = bank['bank']
changed = 0
for k, s in sents.items():
    if k not in dec: continue
    d = dec[k]
    c = candidates(s, vocab, d['pos'])
    excl = {x.lower() for x in d['exclude']}
    sem = [w for w in c['sem'] if w.lower() not in excl]
    look = [w for w in c['look'] if w.lower() not in excl]
    pool_all = sem + look
    a, b = s['a'], s['b']
    if d['stem']:
        m = d['stem'].split('____')
        if len(m) == 2: a, b = m
    for n, i in enumerate(s['items']):
        q = items[i]
        rng = random.Random(k + str(n))
        v = q.get('v', 0)
        if v == 1 and len(look) >= 3: pool = look
        elif v == 4 and look and len(sem) >= 2: pool = None
        elif len(sem) >= 3: pool = sem
        else: pool = pool_all
        if pool is None:
            ds = [rng.choice(look)] + rng.sample(sem, 2)
        else:
            if len(pool) < 3: continue
            ds = rng.sample(pool, 3)
        ans = q['o'][q['c']]
        if ans in ds: continue
        cidx = q['c']
        q['o'] = ds[:cidx] + [ans] + ds[cidx:]
        q['a'], q['b'] = a, b
        q['rv'] = 1
        changed += 1
# sentence key used by the page to avoid repeating a sentence in one quiz
for q in items:
    t = (q['a'] + ' ' + q['b']).lower()
    t = re.sub(r'\b(yesterday|tomorrow|now|last year|every day)\b', '', t)
    q['g'] = re.sub(r'[^a-z]+', '', t)
out = os.path.join(HERE, '..', 'docs', 'bank.json')
json.dump(bank, open(out, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(f'reviewed sentences: {len([k for k in sents if k in dec])} / {len(sents)}; question versions rebuilt: {changed}')
