# -*- coding: utf-8 -*-
"""翰林 iEnglish 三年級 L3–L4：手動整理的題目（習作、課本句型改寫、課文背誦句）。
每題：(單元, 題型代碼, 標籤, 題幹, [正確答案, 誘答1, 誘答2, 誘答3], 中文說明)
題幹裡的 ___ 是空格；整句選擇題（選出正確的句子）題幹不放 ___。
題型代碼：g＝文法、d＝對話／情境、s＝單字填空、t＝課文背誦句
"""

WORKBOOK = [
    # ---------- L3 習作 B：根據句意填入適當的單字 ----------
    (3, 's', '習作', 'Paul ___ the bag for me because it was too heavy.', ['carried', 'dropped', 'smoked', 'played'], '保羅幫我提袋子，因為它太重了。'),
    (3, 's', '習作', 'I ___ my ring on the floor, and it rolled under the bed.', ['dropped', 'carried', 'prayed', 'baked'], '我把戒指掉在地上，它滾到床底下了。'),
    (3, 's', '習作', 'Jerry took out some money from his ___ to pay for the meal.', ['pocket', 'bridge', 'smoke', 'tennis'], '傑瑞從口袋拿出一些錢來付餐費。'),
    (3, 's', '習作', 'Sara likes sports very much. She goes to ___ class at the sports center once a week.', ['tennis', 'pocket', 'bridge', 'smoke'], '莎拉很喜歡運動。她每週去運動中心上一次網球課。'),
    (3, 's', '習作', 'I saw black ___ coming out of the church. Is there a fire?', ['smoke', 'tennis', 'pocket', 'bridge'], '我看到黑煙從教堂冒出來。是失火了嗎？'),
    (3, 's', '習作', 'The children stopped in the middle of the ___ to look at the fish below.', ['bridge', 'pocket', 'smoke', 'tennis'], '孩子們停在橋中間看下面的魚。'),
    # ---------- L3 習作 C：圈出正確的答案（主動／被動） ----------
    (3, 'g', '習作・被動式', 'Nicole: How should I ___ this shirt?\nClerk: It has to be washed in warm water.', ['wash', 'be washed', 'washed', 'washing'], '妮可：這件襯衫我該怎麼洗？　店員：它必須用溫水洗。（我「洗」襯衫，主動）'),
    (3, 'g', '習作・被動式', 'Nicole: How should I wash this shirt?\nClerk: It has to ___ in warm water.', ['be washed', 'wash', 'washed', 'washing'], '襯衫「被洗」，has to 後面接 be + p.p.'),
    (3, 'g', '習作・被動式', 'Gary: The beef burger tastes delicious. Who ___ it?\nJenny: It was made by Josh.', ['made', 'was made', 'is made', 'was making'], '蓋瑞：牛肉漢堡很好吃。誰做的？（Who 是做的人，主動）'),
    (3, 'g', '習作・被動式', 'Gary: Who made the beef burger?\nJenny: It ___ by Josh.', ['was made', 'made', 'has made', 'is making'], '珍妮：它是喬許做的。（漢堡「被做」）'),
    (3, 'g', '習作・被動式', 'Theo: The wall ___ pink. It looks nice.\nFifi: I like it, too. My sister painted it.', ['has been painted', 'has painted', 'was painting', 'paints'], '這面牆已經被漆成粉紅色了。（現在完成式被動：has been + p.p.）'),
    (3, 'g', '習作・被動式', 'Theo: The wall has been painted pink. It looks nice.\nFifi: I like it, too. My sister ___ it.', ['painted', 'was painted', 'has been painted', 'is painted'], '我姊姊漆的。（姊姊是動作者，主動）'),
    # ---------- L3 習作 D：對話選擇 ----------
    (3, 'd', '習作', 'Erica: My brother had a car accident yesterday.\nNeil: I’m sorry to hear that. Is he all right?\nErica: Yes. ___', ['He was sent to the hospital in time.', 'He was hit by that red car.', 'He was killed in the accident.', 'He was in the car when it blew up.'], '他及時被送到醫院了。（回答「他還好嗎？」要選正面的）'),
    (3, 'd', '習作', 'Adam: The notice on the door says the restaurant is closed today.\nMom: All right. ___', ['Let’s go somewhere else for dinner.', 'I can sit by your side.', 'Please fill the pot with soup.', 'Could you pass me the glue over there?'], '餐廳今天沒開，我們去別的地方吃晚餐吧。'),
    # ---------- L3 習作 E：看圖填空（被動式） ----------
    (3, 'g', '習作・被動式', 'The pictures ___ by Mia and Rita.', ['were drawn', 'were drew', 'was drawn', 'drew'], '這些圖是米亞和瑞塔畫的。（pictures 複數 → were；draw 的 p.p. 是 drawn）'),
    (3, 'g', '習作・被動式', 'The note ___ on the wall.', ['was pasted', 'pasted', 'was pasting', 'were pasted'], '紙條被貼在牆上。'),
    (3, 'g', '習作・被動式', 'The cupcakes ___ by the woman.', ['were baked', 'baked', 'was baked', 'were baking'], '杯子蛋糕是那位女士烤的。'),
    # ---------- L3 習作 F：仿例句造句（主動改被動） ----------
    (3, 'g', '習作・主動改被動', 'The kids ate the ice cream.\n→ 改成被動語態：', ['The ice cream was eaten by the kids.', 'The ice cream was ate by the kids.', 'The ice cream eaten by the kids.', 'The ice cream were eaten by the kids.'], '過去式被動：was/were + p.p.（eat 的 p.p. 是 eaten）'),
    (3, 'g', '習作・主動改被動', 'The police have found the missing child.\n→ 改成被動語態：', ['The missing child has been found by the police.', 'The missing child has found by the police.', 'The missing child was been found by the police.', 'The missing child have been found by the police.'], '現在完成式被動：has/have been + p.p.；主詞 child 單數 → has'),
    (3, 'g', '習作・主動改被動', 'My friend will fix the pipe.\n→ 改成被動語態：', ['The pipe will be fixed by my friend.', 'The pipe will fixed by my friend.', 'The pipe will be fix by my friend.', 'The pipe is will be fixed by my friend.'], '未來式被動：will be + p.p.'),
    (3, 'g', '習作・主動改被動', 'People don’t use these tools today.\n→ 改成被動語態：', ['These tools aren’t used today.', 'These tools don’t used today.', 'These tools aren’t use today.', 'These tools isn’t used today.'], '現在式被動否定：aren’t + p.p.（泛指的 people 可以省略）'),
    # ---------- L3 習作 聽力：基本問答（改成閱讀版） ----------
    (3, 'd', '習作・問答', 'When was the pipe fixed?', ['Dad fixed it this morning.', 'It broke last night.', 'We fixed it without any tools.', 'It was fixed by a plumber next week.'], '水管什麼時候修好的？→ 爸爸今天早上修好的。'),
    (3, 'd', '習作・問答', 'Why is your brother crying?', ['He hurt his toe by kicking the door.', 'It has happened before.', 'I’m really worried about him.', 'He is crying in his room.'], '你弟弟為什麼在哭？→ 他踢門弄傷腳趾了。'),
    (3, 'd', '習作・問答', 'Mom pasted a note on the door before she left.', ['What was written on it?', 'How did it happen?', 'Does she need a bottle of glue?', 'Who was the door opened by?'], '媽媽出門前在門上貼了一張紙條。→ 上面寫了什麼？'),
    (3, 'd', '習作・問答', 'Can you tell me more about your days in the USA?', ['With pleasure.', 'What a great story!', 'I had a good time there.', 'It’s my pleasure to meet you.'], '你可以多說一些你在美國的日子嗎？→ 樂意之至。'),
    (3, 'd', '習作・問答', 'Yesterday my dog was found in the middle of the road, but luckily, he was fine.', ['I pray it won’t happen again.', 'It was sad that he got badly hurt.', 'I was afraid it might die during the attack.', 'He was found by the bridge last week.'], '我的狗昨天在馬路中間被找到，還好牠沒事。→ 我祈禱這不會再發生。'),
    # ---------- L3 習作 聽力：言談理解（改成閱讀版） ----------
    (3, 'd', '習作・對話', 'G: Nice weather today!\nB: Let’s play on the seesaw over there!\nG: But there are people playing on it. Let’s play on the swing or the slide first.\nB: OK.\nQ: Where are the boy and the girl?', ['At a playground.', 'At a senior center.', 'Inside a sports center.', 'At a hospital.'], 'seesaw、swing、slide 都在遊樂場。'),
    (3, 'd', '習作・對話', 'W: Oh my. What happened to your hand?\nM: I saw a puppy at the park. I just wanted to give it some food, and then a big dog suddenly ran out and jumped on me.\nW: And then you were bitten?\nM: Yes. It really hurt.\nQ: What do we know about the man?', ['He was attacked by a big dog.', 'He fed a big dog.', 'He was bitten by a puppy.', 'He bit a big dog.'], '咬他的是突然跑出來的大狗，不是小狗。'),
    (3, 'd', '習作・對話', 'M: Gina, you’ve already been in the kitchen for two hours. What are you busy with?\nW: I’m baking cookies. My best friend’s birthday is coming. I want to give her my cookies as her birthday gift.\nM: That’s sweet. Do you need any help?\nW: Yes. Can you bring a fan to me? The cookies are still hot.\nQ: What is the woman doing in the kitchen?', ['She is making cookies for her friend.', 'She is looking for a fan for the man.', 'She is helping the man bake cookies.', 'She is eating cookies with her friend.'], '吉娜在烤餅乾，要送給好朋友當生日禮物。'),
    (3, 'd', '習作・對話', 'W: Sir, you have been here for hours. Do you need any help?\nM: Oh… Thank you.\nW: Where do you live? I can ask the police to drive you home.\nM: Well, I can’t remember that.\nW: That’s OK. Do you carry any notes in your pocket?\nM: Oh, yes. Here.\nW: Great. It’s your wife’s phone number.\nQ: What will the woman do next?', ['Call the man’s wife.', 'Drive the man home.', 'Write a note to the man.', 'Take the man to the senior center.'], '紙條上是他太太的電話，所以她接下來會打電話。'),
    (3, 'd', '習作・對話', 'M: Let’s get some exercise on the weekend.\nW: Sure. We can go to the new swimming pool. It’s free!\nM: Well… I don’t really like swimming.\nW: How about badminton? We can play it at the park.\nM: Umm… But I’m not a big fan of badminton.\nW: Then, how about tennis?\nM: Tennis? I guess playing badminton may be a better idea.\nQ: What may the man and the woman do on the weekend?', ['Play badminton.', 'Play tennis.', 'Go swimming.', 'Go to the sports center.'], '最後男生說「打羽毛球可能是比較好的主意」。'),

    # ---------- L4 習作 B：文意字彙 ----------
    (4, 's', '習作', 'People can’t get into the building because the ___ isn’t open.', ['gate', 'heat', 'list', 'screen'], '人們進不了大樓，因為大門沒開。'),
    (4, 's', '習作', 'Without enough ___, the water in the pot won’t boil.', ['heat', 'gate', 'chalk', 'fat'], '沒有足夠的熱，鍋子裡的水不會沸騰。'),
    (4, 's', '習作', 'What did the teacher write on the ___? I can’t see clearly.', ['blackboard', 'couch', 'button', 'lamp'], '老師在黑板上寫了什麼？我看不清楚。'),
    (4, 's', '習作', 'When night falls, the moon ___ and lights up the dark sky.', ['rises', 'raises', 'collects', 'corrects'], '夜晚來臨時，月亮升起照亮黑暗的天空。（rise 不及物「升起」；raise 是「舉起某物」）'),
    (4, 's', '習作', 'Dora ___ her answer after the teacher told her it was wrong.', ['corrected', 'collected', 'boiled', 'pointed'], '老師說她答錯之後，朵拉訂正了答案。'),
    (4, 's', '習作', 'My brother loves to ___ stamps. He keeps lots of stamps in his drawer.', ['collect', 'correct', 'boil', 'heat'], '我弟弟喜歡收集郵票。'),
    # ---------- L4 習作 D：合併句子（whether/if） ----------
    (4, 'g', '習作・間接問句', 'Are you interested in the music contest? / Can you tell me? (if)\n→ 合併成一句：', ['Can you tell me if you are interested in the music contest?', 'Can you tell me if are you interested in the music contest?', 'Can you tell me if you are interested in the music contest.', 'Can you tell me if you interested in the music contest?'], '間接問句用「主詞＋動詞」的直述句順序；主要子句是問句，句尾用問號。'),
    (4, 'g', '習作・間接問句', 'Will he upload the photos for us? / I want to know. (whether)\n→ 合併成一句：', ['I want to know whether he will upload the photos for us.', 'I want to know whether will he upload the photos for us.', 'I want to know whether he upload the photos for us.', 'I want to know whether he will upload the photos for us?'], 'whether 後面用直述句順序；主要子句 I want to know 是直述句，句尾用句點。'),
    (4, 'g', '習作・間接問句', 'Did we download the file from the cloud? / Do you remember? (if)\n→ 合併成一句：', ['Do you remember if we downloaded the file from the cloud?', 'Do you remember if did we download the file from the cloud?', 'Do you remember if we download the file from the cloud?', 'Do you remember if we did downloaded the file from the cloud?'], '去掉 did，動詞改成過去式 downloaded。'),
    # ---------- L4 習作 E：根據對話完成句子 ----------
    (4, 'g', '習作・間接問句', 'Amy wants to know ___.', ['what happened to Cindy', 'what did happen to Cindy', 'what Cindy happened', 'what does happen to Cindy'], 'what 當主詞，後面直接接動詞 happened。'),
    (4, 'g', '習作・間接問句', 'Cindy has no idea ___.', ['how she can get good grades', 'how can she get good grades', 'how she get good grades', 'how does she can get good grades'], '間接問句：疑問詞＋主詞＋助動詞＋動詞。'),
    (4, 'g', '習作・間接問句', 'Cindy is not sure ___ Tim will help her or not.', ['whether', 'what', 'how', 'that'], '「是否…或不」用 whether … or not。'),
    # ---------- L4 習作 聽力：基本問答 ----------
    (4, 'd', '習作・問答', 'Can you tell me how to save a file?', ['It’s easy. Just push the Save button.', 'Sorry. I forgot to save it.', 'Yes. You can save it in a bank.', 'It was saved on the cloud.'], '你可以告訴我怎麼存檔嗎？→ 很簡單，按「儲存」鍵就好。'),
    (4, 'd', '習作・問答', 'I don’t know what I should get my mother for Mother’s Day.', ['How about a dozen roses?', 'It’s next week.', 'She always calls me honey.', 'I don’t know where she is.'], '我不知道母親節該送媽媽什麼。→ 送一打玫瑰花怎麼樣？'),
    (4, 'd', '習作・問答', 'Mike looks unhappy. What happened?', ['Well, I have no idea.', 'He seldom makes errors.', 'Sounds like he enjoyed the class a lot.', 'He is happy with his grades.'], '麥克看起來不開心，怎麼了？→ 嗯，我不知道。'),
    (4, 'd', '習作・問答', 'Could you please take a look at this science question?', ['Yes, but I’m not sure if I know the answer.', 'Sure. I know who to ask for help.', 'All right. Please tell me how to answer the question.', 'No, I took a look at the screen.'], '可以幫我看一下這題自然題嗎？→ 可以，但我不確定我會不會。'),
    (4, 'd', '習作・問答', 'Excuse me. I’d like to know if I can see Ms. Johnson now.', ['Sure. Please wait here for a minute.', 'That’s correct. She’s my boss.', 'Great. That’s a wise thing to do.', 'I don’t know if she saw you.'], '我想知道現在能不能見強森女士。→ 可以，請在這裡稍等一下。'),
    # ---------- L4 習作 聽力：言談理解 ----------
    (4, 'd', '習作・對話', 'G: It’s break time. Let’s play soccer at the playground.\nB: Wait a minute. I’m still working on the online quiz. I don’t know where to upload the file.\nG: That’s easy. Let me show you.\nQ: What happened to the boy?', ['He had trouble uploading the quiz file.', 'He failed the quiz.', 'He forgot to do the quiz.', 'He didn’t want to play soccer.'], '他不知道要把檔案上傳到哪裡。'),
    (4, 'd', '習作・對話', 'M: I can’t stand the heat anymore!\nW: Same here. I don’t know whether we should keep walking or go get a drink.\nM: Let’s go back down the mountain. I need a cold drink.\nQ: What does the man mean when he says “I can’t stand the heat anymore!”?', ['He feels hot.', 'He’s hungry.', 'His legs are sore.', 'He wants to keep walking.'], 'heat＝熱；他受不了這麼熱。'),
    (4, 'd', '習作・對話', 'M: It’s getting late. Where’s our son? Do you think he stayed after school for soccer practice?\nW: It’s possible. Or maybe he went to the library with his friends.\nM: Maybe we should give him a call to see where he is.\nQ: What is the man worried about?', ['Why his son hasn’t come back home.', 'Who his son is with now.', 'What time his son will get to school.', 'Whether his son likes soccer.'], '天色晚了兒子還沒回家。'),
    (4, 'd', '習作・對話', 'M: Excuse me. Is there a police station near here?\nW: Yes. Go straight for a block and turn left. Well, do you need any help, sir?\nM: I just lost my keys and cellphone. I need to go to the police station now.\nQ: What did the man want to know from the woman?', ['Whether there’s a police station nearby.', 'Whether she saw his keys and cellphone.', 'Whether she could call the police for him.', 'Where the bank is.'], '他問附近有沒有警察局。'),
    (4, 'd', '習作・對話', 'M: What happened, Jane? You look worried.\nW: I have a job interview tomorrow, and I feel so nervous. I don’t even know what to wear to the interview.\nM: OK. Just cool down. I can tell you what clothes you should wear and where you can get them.\nQ: How will the man help the woman?', ['Choose clothes for her.', 'Help her find a new job.', 'Give her some tips about the interview.', 'Go to the interview with her.'], '他說可以告訴她該穿什麼衣服、去哪裡買。'),
]

# 課本句型：主動改被動（講義練習，答案由講義提供；誘答依常見錯誤：少 be／be 動詞單複數錯／用原形或過去式）
# (主動句, 正確被動句, 誘答×3)
PASSIVE = [
    ('People around the world speak English.', 'English is spoken around the world.', ['English is speak around the world.', 'English are spoken around the world.', 'English spoken around the world.']),
    ('Jamie doesn’t make these combs.', 'These combs aren’t made by Jamie.', ['These combs don’t made by Jamie.', 'These combs isn’t made by Jamie.', 'These combs aren’t make by Jamie.']),
    ('Do many Americans celebrate Halloween?', 'Is Halloween celebrated by many Americans?', ['Does Halloween celebrated by many Americans?', 'Is Halloween celebrate by many Americans?', 'Halloween is celebrated by many Americans?']),
    ('Gina took the medicine three times a day.', 'The medicine was taken three times a day by Gina.', ['The medicine was took three times a day by Gina.', 'The medicine taken three times a day by Gina.', 'The medicine were taken three times a day by Gina.']),
    ('The police didn’t catch the thief last night.', 'The thief wasn’t caught by the police last night.', ['The thief didn’t caught by the police last night.', 'The thief wasn’t catch by the police last night.', 'The thief weren’t caught by the police last night.']),
    ('Did the spider bite the little boy?', 'Was the little boy bitten by the spider?', ['Did the little boy bitten by the spider?', 'Was the little boy bit by the spider?', 'Was the little boy biting by the spider?']),
    ('People must carry the box carefully.', 'The box must be carried carefully.', ['The box must carried carefully.', 'The box must be carry carefully.', 'The box must is carried carefully.']),
    ('Ron shouldn’t leave the garbage on the table.', 'The garbage shouldn’t be left on the table by Ron.', ['The garbage shouldn’t left on the table by Ron.', 'The garbage shouldn’t be leave on the table by Ron.', 'The garbage isn’t should be left on the table by Ron.']),
    ('Stan is going to write a new novel.', 'A new novel is going to be written by Stan.', ['A new novel is going to written by Stan.', 'A new novel is going to be wrote by Stan.', 'A new novel going to be written by Stan.']),
    ('The engineer has tested the program.', 'The program has been tested by the engineer.', ['The program has tested by the engineer.', 'The program has been test by the engineer.', 'The program have been tested by the engineer.']),
    ('Most of our students haven’t finished the reports yet.', 'The reports haven’t been finished by most of our students yet.', ['The reports haven’t finished by most of our students yet.', 'The reports hasn’t been finished by most of our students yet.', 'The reports haven’t been finish by most of our students yet.']),
    ('My sister is making a big pie in the kitchen.', 'A big pie is being made by my sister in the kitchen.', ['A big pie is making by my sister in the kitchen.', 'A big pie is been made by my sister in the kitchen.', 'A big pie are being made by my sister in the kitchen.']),
    ('Jack was flying a kite.', 'A kite was being flown by Jack.', ['A kite was flying by Jack.', 'A kite was being flew by Jack.', 'A kite were being flown by Jack.']),
    ('My brother broke the glasses.', 'The glasses were broken by my brother.', ['The glasses was broken by my brother.', 'The glasses were broke by my brother.', 'The glasses broken by my brother.']),
    ('Daddy bought the book.', 'The book was bought by Daddy.', ['The book was buy by Daddy.', 'The book bought by Daddy.', 'The book were bought by Daddy.']),
    ('Everyone should practice English every day.', 'English should be practiced every day.', ['English should practiced every day.', 'English should be practice every day.', 'English should is practiced every day.']),
    ('The big dog has scared me many times.', 'I have been scared by the big dog many times.', ['I has been scared by the big dog many times.', 'I have scared by the big dog many times.', 'Me have been scared by the big dog many times.']),
    ('A neighbor takes care of our dog when we go on a vacation.', 'Our dog is taken care of by a neighbor when we go on a vacation.', ['Our dog is taken care by a neighbor when we go on a vacation.', 'Our dog is took care of by a neighbor when we go on a vacation.', 'Our dog taken care of by a neighbor when we go on a vacation.']),
    ('Maggie gave me a postcard.', 'A postcard was given to me by Maggie.', ['A postcard was given me to by Maggie.', 'A postcard was gave to me by Maggie.', 'A postcard given to me by Maggie.']),
    ('Who broke the vase?', 'By whom was the vase broken?', ['By who was the vase broken?', 'By whom the vase was broken?', 'By whom was the vase broke?']),
]

# 課本句型：間接問句（講義練習，答案由講義提供）
# (提示, 正確, 誘答×3)
INDIRECT = [
    ('How old is Mrs. Collins? → Tell me ___', 'Tell me how old Mrs. Collins is.', ['Tell me how old is Mrs. Collins.', 'Tell me how old Mrs. Collins is?', 'Tell me how Mrs. Collins old is.']),
    ('Why are they not happy on weekends? → Do you know ___', 'Do you know why they are not happy on weekends?', ['Do you know why are they not happy on weekends?', 'Do you know why they are not happy on weekends.', 'Do you know why do they not happy on weekends?']),
    ('你知道現在幾點嗎？', 'Do you know what time it is?', ['Do you know what time is it?', 'Do you know what time it is.', 'Do you know what is the time it?']),
    ('Ronald 不確定他的錢包是在哪裡被偷的。', 'Ronald is not sure where his wallet was stolen.', ['Ronald is not sure where was his wallet stolen.', 'Ronald is not sure where his wallet stole.', 'Ronald is not sure where did his wallet stolen.']),
    ('What did they talk about to each other? → I couldn’t hear ___', 'I couldn’t hear what they talked about to each other.', ['I couldn’t hear what did they talk about to each other.', 'I couldn’t hear what they talk about to each other.', 'I couldn’t hear what they did talk about to each other.']),
    ('How long does he have to stay? → Do you have any idea ___', 'Do you have any idea how long he has to stay?', ['Do you have any idea how long does he have to stay?', 'Do you have any idea how long he have to stay?', 'Do you have any idea how long he does have to stay?']),
    ('我需要知道她為什麼常常晚回家。', 'I need to know why she often comes home late.', ['I need to know why does she often come home late.', 'I need to know why she often come home late.', 'I need to know why often she comes home late.']),
    ('有人知道我們接下來該怎麼做嗎？', 'Does anyone know what we should do next?', ['Does anyone know what should we do next?', 'Does anyone know what we should do next.', 'Does anyone know what we do should next?']),
    ('猜猜看我在這邊多久了。', 'Guess how long I have been here.', ['Guess how long have I been here.', 'Guess how long I have been here?', 'Guess how long I been have here.']),
    ('Who started the fight? → Be honest and tell me ___', 'Be honest and tell me who started the fight.', ['Be honest and tell me who did start the fight.', 'Be honest and tell me who the fight started.', 'Be honest and tell me who did the fight start.']),
    ('Ralph 有告訴你箱子裡是什麼嗎？', 'Did Ralph tell you what was in the box?', ['Did Ralph tell you what in the box was?', 'Did Ralph tell you what was in the box.', 'Did Ralph tell you what did in the box?']),
    ('He wants to know that. Which book should he take? →（用名詞片語）', 'He wants to know which book to take.', ['He wants to know which book to taking.', 'He wants to know which book should take.', 'He wants to know to take which book.']),
    ('Jeff couldn’t remember that. Who could he ask for help? →（用名詞片語）', 'Jeff couldn’t remember who to ask for help.', ['Jeff couldn’t remember who asking for help.', 'Jeff couldn’t remember who could ask for help.', 'Jeff couldn’t remember to ask who for help.']),
    ('Brian 的媽媽不曉得如何跟你道歉。', 'Brian’s mother doesn’t know how to say sorry to you.', ['Brian’s mother doesn’t know how say sorry to you.', 'Brian’s mother doesn’t know what to say sorry to you.', 'Brian’s mother doesn’t know how to saying sorry to you.']),
    ('Has the postman been here? → Ask him ___', 'Ask him whether the postman has been here or not.', ['Ask him whether has the postman been here or not.', 'Ask him whether the postman has been here or not?', 'Ask him what the postman has been here or not.']),
    ('我不在乎是否會下雨。', 'I don’t care whether it will rain or not.', ['I don’t care whether will it rain or not.', 'I don’t care whether it rains or not?', 'I don’t care that it will rain or not.']),
    ('Margaret 問她男朋友是否計畫要去游泳。', 'Margaret asked her boyfriend if he planned to swim.', ['Margaret asked her boyfriend if did he plan to swim.', 'Margaret asked her boyfriend if he plan to swim.', 'Margaret asked her boyfriend what he planned to swim.']),
    ('I’m not quite sure if you ___ yes tomorrow. (say)', 'will say', ['say', 'said', 'saying']),
    ('Will you leave me alone if I ___ yes? (say)', 'say', ['will say', 'said', 'saying']),
    ('Tell me ___ he will call you.（何時）／ Talk to him ___ he calls you tonight.（當…時）', 'when; when', ['when; will', 'if; when', 'whether; if']),
]

# 要背的課文句子（老師指定）：(單元, 中文, 英文)
PASSAGES = [
    (3, '炸彈爆炸了，煙霧瀰漫在空氣中。我受了重傷，無法行動。', 'The bomb blew up, and the smoke filled the air. I was badly hurt and couldn’t move.'),
    (3, '我猜他是忘了到樂齡中心的路而感到害怕。我祈禱它不會再發生了。', 'I guess he forgot the way to the senior center and got scared. I pray it won’t happen again.'),
    (3, '他應該在口袋攜帶一張有中心地址的紙條。那樣一來，人們就可以幫他找到回家的路。', 'He should carry a note with the center’s address in his pocket. That way, people can help him find his way home.'),
    (3, '有些動物被訓練來尋找失蹤的人。另一些則參加醫院的計劃，探望病人並使他們振作起來。', 'Some animals are trained to look for missing people. Others join hospital programs to visit the sick and cheer them up.'),
    (3, '因為牠們，我們知道英雄可以是形形色色的。', 'Because of them, we know that heroes can come in different shapes and sizes.'),
    (4, '我不確定它有沒有聽見。沒有任何動靜。我不知道接下來該怎麼做。', 'I’m not sure if it heard me. Nothing’s happening. I don’t know what to do next.'),
    (4, 'A：你知道為什麼螢幕顯示「錯誤」嗎？　B：那是因為我想不起來把密碼存到哪裡去了。', 'A: Do you know why the screen is showing “ERROR”?\nB: That’s because I can’t remember where I saved my code.'),
    (4, 'AI 正在掀起浪潮。隨著 AI 的興起，每隔幾天就會出現新的 AI 工具。', 'AI is making waves. With the rise of AI, new AI tools appear every few days.'),
    (4, 'AI 甚至可以看圖片中的食物，並提供像是脂肪含量或加熱方式的資訊。', 'AI can even look at food in pictures and provide information like how much fat it has or how to heat it up.'),
    (4, 'AI 可以糾正學生們的錯誤，甚至向他們展示如何解數學題。這幫助他們確認自己是否了解課程內容。', 'AI can correct students’ mistakes and even show them how to work out a math problem. This helps them check whether they understand the lesson or not.'),
]

# 課文背誦句：挖空（第幾句, 要挖空的原文, 誘答×3）。同一句挖不同地方，背得越熟越不會被誘答騙
BLANKS = [
    (0, 'blew up', ['blow up', 'was blown up', 'blew out']),
    (0, 'filled', ['full', 'was filled', 'fills']),
    (0, 'badly hurt', ['bad hurt', 'badly hurting', 'hurt bad']),
    (0, 'couldn’t move', ['can’t moved', 'couldn’t moving', 'didn’t moved']),
    (1, 'forgot the way to', ['forgot the way of', 'forgot to the way', 'forget the way to']),
    (1, 'got scared', ['got scary', 'get scared', 'was scaring']),
    (1, 'I pray it won’t happen again', ['I pray it doesn’t happened again', 'I pray it won’t happens again', 'I prayed it won’t happen again']),
    (2, 'carry a note', ['carry a notice', 'carries a note', 'carry note']),
    (2, 'the center’s address', ['the address center’s', 'the centers address', 'the center address’s']),
    (2, 'That way', ['On the way', 'That’s why', 'By the way']),
    (2, 'find his way home', ['find his way to home', 'find the home way', 'find his home way']),
    (3, 'are trained to look for', ['are training to look for', 'trained to look for', 'are trained looking for']),
    (3, 'missing', ['missed', 'miss', 'missing for']),
    (3, 'Others', ['Other', 'The other', 'Another']),
    (3, 'the sick', ['the sicks', 'sick', 'the sickness']),
    (3, 'cheer them up', ['cheer up them', 'cheers them up', 'cheer they up']),
    (4, 'Because of', ['Because', 'Thanks', 'Because for']),
    (4, 'come in different shapes and sizes', ['come with different shapes and sizes', 'come in different shape and size', 'came in different shapes and sizes']),
    (5, 'if it heard me', ['if did it hear me', 'if it hear me', 'if heard it me']),
    (5, 'Nothing’s happening', ['Nothing happening', 'Anything’s happening', 'Nothing’s happen']),
    (5, 'what to do next', ['what to doing next', 'what do next', 'how to do next']),
    (6, 'why the screen is showing', ['why is the screen showing', 'why the screen showing', 'why does the screen show']),
    (6, 'That’s because', ['That’s why', 'Because of', 'That’s for']),
    (6, 'where I saved my code', ['where did I save my code', 'where I save my code', 'where saved I my code']),
    (7, 'making waves', ['making wave', 'make waves', 'making the waves']),
    (7, 'With the rise of', ['With the raise of', 'With the rise to', 'By the rise of']),
    (7, 'appear every few days', ['appears every few days', 'appear every few day', 'appear few every days']),
    (8, 'look at food in pictures', ['look food in pictures', 'look at food on pictures', 'looking at food in pictures']),
    (8, 'how much fat it has', ['how much fat does it have', 'how many fat it has', 'how much fat has it']),
    (8, 'how to heat it up', ['how heat it up', 'how to heat up it', 'how to heating it up']),
    (9, 'correct students’ mistakes', ['correct student’s mistakes', 'correct students mistakes', 'correcting students’ mistakes']),
    (9, 'how to work out a math problem', ['how to work a math problem out of', 'how work out a math problem', 'how to working out a math problem']),
    (9, 'whether they understand the lesson or not', ['whether do they understand the lesson or not', 'whether they understanding the lesson or not', 'what they understand the lesson or not']),
]

# 課文背誦句：看中文選出正確的英文（誘答是改錯一個文法點的句子）
WHOLE = [
    (0, ['The bomb blew up, and the smoke filled the air.', 'The bomb was blown up, and the smoke full the air.', 'The bomb blow up, and the smoke filled the air.', 'The bomb blew up, and the smoke was filling with the air.'], '炸彈爆炸了，煙霧瀰漫在空氣中。'),
    (1, ['I guess he forgot the way to the senior center and got scared.', 'I guess he forgot the way to the senior center and got scary.', 'I guess he forgot to the way the senior center and got scared.', 'I guess he forget the way to the senior center and get scared.'], '我猜他是忘了到樂齡中心的路而感到害怕。'),
    (2, ['He should carry a note with the center’s address in his pocket.', 'He should carries a note with the center’s address in his pocket.', 'He should carry a note with the address’s center in his pocket.', 'He should carry a note in the center’s address with his pocket.'], '他應該在口袋攜帶一張有中心地址的紙條。'),
    (3, ['Some animals are trained to look for missing people.', 'Some animals trained to look for missing people.', 'Some animals are training to look for missing people.', 'Some animals are trained to look for missed people.'], '有些動物被訓練來尋找失蹤的人。'),
    (3, ['Others join hospital programs to visit the sick and cheer them up.', 'Others join hospital programs to visit the sick and cheer up them.', 'Other join hospital programs to visit the sick and cheer them up.', 'Others join hospital programs to visit sick and cheer them up.'], '另一些則參加醫院的計劃，探望病人並使他們振作起來。'),
    (4, ['Because of them, we know that heroes can come in different shapes and sizes.', 'Because them, we know that heroes can come in different shapes and sizes.', 'Because of them, we know that heroes can comes in different shapes and sizes.', 'Because of them, we know that heroes can come in different shape and size.'], '因為牠們，我們知道英雄可以是形形色色的。'),
    (5, ['I’m not sure if it heard me. I don’t know what to do next.', 'I’m not sure if did it hear me. I don’t know what to do next.', 'I’m not sure if it heard me. I don’t know what do next.', 'I’m not sure if it heard me. I don’t know what should do next.'], '我不確定它有沒有聽見。我不知道接下來該怎麼做。'),
    (6, ['Do you know why the screen is showing “ERROR”?', 'Do you know why is the screen showing “ERROR”?', 'Do you know why the screen is showing “ERROR”.', 'Do you know why does the screen showing “ERROR”?'], '你知道為什麼螢幕顯示「錯誤」嗎？'),
    (6, ['That’s because I can’t remember where I saved my code.', 'That’s because I can’t remember where did I save my code.', 'That’s why I can’t remember where I saved my code.', 'That’s because I can’t remember where saved I my code.'], '那是因為我想不起來把密碼存到哪裡去了。'),
    (7, ['With the rise of AI, new AI tools appear every few days.', 'With the raise of AI, new AI tools appear every few days.', 'With the rise of AI, new AI tools appears every few days.', 'With the rise of AI, new AI tools appear every few day.'], '隨著 AI 的興起，每隔幾天就會出現新的 AI 工具。'),
    (8, ['AI can even look at food in pictures and provide information like how much fat it has or how to heat it up.', 'AI can even look at food in pictures and provide information like how much fat does it have or how to heat it up.', 'AI can even look food in pictures and provide information like how much fat it has or how to heat it up.', 'AI can even look at food in pictures and provide information like how much fat it has or how to heat up it.'], 'AI 甚至可以看圖片中的食物，並提供像是脂肪含量或加熱方式的資訊。'),
    (9, ['AI can correct students’ mistakes and even show them how to work out a math problem.', 'AI can corrects students’ mistakes and even show them how to work out a math problem.', 'AI can correct students’ mistakes and even show them how work out a math problem.', 'AI can correct students’ mistakes and even show they how to work out a math problem.'], 'AI 可以糾正學生們的錯誤，甚至向他們展示如何解數學題。'),
    (9, ['This helps them check whether they understand the lesson or not.', 'This helps them check whether do they understand the lesson or not.', 'This help them check whether they understand the lesson or not.', 'This helps them check whether they understand the lesson or no.'], '這幫助他們確認自己是否了解課程內容。'),
]
