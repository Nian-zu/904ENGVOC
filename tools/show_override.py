"""Show candidates for decision lines that override the slot POS (to vet them)."""
from review_lib import load, sentences, candidates, load_decisions
bank, vocab = load(); s = sentences(bank)
for k, d in load_decisions().items():
    if d['pos'] and k in s:
        c = candidates(s[k], vocab, d['pos'])
        print(k, d['pos'], '|', d['stem'] or s[k]['a'] + '____' + s[k]['b'], '|', ', '.join(c['sem']), '|', ', '.join(c['look']), '| excl:', ','.join(d['exclude']))
