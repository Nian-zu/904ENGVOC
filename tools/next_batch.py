"""Print the next batch of sentences that still need review.

usage: python3 tools/next_batch.py [N]      (default N = 150)

Workflow: write exception lines to review/decisions-XXXX.txt
    sid|exclude,words|rewritten stem with ____|pos      (later fields optional)
then set review/done.txt to the last index reviewed (+1). Sentences inside the
reviewed range without a line keep all their candidates.
"""
import sys
from review_lib import load, sentences, candidates, slot_pos, reviewed_through

n = int(sys.argv[1]) if len(sys.argv) > 1 else 150
bank, vocab = load()
sents = list(sentences(bank).values())
start = reviewed_through()
print(f'# reviewed {start} / {len(sents)}')
for i, s in enumerate(sents[start:start + n], start):
    c = candidates(s, vocab)
    pp = slot_pos(s, vocab) if len(vocab[s['w']]['pos']) > 1 else ''
    print(f"{i} {s['sid']}{' '+pp if pp else ''} | {s['a']}____{s['b']} | {s['ans']} | {', '.join(c['sem'])} | {', '.join(c['look'])}")
