"""Add Chinese to docs/bank.json (run after apply_review.py).

* gl: {option text: Chinese gloss} for every option of word / prep questions,
      and {"v|<verb>|<form>": form label} for verb-form questions.
* z : Chinese translation of the full sentence. Taken from tools/zh/*.txt
      (lines "English sentence<TAB>中文"), otherwise from the original bank
      when the sentence text is unchanged. Rewritten stems never keep an old z.

usage: python3 tools/add_zh.py            (rewrites docs/bank.json)
       python3 tools/add_zh.py --todo N   (print N sentences still lacking Chinese)
"""
import json, os, re, sys
from review_lib import HERE, plural

OUT = os.path.join(HERE, '..', 'docs', 'bank.json')
bank = json.load(open(OUT, encoding='utf-8'))
base = json.load(open(os.path.join(HERE, 'bank_base.json'), encoding='utf-8'))
vocab = json.load(open(os.path.join(HERE, 'vocab.json'), encoding='utf-8'))

PREP = {'to': '(prep.) 到；向；(不定詞) to + 原形動詞', 'for': '(prep.) 為了；給；持續', 'with': '(prep.) 和…一起；用',
        'by': '(prep.) 搭乘；被；在…旁邊', 'of': '(prep.) …的', 'on': '(prep.) 在…上面；在（某天）', 'at': '(prep.) 在（地點／時間點）',
        'from': '(prep.) 從；來自', 'in': '(prep.) 在…裡面；在（月／年）', 'into': '(prep.) 進入；變成', 'after': '(prep.) 在…之後',
        'about': '(prep.) 關於；(adv.) 大約'}


def full(q):
    return re.sub(r'\s+', ' ', (q['a'] + q['o'][q['c']] + q['b']).strip())


def gloss_word(o):
    lo = o.lower()
    for cand in (lo, o):
        if cand in vocab: return vocab[cand]['zh']
    for w in vocab:
        if plural(w).lower() == lo: return vocab[w]['zh'] + '（複數）'
    return PREP.get(lo, '')


IRR_PP = {'get':'gotten','give':'given','find':'found','keep':'kept','mean':'meant','show':'shown','become':'become','leave':'left','lose':'lost',
 'sell':'sold','hurt':'hurt','fight':'fought','hit':'hit','choose':'chosen','hear':'heard','spend':'spent','rise':'risen','catch':'caught',
 'build':'built','understand':'understood','grow':'grown','wear':'worn','forget':'forgotten','hide':'hidden','send':'sent','throw':'thrown',
 'begin':'begun','break':'broken','deal':'dealt','cost':'cost','drive':'driven','teach':'taught','bite':'bitten','hold':'held','draw':'drawn',
 'blow':'blown','feed':'fed','lead':'led','lend':'lent','wake':'woken','take':'taken','put':'put','run':'run','bring':'brought','sleep':'slept',
 'sweep':'swept','hang':'hung','swim':'swum','win':'won','sing':'sung','ride':'ridden','forgive':'forgiven','steal':'stolen','lay':'laid',
 'fit':'fit','hang out':'hung out','pay':'paid','feel':'felt','say':'said','tell':'told','learn':'learned','dream':'dreamed','burn':'burned',
 'smell':'smelled','spell':'spelled','lie':'lied','fly':'flown','eat':'eaten'}

VB = {}
for l in open(os.path.join(HERE, 'verbs.txt'), encoding='utf-8'):
    p = [x.strip() for x in l.split('|')]
    if len(p) >= 3: VB[p[0]] = (p[1].lower(), p[2].lower())


def verb_label(w, o):
    lo = o.lower()
    head = lo.split(' ')[0]
    s3, past = VB.get(w, ('', ''))
    labs = []
    if lo == w.lower(): labs.append('原形')
    if lo == 'to ' + w.lower(): labs.append('不定詞 to V')
    if lo == s3: labs.append('第三人稱單數現在式')
    pp = IRR_PP.get(w, past)
    if lo == past: labs.append('過去式')
    if lo == pp.lower(): labs.append('過去分詞 p.p.')
    if head.endswith('ing') and lo != w.lower(): labs.append('現在分詞 V-ing')
    if not labs: labs.append('過去分詞 p.p.')
    return '、'.join(labs)


# translations
tr = {}
zdir = os.path.join(HERE, 'zh')
for fn in sorted(os.listdir(zdir)):
    if fn.endswith('.txt'):
        for line in open(os.path.join(zdir, fn), encoding='utf-8'):
            if '\t' in line:
                en, zh = line.rstrip('\n').split('\t', 1)
                if zh.strip(): tr[re.sub(r'\s+', ' ', en.strip())] = zh.strip()
    if fn.endswith('.en') and os.path.exists(os.path.join(zdir, fn[:-3] + '.zh')):
        en = [l.rstrip('\n') for l in open(os.path.join(zdir, fn), encoding='utf-8') if l.strip() and not l.startswith('#')]
        zh = [l.rstrip('\n') for l in open(os.path.join(zdir, fn[:-3] + '.zh'), encoding='utf-8') if l.strip()]
        if len(en) != len(zh): sys.exit(f'{fn}: {len(en)} English lines but {len(zh)} Chinese lines')
        for e, z in zip(en, zh):
            e = re.sub(r'\s+', ' ', e.strip())
            tr[e] = z.strip()
old = {}
for q in base['bank']:
    if q.get('z'): old.setdefault(full(q), q['z'])

# rewrite awkward generated verb sentences (answer and option order unchanged)
vfix = {}
vf = os.path.join(zdir, 'verbfix.tsv')
if os.path.exists(vf):
    for line in open(vf, encoding='utf-8'):
        if '\t' in line:
            o_, n_ = line.rstrip('\n').split('\t')
            vfix[o_.strip()] = n_.strip()
fixed = 0
for q in bank['bank']:
    if q['k'] == 'verb' and full(q) in vfix:
        q['_o'] = full(q)
        q['a'], q['b'] = vfix[full(q)].split('____')
        q['g'] = re.sub(r'[^a-z]+', '', (q['a'] + ' ' + q['b']).lower()); fixed += 1

gl, todo, seen = {}, [], set()
for q in bank['bank']:
    s = full(q)
    q['z'] = tr.get(s) or tr.get(q.pop('_o', ''), '') or old.get(s, '')
    if not q['z'] and s not in seen:
        seen.add(s); todo.append((q['d'], q['k'], s))
    for o in q['o']:
        if q['k'] == 'verb':
            gl['v|' + q['w'] + '|' + o] = verb_label(q['w'], o)
            gl.setdefault('v|' + q['w'], gloss_word(q['w']))
        elif o not in gl:
            gl[o] = gloss_word(o)
bank['gl'] = gl

if '--todo' in sys.argv:
    n = int(sys.argv[sys.argv.index('--todo') + 1])
    print(f'# missing Chinese: {len(todo)}')
    for d, k, s in sorted(todo)[:n]: print(s)
    sys.exit()
json.dump(bank, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(f'sentences without Chinese: {len(todo)}; empty glosses: {sum(1 for v in gl.values() if not v)}')
