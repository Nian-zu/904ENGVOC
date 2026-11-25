"""產生 docs/qtext.json：題號 → [題目, 正確答案, 中文]，給老師／家長儀表板的「錯題本」用（比 bank.json 小很多）。
用法：python3 tools/build_qtext.py（改過題庫後重跑一次）"""
import json, os
D = os.path.join(os.path.dirname(__file__), '..', 'docs')
b = json.load(open(os.path.join(D, 'bank.json')))
jt = json.load(open(os.path.join(D, 'jitian.json')))
out = {}
for i in range(6061):
    q = b['bank'][i]
    out[i] = [q['a'] + '____' + q['b'], q['o'][q['c']], q.get('z', '')]
for q in b['bank']:
    if q.get('r', 0) >= 40000:
        stem = q['a'] + '【' + str(q['m']) + '】' + q['b'] if q.get('m') is not None else q['a'] + '____' + q['b']
        out[q['r']] = [stem, q['o'][q['c']], q.get('z', '')]
for q in jt['items']:
    if q.get('j') == 's': stem = q['a'] + '____' + q['b']
    elif q.get('j') == 'e': stem = '英翻中：' + q['w'] + ' ' + q.get('p', '')
    else: stem = '中翻英：' + q['zh'] + ' ' + q.get('p', '')
    out[q['r']] = [stem, q['o'][q['c']], q.get('zh', '')]
tb = json.load(open(os.path.join(D, 'textbook.json')))
for q in tb['items']:
    if q['j'] == 'e': stem = '英翻中：' + q['w']
    elif q['j'] == 'c': stem = '中翻英：' + q.get('zh', '')
    elif q.get('nb'): stem = q['a'].strip()
    else: stem = q['a'] + '____' + q['b']
    out[q['r']] = [stem, q['o'][q['c']], q.get('z', '') if q['j'] in 'st' else '']
json.dump(out, open(os.path.join(D, 'qtext.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(out), os.path.getsize(os.path.join(D, 'qtext.json')))
