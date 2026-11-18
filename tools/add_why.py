#!/usr/bin/env python3
"""幫「動詞變化」題加上給國中生看的文法說明（欄位 y），答完題目時顯示。

依空格前後的字判斷為什麼要用這個形式，例如：
  May I ___ → 前面有助動詞 may，後面接原形動詞。
  He has just ___ → have／has＋過去分詞（現在完成式）。
判斷不出來、或規則判斷的形式和答案對不上時，就不寫（寧可不說，也不要說錯）。
在 tools/build.sh、tools/todo.sh 中，接在 add_zh.py 後面執行；只改 docs/bank.json 的 y 欄位。
"""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BANK = os.path.join(ROOT, 'docs', 'bank.json')

MODALS = {'will', "won't", 'can', "can't", 'cannot', 'may', 'must', 'should', "shouldn't", 'could', "couldn't",
          'would', "wouldn't", 'might', 'shall', "'ll"}
DO = {'do', 'does', 'did', "don't", "doesn't", "didn't"}
HAVE = {'have', 'has', 'had', "haven't", "hasn't", "hadn't", "'ve"}
BE = {'am', 'is', 'are', 'was', 'were', "'m", "'re", 'be', 'been', 'being', "isn't", "aren't", "wasn't", "weren't"}
ADV = {'not', 'just', 'already', 'never', 'ever', 'always', 'often', 'usually', 'sometimes', 'also', 'really', 'still',
       'finally', 'even', 'only', 'soon', 'all', 'both', 'quickly', 'slowly', 'carefully', 'suddenly', 'probably', 'first',
       'yet', 'hardly', 'seldom', 'almost'}
SUBJ_3 = {'he', 'she', 'it'}
SUBJ_P = {'i', 'you', 'we', 'they'}
ING_VERBS = {'enjoy', 'enjoys', 'enjoyed', 'finish', 'finishes', 'finished', 'keep', 'keeps', 'kept', 'mind', 'minds',
             'practice', 'practices', 'practiced', 'stop', 'stops', 'stopped', 'quit', 'avoid', 'avoids', 'avoided',
             'like', 'likes', 'love', 'loves', 'hate', 'hates', 'start', 'started', 'begin', 'began', 'spend', 'spent',
             'go', 'goes', 'went', 'feel like', 'mind'}
PREPS = {'of', 'in', 'at', 'for', 'about', 'without', 'before', 'after', 'by', 'on', 'from', 'with', 'into', 'like'}
CAUSE = {'let', 'lets', 'make', 'makes', 'made', 'help', 'helps', 'helped', 'have', 'has', 'had'}
SENSE = {'see', 'saw', 'watch', 'watched', 'hear', 'heard', 'feel', 'felt', 'notice', 'noticed'}
PAST_T = [r'\byesterday\b', r'\blast (?:night|week|month|year|summer|winter|weekend|time|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b',
          r'\b\w+ (?:days?|weeks?|months?|years?|hours?|minutes?) ago\b', r'\bago\b', r'\bin 1\d{3}\b', r'\bin 20\d\d\b',
          r'\bthis morning\b', r'\bwhen (?:i|he|she|we|they) (?:was|were)\b', r'\bjust now\b', r'\bthe other day\b', r'\bbefore[.!]?$', r'\byears later\b', r'\bat first\b', r'\bwhen (?:you|he|she|i|we|they) (?:was|were)\b']
HABIT = ['every day', 'every week', 'every morning', 'every night', 'every year', 'every month', 'every weekend', 'every',
         'always', 'usually', 'often', 'sometimes', 'never']
PAST_W = {'came', 'met', 'ran', 'watched', 'saw', 'scored', 'left', 'said', 'went', 'got', 'took', 'made', 'did', 'fell',
          'found', 'told', 'heard', 'arrived', 'started', 'finished', 'opened', 'called', 'asked', 'wanted', 'tried', 'gave',
          'bought', 'ate', 'drank', 'wrote', 'sang', 'won', 'lost', 'became', 'began', 'woke', 'broke', 'stood', 'sat',
          'was', 'were', 'died', 'shouted', 'cried', 'laughed', 'looked', 'walked', 'played', 'lived', 'happened', 'decided', 'turned'}
NOW = ['right now', 'now', 'at the moment', 'look!', 'listen!']


def toks(s):
    s = re.sub(r"(\w)'(m|re|s|ve|ll|d)\b", r"\1 '\2", s.lower())   # I'm → i 'm
    return re.findall(r"[A-Za-z']+|[!?.]", s)


def form(q, ans):
    """答案是哪一種形式：base／s／ing／ed（過去式或過去分詞）／to。"""
    w = q['w'].lower()
    a = ans.lower()
    if a.startswith('to '): return 'to'
    if a == w: return 'base'
    if a.endswith('ing'): return 'ing'
    others = [o.lower() for o in q['o']]
    # 第三人稱：w+s／w+es／y→ies，或 has／does／goes
    if a in (w + 's', w + 'es', w[:-1] + 'ies', 'has', 'does', 'goes', 'is'): return 's'
    return 'ed'


def find(pats, text):
    for p in pats:
        m = re.search(p, text)
        if m: return m.group(0).rstrip('.!')
    return None


def why(q):
    ans = q['o'][q['c']]
    f = form(q, ans)
    L = toks(q['a'])
    R = q['b'].lower()
    full = (q['a'] + ' ' + ans + ' ' + q['b']).lower()
    # 空格前最後一個「不是副詞」的字
    i = len(L) - 1
    while i >= 0 and L[i] in ADV: i -= 1
    prev = L[i] if i >= 0 else ''
    prev2 = ' '.join(L[max(0, i - 1):i + 1])
    advs = ' '.join(L[i + 1:])

    if L and L[0] in ("don't", 'do') and '?' not in q['b'] and f == 'base' and prev in DO:
        return f"Don't＋原形動詞是祈使句，叫別人不要做某件事，所以用 {ans}。" if L[0] == "don't" else f'Do＋原形動詞是祈使句，所以用 {ans}。'
    # if／when 子句：用現在式代替未來
    if (set(L) & {'if', 'when', 'before', 'after', 'until'}) and f in ('base', 's') and re.search(r"\bwill\b|'ll\b|\bwon't\b", q['b'].lower()):
        c = next(t for t in L if t in {'if', 'when', 'before', 'after', 'until'})
        return f'{c} 後面的子句雖然說的是未來，但要用現在式代替未來式，所以用 {ans}。'
    # 疑問句：Does he ___? / Has she ___ yet?
    # 疑問句規則只用在「助動詞＋主詞＋空格」（主詞最多兩個字），避免 Do you think aliens ___? 這種子句
    short_q = 2 <= len(L) <= 3 and not (set(L[1:]) & (MODALS | DO | HAVE | BE | {'to'}))
    if short_q and L[0] in DO and f == 'base' and '?' in q['b']:
        return f'句首有助動詞 {L[0].capitalize()}（疑問句），助動詞後面的動詞要用原形，所以用 {ans}。'
    if short_q and L[0] in HAVE and f == 'ed':
        return f'句首有 {L[0].capitalize()}（現在完成式的疑問句），have／has＋過去分詞（p.p.），所以用 {ans}。'
    if short_q and L[0] in MODALS and f == 'base' and '?' in q['b']:
        return f'句首有助動詞 {L[0].capitalize()}（疑問句），助動詞後面的動詞要用原形，所以用 {ans}。'
    if f == 'ing' and prev not in BE and (set(L) & {'is', 'are', 'am', 'was', 'were'}) and '?' in q['b']:
        be = next(t for t in L if t in {'is', 'are', 'am', 'was', 'were'})
        return f'這是進行式的疑問句：{be} 放到前面，後面的動詞還是用 V-ing，所以用 {ans}。'
    if f == 'base' and any(t in ('make', 'makes', 'made', 'let', 'lets') for t in L[-4:]) and prev not in MODALS | DO | {'to'}:
        c = [t for t in L[-4:] if t in ('make', 'makes', 'made', 'let', 'lets')][-1]
        return f'{c}＋人／物＋原形動詞（使役動詞：讓…做…），所以用 {ans}。'
    if L and all(t in ADV | {'please'} for t in L) and f == 'base':
        return f'句子一開頭就是動詞（{" ".join(L).capitalize()} 後面），是祈使句（叫別人做或不要做），用原形動詞，所以用 {ans}。'
    if prev in MODALS and f == 'base':
        m = 'will' if prev == "'ll" else prev
        return f'前面有助動詞 {m}，助動詞後面要接原形動詞，所以用 {ans}。'
    if prev in DO and f == 'base':
        tail = '（過去式由 did 表示，後面的動詞不用再變化）' if prev in ('did', "didn't") else ''
        return f'前面有助動詞 {prev}，助動詞後面要接原形動詞，所以用 {ans}{tail}。'
    if prev == 'to' and f == 'base':
        return f'to 後面接原形動詞（不定詞 to＋V），所以用 {ans}。'
    if prev == 'to' and f == 'ing':
        return f'這裡的 to 是介系詞（例如 look forward to、be used to），介系詞後面接 V-ing，所以用 {ans}。'
    if prev in HAVE and f == 'base' and ans.lower() in ('run', 'come', 'become', 'hit', 'cut', 'put', 'set', 'let', 'hurt', 'cost', 'shut', 'read', 'spread', 'quit', 'overcome'):
        f = 'ed'
    if prev in HAVE and f == 'ed':
        extra = f'（{advs} 常和完成式一起用）' if advs in ('just', 'already', 'never', 'ever', 'not', 'yet') else ''
        return f'前面有 {prev}，現在完成式是 have／has＋過去分詞（p.p.），所以用 {ans}{extra}。' if prev != 'had' else \
            f'前面有 had，過去完成式是 had＋過去分詞（p.p.），所以用 {ans}。'
    if prev == 'been' and f == 'ing':
        return f'have／has been＋V-ing 是現在完成進行式，表示一直在做，所以用 {ans}。'
    if prev == "'s" and f == 'ing': prev = 'is'
    if prev in BE and f == 'ing':
        t = find([r'right now', r'\bnow\b', r'at the moment', r'look!', r'listen!'], full)
        hint = f'句中有 {t}，' if t else ''
        return f'{hint}be 動詞（{prev}）＋V-ing 是進行式，表示正在做，所以用 {ans}。'
    if prev in BE and f == 'ed':
        return f'主詞是「被」做的一方，用被動語態 be 動詞（{prev}）＋過去分詞（p.p.），所以用 {ans}。'
    if f == 'ing' and prev in ING_VERBS:
        return f'{prev} 後面的動作要用 V-ing，所以用 {ans}。'
    if f == 'ing' and prev in PREPS:
        return f'{prev} 是介系詞，介系詞後面的動詞要用 V-ing（動名詞），所以用 {ans}。'
    if f == 'ing' and not L:
        return f'動詞放在句首當主詞時要變成 V-ing（動名詞），所以用 {ans}。'
    if f == 'base' and len(L) >= 2 and L[-2] in CAUSE and L[-1] in ('me', 'him', 'her', 'us', 'them', 'you', 'it'):
        return f'{L[-2]}＋人＋原形動詞（使役動詞），所以用 {ans}。'
    if f == 'base' and not L:
        return f'句子用原形動詞開頭，是祈使句（叫別人做事），所以用 {ans}。'
    if f == 'ed' and prev in ('get', 'gets', 'got', 'become', 'became', 'feel', 'felt', 'seem', 'seemed', 'look', 'looked', 'keep', 'kept'):
        return None
    if f == 'ed':
        t = find(PAST_T, full)
        if t: return f'句中有 {t}，是過去發生的事，要用過去式，所以用 {ans}。'
        # 句中另一個動詞是過去式 → 同一件事，時態一致
        rest = toks(q['a'] + ' ' + q['b'])
        other = next((x for x in rest if x in PAST_W), None)
        if other and prev not in BE | HAVE | PREPS | {"'s", 'the', 'a', 'an'} and not (set(rest) & {'is', 'are', 'am', "'m", "'re"}):
            return f'句中另一個動詞 {other} 是過去式，說的是過去發生的同一件事，時態要一致，所以也用過去式 {ans}。'
    if f == 's' and L and prev not in SUBJ_P | MODALS | DO | HAVE | BE | {'to'}:
        h = next((x for x in HABIT if re.search(r'\b' + re.escape(x) + r'\b', full)), None)
        if find(PAST_T, full): return None
        hint = f'句中有 {h}，是平常的習慣或事實，用現在式；' if h else '說的是平常的事實或習慣，用現在式；'
        subj = prev if prev in SUBJ_3 else '主詞'
        return f'{hint}{subj} 是第三人稱單數，動詞要加 s 或 es，所以用 {ans}。'.replace('主詞 是', '主詞是')
    if f == 'base' and L and (prev.endswith('s') and prev not in SUBJ_3 | {'is', 'was', 'has', 'does', 'this', 'his', 'its', 'us'} or prev in ('people', 'children', 'men', 'women')):
        h = next((x for x in HABIT if re.search(r'\b' + re.escape(x) + r'\b', full)), None)
        if find(PAST_T, full): return None
        hint = f'句中有 {h}，是平常的習慣，用現在式；' if h else '說的是平常的事實，用現在式；'
        return f'{hint}主詞 {prev} 是複數，動詞用原形（不加 s），所以用 {ans}。'
    if f == 'base' and prev in SUBJ_P:
        h = next((x for x in HABIT if re.search(r'\b' + re.escape(x) + r'\b', full)), None)
        if find(PAST_T, full): return None
        hint = f'句中有 {h}，是平常的習慣，用現在式；' if h else '說的是平常的事，用現在式；'
        return f'{hint}主詞是 {prev.capitalize() if prev != "i" else "I"}，現在式動詞用原形，所以用 {ans}。'
    return None


def main():
    b = json.load(open(BANK, encoding='utf-8'))
    n = tot = 0
    GL = b.get('gl', {})
    # 「單字選擇」題：答案是動詞、而且空格前面是助動詞／to／完成式／進行式這類一看就知道動詞形式的位置，也給說明
    #（不用「現在式加 s」「過去時間」這類規則，因為名詞也可能長得一樣，例如 apples）
    OK_WORD = ('前面有助動詞', '句首有助動詞', 'to 後面接原形', '前面有 has', '前面有 have', '前面有 had', '句首有 Has',
               '句首有 Have', "Don't＋", 'be 動詞', '句中有 now，be', '句中有 right now', '這是進行式的疑問句', '主詞是「被」',
               'make', 'made', 'let')
    # 介系詞搭配題：人工寫好的搭配說明（tools/extra/prep_why.json，以題目句子為鍵）
    PW = json.load(open(os.path.join(ROOT, 'tools', 'extra', 'prep_why.json'), encoding='utf-8'))
    VW = json.load(open(os.path.join(ROOT, 'tools', 'extra', 'verb_why.json'), encoding='utf-8'))
    for q in b['bank']:
        if q['k'] == 'prep':
            y = PW.get(q['a'] + '|' + q['b'])
            if y: q['y'] = y
            else: q.pop('y', None)
            continue
        if q['k'] == 'word':
            y = why(q) if '(v.)' in GL.get(q['w'], '') else None
            # do／does／did 不在句首又不是否定時，可能是一般動詞（Smoking does harm to…），不說明
            if y and re.match(r'前面有助動詞 (do|does|did)，', y): y = None
            if y and y.startswith(OK_WORD): q['y'] = y
            else: q.pop('y', None)
            continue
        if q['k'] != 'verb': continue
        tot += 1
        # 規則判斷不出來、但答案明確的題目：人工寫的說明（tools/extra/verb_why.json）
        y = VW.get(q['a'] + '|' + q['b']) or why(q)
        if y: q['y'] = y; n += 1
        else: q.pop('y', None)
    # 判斷不出原因的動詞變化題（可能有兩個說得通的答案）不出題：只從每天的題目清單拿掉，題目本身和題號不動
    hide = {i for i, q in enumerate(b['bank']) if q['k'] == 'verb' and not q.get('y')}
    b['days'] = [[i for i in d if i not in hide] for d in b['days']]
    json.dump(b, open(BANK, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(f'動詞變化說明：{n}/{tot} 題；沒有說明、不出題 {len(hide)} 題')


if __name__ == '__main__':
    main()
