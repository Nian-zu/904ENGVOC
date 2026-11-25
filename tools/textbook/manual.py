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

# 課文背誦句：活用（換一個新情境，但用的還是背誦句裡的動詞／搭配詞，再加上時態、單複數、被動、受詞位置的變化）
# (第幾句, 題幹, [正確, 誘答×3], 說明)
TENSE = [
    # 1. The bomb blew up, and the smoke filled the air. I was badly hurt and couldn’t move.
    (0, 'The workers will ___ the old building next Monday.', ['blow up', 'blew up', 'blowing up', 'be blown up'], 'blow up 也能當「炸毀（某物）」；will 後面接原形 → blow up'),
    (0, 'The old bridge ___ by the soldiers during the war.', ['was blown up', 'blew up', 'has blown up', 'is blowing up'], '橋「被」炸毀、during the war 是過去 → was blown up（blow 的 p.p. 是 blown）'),
    (0, 'The smell of fresh bread ___ the kitchen every morning.', ['fills', 'filled', 'is filled', 'filling'], 'fill the air →「充滿廚房」；every morning 用現在簡單式，主詞 the smell 單數 → fills'),
    (0, 'Tom fell off his bike yesterday and ___.', ['was badly hurt', 'badly hurt', 'was bad hurt', 'is badly hurt'], 'be badly hurt（受重傷）：be ＋ badly（副詞）＋ hurt；yesterday 過去 → was'),
    (0, 'My legs were so tired after the race that I ___.', ['couldn’t move', 'can’t moved', 'couldn’t moving', 'wasn’t move'], 'couldn’t ＋原形 move（were 是過去 → couldn’t）'),
    # 2. I guess he forgot the way to the senior center and got scared. I pray it won’t happen again.
    (1, 'If you ___ the way to the library tomorrow, just call me.', ['forget', 'will forget', 'forgot', 'forgets'], 'if 當「如果」時，未來的事用現在式代替未來式 → forget'),
    (1, 'The little girl ___ when the lights suddenly went out.', ['got scared', 'got scary', 'gets scared', 'was scaring'], 'get scared（感到害怕，人的感受用 -ed）；went out 是過去 → got scared'),
    (1, 'Grandma ___ for our family at the temple every Sunday.', ['prays', 'prayed', 'is prayed', 'pray'], 'every Sunday 用現在簡單式，Grandma 單數 → prays'),
    (1, 'Sorry I was late again. I promise it ___ again.', ['won’t happen', 'didn’t happen', 'isn’t happened', 'hasn’t happen'], '保證以後不會 → won’t happen（happen 不能用被動）'),
    # 3. He should carry a note with the center’s address in his pocket. That way, people can help him find his way home.
    (2, 'On hot days, you should ___ a bottle of water with you.', ['carry', 'carries', 'carrying', 'to carry'], 'should ＋原形 → carry'),
    (2, 'Write the new words on small cards. ___, you can study them on the bus.', ['That way', 'That’s why', 'By the way', 'On the way'], 'That way（那樣一來）：說明做了前面的事會有什麼好處'),
    (2, 'The map on my phone ___ us find our way to the hotel last night.', ['helped', 'helps', 'was helped', 'help'], 'help ＋人＋原形動詞；last night 過去 → helped'),
    (2, 'Three days later, the lost puppy finally ___ home.', ['found its way', 'found it’s way', 'finds its way', 'found its way to'], 'find one’s way home（找到回家的路）；home 前面不加 to；its 是「牠的」，it’s 是 it is'),
    # 4. Some animals are trained to look for missing people. Others join hospital programs to visit the sick and cheer them up.
    (3, 'These dogs ___ to help blind people cross the street.', ['are trained', 'are training', 'trained', 'train'], '狗「被」訓練來…→ be trained to V（現在式被動）'),
    (3, 'My brother is ___ his phone. It’s missing again!', ['looking for', 'looking', 'look for', 'looked for'], 'look for（尋找）；is ＋ V-ing → looking for'),
    (3, 'Some of my classmates like math. ___ like English.', ['Others', 'Other', 'Another', 'The other'], 'Some…, others…（有些…，另一些…）；others 當代名詞要加 s'),
    (3, 'Lisa looked sad, so we told her some jokes to ___.', ['cheer her up', 'cheer up her', 'cheer she up', 'cheers her up'], 'cheer…up：代名詞要放中間 → cheer her up'),
    (3, 'The police are still looking for the ___ girl.', ['missing', 'missed', 'miss', 'missingly'], 'missing（失蹤的）是形容詞，放在名詞前面'),
    # 5. Because of them, we know that heroes can come in different shapes and sizes.
    (4, '___ the heavy rain, the baseball game was put off.', ['Because of', 'Because', 'Thanks', 'Because for'], 'Because of ＋名詞；Because ＋句子'),
    (4, 'The cookies in this shop ___ different shapes and sizes.', ['come in', 'come with', 'comes in', 'coming in'], 'come in different shapes and sizes（有各種形狀大小）；cookies 複數 → come in'),
    (4, '___ she was sick, she didn’t go to school today.', ['Because', 'Because of', 'Thanks to', 'With'], '後面是句子（she was sick）→ Because；Because of 後面接名詞'),
    # 6. I’m not sure if it heard me. Nothing’s happening. I don’t know what to do next.
    (5, 'I’m not sure ___ the museum is open on Mondays.', ['if', 'what', 'which', 'how'], 'not sure if（不確定是否）'),
    (5, 'Ben isn’t sure if he ___ the math test next week.', ['will pass', 'passes', 'passed', 'has passed'], 'if 當「是否」、事情在未來 → 用未來式 will pass'),
    (5, 'After the teacher left, the students didn’t know ___.', ['what to do next', 'what to do it next', 'what do next', 'what doing next'], 'wh- ＋ to V：what to do next（接下來該做什麼）'),
    (5, 'Something strange ___ right now. The screen keeps changing colors!', ['is happening', 'happens', 'is happened', 'has happen'], 'right now → 現在進行式；happen 不用被動'),
    # 7. A: Do you know why the screen is showing “ERROR”? B: That’s because I can’t remember where I saved my code.
    (6, 'Do you know why the baby ___ now? Is she hungry?', ['is crying', 'is she crying', 'does she cry', 'cry'], '間接問句用直述句順序：why ＋主詞＋動詞（the baby is crying）'),
    (6, 'A: Why is Amy so happy today?\nB: ___ she got first place in the singing contest.', ['That’s because', 'That’s why', 'Because of', 'That’s for'], '回答原因用 That’s because ＋句子；That’s why 是「所以…」'),
    (6, 'I can’t remember where I ___ my umbrella this morning.', ['put', 'putted', 'will put', 'am putting'], 'this morning 已經過去 → put（put 三態同形）'),
    (6, 'Can you tell me where you ___ the photos yesterday?', ['saved', 'did save', 'save', 'were saved'], '間接問句不用 did 倒裝；yesterday → saved'),
    # 8. AI is making waves. With the rise of AI, new AI tools appear every few days.
    (7, 'The new singer ___ waves in Taiwan these days.', ['is making', 'is made', 'makes it', 'making'], 'make waves（掀起浪潮、引起轟動）；these days 用進行式 → is making'),
    (7, '___ online shopping, many small stores have closed.', ['With the rise of', 'With the raise of', 'By the rise of', 'With the rise to'], 'with the rise of ＋名詞（隨著…的興起）；rise 是名詞，raise 是「舉起」'),
    (7, 'A rainbow ___ in the sky after the rain yesterday.', ['appeared', 'was appeared', 'appears', 'has appeared'], 'appear（出現）是不及物動詞，不能用被動；yesterday → appeared'),
    (7, 'Since last month, new videos ___ on his channel every few days.', ['have appeared', 'appear', 'are appeared', 'appearing'], 'Since ＋過去時間 → 現在完成式；appear 不用被動'),
    # 9. AI can even look at food in pictures and provide information like how much fat it has or how to heat it up.
    (8, 'This website ___ information about the weather every hour.', ['provides', 'provide', 'is provided', 'providing'], 'provide information（提供資訊）；every hour 現在簡單式，主詞單數 → provides'),
    (8, 'Do you know how much sugar this drink ___?', ['has', 'have', 'does it have', 'is having'], '間接問句：how much ＋名詞＋主詞＋動詞（this drink has）'),
    (8, 'The soup is cold. Can you show me how to ___?', ['heat it up', 'heat up it', 'heating it up', 'heats it up'], 'heat…up：代名詞放中間 → heat it up；how to ＋原形'),
    (8, 'Don’t ___ the sun directly. It’s bad for your eyes.', ['look at', 'look', 'looking at', 'looks at'], 'look at ＋東西（看著…）；Don’t ＋原形'),
    # 10. AI can correct students’ mistakes and even show them how to work out a math problem. This helps them check whether they understand the lesson or not.
    (9, 'Our English teacher ___ our mistakes every day.', ['corrects', 'correct', 'is corrected', 'correcting'], 'correct mistakes（訂正錯誤）；every day，主詞單數 → corrects'),
    (9, 'My dad showed me how ___ the math problem.', ['to work out', 'work out', 'working out', 'to working out'], 'show ＋人＋ how to V；work out（解出）'),
    (9, 'All the answers ___ by the teacher yesterday.', ['were corrected', 'corrected', 'are corrected', 'have corrected'], '答案「被」訂正、yesterday → were corrected'),
    (9, 'This app helps me ___ whether my answers are right or not.', ['check', 'checks', 'checking', 'to checking'], 'help ＋人＋原形（或 to V）→ check'),
]

# ===== 課文（教案提供的課本對話、閱讀、補充閱讀與聽力練習）=====
TEXTS = {
    'L3D1': '(Zac and Jamie are volunteering at a senior center.)\nJamie: Hi, Mr. Barr. Zac and I had a good time listening to your war stories last week. Could you tell us more?\nMr. Barr: With pleasure. See my right leg? It was hurt during an attack one night. I also lost three toes on my left foot that night.\nZac: How did you get hurt?\nMr. Barr: I was crossing a bridge when a plane dropped a bomb nearby. It blew up, and the smoke filled the air. I was badly hurt and couldn’t move.\nJamie: Oh no! Who saved you?\nMr. Barr: A puppy. It saw me lying on the ground and began to bark. The sound led other soldiers to me.\nZac: You were saved by a dog!\nMr. Barr: The story was even reported in a newspaper.\nJamie: What a great story!',
    'L3D2': '(The next day, Zac and Jamie can’t find Mr. Barr at the center.)\nJamie: Excuse me, Ms. Lee. Where’s Mr. Barr?\nMs. Lee: He’s in the hospital. He was hit by a car yesterday.\nJamie: How did it happen?\nMs. Lee: Mr. Barr suddenly walked into traffic and stood in the middle of the road. The driver couldn’t stop the car in time.\nZac: Why did he do that?\nMs. Lee: I guess he forgot the way to our center and got scared. He has problems remembering things, so he gets lost often.\nZac: I’m worried about him. Maybe he should carry a note with the center’s address in his wallet or pocket.\nMs. Lee: Good idea. That way, people can help him find his way home.\nJamie: I pray it won’t happen again.',
    'L3R': 'Animal Heroes\nWhen people think of heroes, they probably don’t think of animals. However, some animals do a lot for people. They are heroes, too.\nHistory is full of animal heroes. Cher Ami, a bird, is one example. During a war, the soldiers were in trouble and sent a note for help. Cher Ami flew across a dangerous area to deliver it and successfully saved the soldiers. Another hero was a dog, Stubby. He noticed gas attacks during a war and barked to warn the soldiers. Thanks to him, they had time to put on their masks and stay safe.\nModern animal heroes help people in many ways. Some are trained to catch bad guys or look for missing people. Others join hospital programs to visit the sick and cheer them up. Even pets at home can help their owners by staying by their side and making them smile during difficult times.\nAnimal heroes save lives, help people in need, and bring joy to people. Because of them, we know that heroes can come in different shapes and sizes, and they can even be found somewhere nearby.',
    'L3E': 'Elephants Without Long Tusks\nIvory poaching is causing a serious problem in Africa. Because many elephants are killed for their long tusks, their genes can’t be passed down. Elephants with short or no tusks, on the other hand, have a better chance of living, so they are able to pass down their genes. Now, more and more elephants in Africa are born with short or no tusks.\nElephants without long tusks are lucky that they are not killed, but life isn’t easy for them. Tusks are important to elephants because they are useful tools for getting food and water, moving heavy things, and protecting themselves. Elephants with short or no tusks have trouble doing these things. For the future of elephants, people need to stop poaching.\n(tusk 獠牙；ivory poaching 象牙盜獵；gene 基因)',
    'L4D1': '(At the school gate)\nMrs. Wei: You’re late, honey. Don’t you know what time it is?\nCody: Sorry, Mom. We made videos in class today. Ela couldn’t remember where she saved her file, so I stayed to help her.\nMrs. Wei: I see. Next time call to tell me you’ll be late.\nCody: Okay, Mom.\nMrs. Wei: How was school today?\nCody: We had a lot of fun in art class. We visited many museums through VR. Van Gogh even gave us a quiz!\nMrs. Wei: How interesting! When I was in school, we only had a blackboard and chalk. You guys are so lucky.\nCody: I think so, too.',
    'L4D2': '(At the door of their house)\nMrs. Wei: Cody, do you know why the screen is showing “ERROR”? I’m sure I pushed the right buttons, 5-2-5-7.\nCody: That’s because you’re still using the old code. Today is the first day of November, so you should enter the new code, 6757.\nMrs. Wei: Oh yeah, I remember now.\n(Inside the house)\nMrs. Wei: I know what to do next. OK Google, turn on the lights in the living room.\n(Mrs. Wei waits for the lights to turn on.)\nMrs. Wei: I’m not sure if it heard me. Nothing’s happening.\nCody: We changed the wake word last night, Mom. It’s not Google anymore.\nMrs. Wei: Oh, right, but I forgot what it is.\nCody: No worries. OK Noodle, turn on the lights and play a song for Mom.\nMrs. Wei: It’s the song “You’re the One”! How did Noodle know whether I’d like it or not?\nCody: It has a list of your favorite songs, so it knows what to play.\nMrs. Wei: I love our smart house!',
    'L4R': 'Now AI Can See\nAI is making waves. With the rise of AI, new AI tools appear every few days. These tools are so useful that people use them in many parts of their lives.\nOne of AI’s latest abilities is to collect information from pictures and tell what is in them. This can be used in many ways. For example, by looking at a picture of a room, AI can help plan where to place a lamp or a couch. What’s more, AI can even look at food in pictures and provide information like how much fat it has or how to heat it up.\nWhen traveling abroad, people can point their cellphone cameras at signs or menus, and AI can translate the words. In education, students can take a picture of their homework. Then AI can correct their mistakes and even show them how to work out a math problem. This helps them check whether they understand the lesson or not.\nAI is becoming a helpful friend in people’s lives. Because of it, life is getting easier and more convenient. Over time, AI will get smarter, and people can expect it to help in many new ways.',
    'L4E': 'Murphy’s Law\nPicture this: it’s breakfast time. You are going to take a bite of a nice, warm piece of toast. Then you drop it and it falls. You pray for it to land on the side without butter. But no—it lands butter-side down! This is a perfect example of Murphy’s Law.\nHave you noticed that it always rains when you least expect it? Or when you stand in line at the checkout, why does the line next to you always seem to move faster? And why does your teacher always call on you when you don’t know the answer? If it is possible for something to go wrong, it will go wrong—this is Murphy’s Law.\nThe lesson behind Murphy’s Law is to be prepared for the worst. So, if you aren’t ready for tomorrow’s test, don’t even think about cheating. The teacher might look your way right when you’re doing something wrong. The smarter choice is to study hard!',
}
TEXT_NAME = {'L3D1': 'L3 對話一', 'L3D2': 'L3 對話二', 'L3R': 'L3 閱讀', 'L3E': 'L3 補充閱讀', 'L4D1': 'L4 對話一', 'L4D2': 'L4 對話二、三', 'L4R': 'L4 閱讀', 'L4E': 'L4 補充閱讀'}

# 課文理解：(課文代號 或 None＝題幹自己帶內容, 題目, [正確, 誘答×3], 說明)。課本／教案有答案的照用，三選一的補一個誘答
READING = [
    ('L3D1', 'Where are Zac and Jamie?', ['At a senior center.', 'At a hospital.', 'On a bridge.', 'At a children’s home.'], '第一行：Zac and Jamie are volunteering at a senior center.'),
    ('L3D1', 'How did Mr. Barr get hurt?', ['A bomb blew up near him while he was crossing a bridge.', 'He was hit by a car on a bridge.', 'He fell off a bridge during the war.', 'A dog attacked him one night.'], 'I was crossing a bridge when a plane dropped a bomb nearby. It blew up…'),
    ('L3D1', 'How did the puppy save Mr. Barr?', ['It barked, and the sound led other soldiers to him.', 'It pulled him off the bridge.', 'It carried a note to the soldiers.', 'It drove him to the hospital.'], 'It… began to bark. The sound led other soldiers to me.'),
    ('L3D1', 'What do we know about Mr. Barr?', ['He lost three toes on his left foot.', 'His left leg was badly hurt.', 'He wrote a story for a newspaper.', 'He was flying a plane during the war.'], '受傷的是右腿（right leg），失去的是左腳三根腳趾；故事是「被」報紙報導。'),
    ('L3D1', 'Jamie says “What a great story!” She feels the story is ___.', ['amazing', 'boring', 'scary', 'sad'], 'What a great story! 是讚美、驚訝的感嘆句。'),
    ('L3D2', 'Why can’t Zac and Jamie find Mr. Barr at the center?', ['He is in the hospital.', 'He went back home.', 'He is lost again.', 'He is at the police station.'], 'He’s in the hospital. He was hit by a car yesterday.'),
    ('L3D2', 'Why did Mr. Barr stand in the middle of the road?', ['He forgot the way to the center and got scared.', 'He wanted to stop a car for help.', 'He was looking for his wallet.', 'He was waiting for Zac and Jamie.'], 'I guess he forgot the way to our center and got scared.'),
    ('L3D2', 'What does “He has problems remembering things” mean?', ['He often forgets things.', 'He has many problems at home.', 'He likes to talk about the past.', 'He can’t remember the war at all.'], 'have problems V-ing＝做某事有困難 → 記事情有困難，常忘東忘西。'),
    ('L3D2', 'What is Zac’s idea?', ['Mr. Barr should carry a note with the center’s address.', 'Mr. Barr should stay in the hospital.', 'Ms. Lee should drive Mr. Barr home every day.', 'Mr. Barr should buy a new wallet.'], 'Maybe he should carry a note with the center’s address in his wallet or pocket.'),
    ('L3D2', 'Why does Jamie say “I pray it won’t happen again”?', ['She doesn’t want Mr. Barr to get lost or hurt again.', 'She wants to visit the hospital again.', 'She is afraid of cars.', 'She doesn’t like the senior center.'], '教案參考答案：She doesn’t want Mr. Barr to get lost or hurt again.'),
    ('L3R', 'What is the reading mainly about?', ['Animals that help people.', 'Ways to train animals.', 'The history of wars.', 'Pets that need our help.'], '標題 Animal Heroes，每段都在講動物怎麼幫助人。'),
    ('L3R', 'What did Cher Ami do during a war?', ['It flew across a dangerous area to deliver a note.', 'It barked to warn the soldiers.', 'It found missing people.', 'It visited sick soldiers in the hospital.'], 'Cher Ami flew across a dangerous area to deliver it (the note).'),
    ('L3R', 'How did Stubby help the soldiers?', ['He noticed gas attacks and barked to warn them.', 'He brought masks to them.', 'He flew across a dangerous area.', 'He caught bad guys for them.'], 'He noticed gas attacks during a war and barked to warn the soldiers.'),
    ('L3R', 'In “Thanks to him, they had time to put on their masks,” who does “him” mean?', ['Stubby.', 'Cher Ami.', 'A soldier.', 'The writer.'], '前一句講的是狗 Stubby；動物有名字時常用 he/she。'),
    ('L3R', 'Which is NOT something modern animal heroes do, according to the reading?', ['Deliver notes across dangerous areas.', 'Catch bad guys.', 'Look for missing people.', 'Visit the sick and cheer them up.'], '送紙條的 Cher Ami 是「歷史上」的例子，不是現代的。'),
    ('L3R', 'What can we learn from the reading?', ['Animals can do things to help people.', 'There is no war in modern times.', 'Animals can be used to attack in wars.', 'Only dogs can be heroes.'], '課本 Reading Comprehension 第 1 題（答案 B）。'),
    ('L3R', 'According to the reading, which is an example of an animal hero?', ['Lucky. He is a rescue dog. He helps find survivors after earthquakes.', 'Jane. She is an animal doctor and has saved many animals’ lives.', 'Babe. He is a special bird because he flies across countries at different times of the year.', 'Kitty. She likes to sleep on the couch all day.'], '課本 Reading Comprehension 第 2 題：Jane 是人；Babe 只是候鳥，沒有幫助人。'),
    ('L3R', 'What does “heroes can come in different shapes and sizes” mean?', ['Heroes can look very different.', 'Heroes must be big and strong.', 'Heroes are always animals.', 'Heroes come to help in different places.'], 'come in different shapes and sizes＝有各種形狀大小，形形色色。'),
    ('L3E', 'Why do elephants with short or no tusks have a better chance of living?', ['They don’t have long tusks, so people have no reason to kill them.', 'They are able to protect themselves from people.', 'Their genes make them healthier than elephants with long tusks.', 'They can get more food and water than elephants with long tusks.'], '課本補充閱讀第 1 題（答案 C）：大象被殺是因為長獠牙。'),
    ('L3E', 'What CAN’T we learn from the reading?', ['Many people are taking action to protect elephants from being killed.', 'Tusks are important to elephants for getting food and water.', 'Ivory poaching causes the deaths of many elephants in Africa.', 'More and more baby elephants in Africa are born without tusks.'], '課本補充閱讀第 2 題（答案 D）：文章只呼籲停止盜獵，沒提到實際行動。'),
    (None, 'A: Can you take care of my puppy this weekend?\nB: ___', ['With pleasure.', 'Let me pray for you.', 'I’ll write it down on my note.', 'It was saved by a puppy.'], '課本聽力練習：答應請求 → With pleasure.（樂意之至）'),
    (None, 'A: I heard that Mr. Wu was attacked last night. What happened?\nB: ___', ['A man hit him with a bottle.', 'His fan broke into pieces.', 'He pushed an old woman.', 'He was in the middle of a meeting.'], '課本聽力練習：問「發生了什麼事」→ 說明被攻擊的經過。'),
    (None, 'W: What’s that smell?\nM: I’m making banana bread. I think I burned it.\nW: Oh my! There’s flour on the floor, and the table is full of trash.\nM: Sorry. I’ll clean up the place later.\nQ: What might the man be doing?', ['Baking.', 'Gardening.', 'Cleaning up.', 'Swimming.'], 'I’m making banana bread. → 在烘焙（clean up 是等一下才要做）'),
    (None, 'W: Oh no! I can’t believe the wallet is sold out.\nM: What wallet?\nW: The brown wallet. Dad has always wanted that kind of wallet. I planned to buy it for his birthday, but the clerk just told me it’s sold out. My plan just went up in smoke.\nM: Don’t give up yet. Let’s check other stores.\nQ: What does the woman mean when she says “my plan just went up in smoke”?', ['Her plan failed.', 'She doesn’t like the wallet.', 'There was smoke in the store.', 'She already bought the wallet.'], 'go up in smoke＝（計畫）泡湯；錢包賣完了，計畫失敗。'),
    ('L4D1', 'Why was Cody late?', ['He stayed to help Ela find her file.', 'He made a video for his mom.', 'He forgot what time it was.', 'He had a quiz after school.'], 'Ela couldn’t remember where she saved her file, so I stayed to help her.'),
    ('L4D1', 'What did Cody’s class do in art class?', ['They visited museums through VR.', 'They took a bus to a museum.', 'They drew pictures of Van Gogh.', 'They wrote on the blackboard with chalk.'], 'We visited many museums through VR.'),
    ('L4D1', 'What does Mrs. Wei want Cody to do next time?', ['Call her if he will be late.', 'Help Ela save her file.', 'Bring chalk to school.', 'Leave school earlier.'], 'Next time call to tell me you’ll be late.'),
    ('L4D1', 'When Mrs. Wei says “Don’t you know what time it is?”, she is ___.', ['unhappy that Cody is late', 'asking Cody for the time', 'happy to see Cody', 'telling Cody about a new clock'], 'Don’t you know…? 是否定疑問句，這裡有責備、不滿的意思。'),
    ('L4D1', 'Why does Mrs. Wei say “You guys are so lucky”?', ['When she was in school, they only had a blackboard and chalk.', 'Cody got a good grade on the quiz.', 'Cody met Van Gogh at a museum.', 'Ela found her file in the end.'], '她以前讀書時只有黑板和粉筆，現在的學生能用 VR。'),
    ('L4D2', 'Why is the screen showing “ERROR”?', ['Mrs. Wei used the old code.', 'The door is broken.', 'Cody forgot the new code.', 'Mrs. Wei pushed the buttons too fast.'], 'That’s because you’re still using the old code.'),
    ('L4D2', 'What is the new code?', ['6757', '5257', '1101', '5767'], 'you should enter the new code, 6757.'),
    ('L4D2', 'Why didn’t the lights turn on at first?', ['They changed the wake word, but Mrs. Wei used the old one.', 'The lights were broken.', 'Mrs. Wei didn’t say anything.', 'The voice assistant was not at home.'], 'We changed the wake word last night… It’s not Google anymore.'),
    ('L4D2', 'What is the new wake word?', ['Noodle.', 'Google.', 'Honey.', 'Cody.'], 'OK Noodle, turn on the lights…'),
    ('L4D2', 'How did Noodle know what song to play?', ['It has a list of Mrs. Wei’s favorite songs.', 'Cody typed the name of the song.', 'Mrs. Wei sang the song to it.', 'It played a song at random.'], 'It has a list of your favorite songs, so it knows what to play.'),
    ('L4R', 'What is the reading mainly about?', ['AI’s ability to “see” and how it helps people.', 'How to take good pictures with a cellphone.', 'Why AI is dangerous to students.', 'How to translate menus when traveling.'], '教案參考答案：It’s about AI’s ability to “see.”'),
    ('L4R', 'Which is NOT an example in the reading?', ['AI can drive cars for people.', 'AI can help plan where to place a couch.', 'AI can translate signs and menus.', 'AI can correct students’ mistakes.'], '文章沒有提到自動駕駛。'),
    ('L4R', 'What can AI tell people about food in pictures?', ['How much fat it has or how to heat it up.', 'Where the food was bought.', 'How much the food costs.', 'Who cooked the food.'], 'provide information like how much fat it has or how to heat it up'),
    ('L4R', 'What does “These tools are so useful that people use them in many parts of their lives” mean?', ['People use AI tools a lot because they are very useful.', 'AI tools are only useful at school.', 'People seldom use AI tools.', 'AI tools are too difficult to use.'], 'so…that…＝如此…以致於…'),
    ('L4R', 'Which of these prompts needs AI to use its ability to see?', ['I’ve uploaded a picture of a dog. Tell me what kind of dog it is.', 'Create a picture of a robot in a car. Make it look like a Van Gogh painting.', 'Translate the word “cellphone” into Chinese and make sentences with it.', 'Write a story about a dog that can fly.'], '課本 Reading Comprehension（答案 A）：要分析使用者上傳的圖片，才是「看」的能力。'),
    ('L4R', 'How does AI help students, according to the reading?', ['It can correct their mistakes and show them how to work out math problems.', 'It can take tests for them.', 'It can write their homework for them.', 'It can tell them where to place a lamp.'], 'AI can correct their mistakes and even show them how to work out a math problem.'),
    ('L4E', 'Which is NOT an example of Murphy’s Law?', ['When you forget your wallet, someone pays for you.', 'You just finished washing your car, and it starts to rain.', 'The school bus always comes late when you have a test on that day.', 'You need to talk to someone right away, but they aren’t answering the phone.'], '課本補充閱讀第 1 題（答案 A）：莫非定律是「會出錯的就一定會出錯」，(A) 是好事。'),
    ('L4E', 'Which of the following is NOT a lesson from Murphy’s Law?', ['Everything will go wrong, so we don’t need to try hard.', 'Always have more than one plan ready.', 'Hope for the best, but prepare for the worst.', 'Anything can happen, so we always need to be prepared.'], '課本補充閱讀第 2 題（答案 C）：文章要我們做最壞的打算、努力準備，不是放棄。'),
    (None, 'A: I forgot where I put my key again.\nB: ___', ['That’s why you should always put it in the same place.', 'I’m not sure whether you remember or not.', 'Don’t you know which key to use to open the gate?', 'Yes, I found the right key.'], '課本聽力練習：對方常忘記鑰匙放哪 → 給建議。'),
    (None, 'A: Do you know what we should get from the store?\nB: ___', ['Yes. I made a list.', 'No, they don’t sell that there.', 'No, we don’t need a dozen eggs.', 'It’s next to the bank.'], '課本聽力練習：問要買什麼 → 我列了清單。'),
    (None, 'M: Look at this. There’s water coming out from under it. Something’s wrong. Don’t you think we need a new one?\nW: I don’t think so. I think it’s still working very well.\nM: Very well? It can’t even keep the food cold. Last time I put the ice cream inside, and it turned into milk shake.\nQ: What may the man and the woman be talking about?', ['A refrigerator.', 'A fan.', 'A washing machine.', 'A lamp.'], '關鍵字：keep the food cold、put the ice cream inside。'),
    (None, 'M: The newest Cyril on your phone will make your life easier. You can save phone numbers or e-mail addresses without typing them yourself. You can also get tips on what to wear because it always keeps an eye on the weather. It can even teach you Chinese. Say “Hey, Cyril. Tell me how to say good morning in Chinese.”\nQ: What do we know about Cyril?', ['It is a voice assistant.', 'It can only speak Chinese.', 'It can save money for you.', 'It can cook meals for you.'], '不用打字、用說的就能操作 → 語音助理。'),
]

# 課文句型（教案「課文解析」的重點）：(單元, 題幹, [正確, 誘答×3], 說明)
LESSON_G = [
    (3, 'Zac and I had a good time ___ to your war stories last week.', ['listening', 'to listen', 'listened', 'listen'], 'have a good time ＋ V-ing（做某事很愉快）'),
    (3, 'Jane had a hard time ___ care of her kids by herself.', ['taking', 'to take', 'took', 'take'], 'have a hard time ＋ V-ing（做某事很辛苦）'),
    (3, 'A: Could you tell me about your trip to Australia?\nB: ___', ['With pleasure.', 'You’re welcome.', 'It’s a pleasure to meet you.', 'No problem with it.'], 'With pleasure. 用來禮貌地答應別人的請求；You’re welcome. 是回應道謝。'),
    (3, 'The story was even reported ___ a newspaper.', ['in', 'on', 'at', 'by'], '報紙、書本、雜誌「上」的內容用 in'),
    (3, '___ a great story!', ['What', 'How', 'What’s', 'So'], 'What ＋ a(n) ＋形容詞＋單數名詞！'),
    (3, '___ beautiful the morning is!', ['How', 'What', 'What a', 'So'], 'How ＋形容詞＋主詞＋動詞！'),
    (3, 'He has problems ___ things, so he gets lost often.', ['remembering', 'to remember', 'remembered', 'remember'], 'have problems ＋ V-ing（做某事有困難）'),
    (3, 'We had trouble ___ the restaurant, so we were late.', ['finding', 'to find', 'found', 'find'], 'have trouble ＋ V-ing'),
    (3, 'Some children are playing on the seesaw. ___ are playing on the slide. (There are still other kids in the park.)', ['Others', 'The others', 'Other', 'Another'], '除了這兩群還有其他人 → Others'),
    (3, 'There are 30 students in my class. Some like math. ___ like English. (That’s everyone in the class.)', ['The others', 'Others', 'Other', 'Another'], '「剩下的全部」→ The others'),
    (3, 'This band is very popular with ___.', ['the young', 'the youngs', 'young', 'a young'], 'the ＋形容詞＝一群人，視為複數（the sick、the young、the poor）'),
    (3, 'Thanks to him, they had time to put on their masks and stay ___.', ['safe', 'safely', 'safety', 'to safe'], 'stay 當連綴動詞，後面接形容詞（stay safe、stay warm）'),
    (3, 'Pets can help their owners ___ staying by their side.', ['by', 'with', 'for', 'in'], 'help… by ＋ V-ing（藉由…來幫助…）'),
    (3, 'Heroes can even ___ somewhere nearby.', ['be found', 'find', 'found', 'be find'], '含助動詞的被動：can be ＋ p.p.'),
    (3, 'He ___ a noise from the kitchen, so he went to check it out.', ['noticed', 'was noticing', 'is noticing', 'notices'], 'notice（察覺）是一瞬間的動作，通常不用進行式；went 過去 → noticed'),
    (3, 'People train horses to carry things.\n= Horses ___ to carry things.', ['are trained', 'train', 'are training', 'trained'], 'train ＋ N ＋ to V → N ＋ be trained ＋ to V'),
    (3, 'This shirt ___ three colors: red, blue, and black.', ['comes in', 'comes with', 'come in', 'is coming'], 'come in ＋顏色／尺寸（有…可選）；shirt 單數 → comes in'),
    (4, 'You’re late, honey. Don’t you know what time ___?', ['it is', 'is it', 'does it', 'it does'], '間接問句：what time ＋主詞＋動詞'),
    (4, 'Ela couldn’t remember where ___ her file.', ['she saved', 'did she save', 'she save', 'saved she'], '間接問句不倒裝；couldn’t 過去 → she saved'),
    (4, 'Today is the first day of November, ___ you should enter the new code.', ['so', 'because', 'but', 'or'], 'so 連接「原因, so 結果」'),
    (4, 'Mrs. Wei waits for the lights ___ on.', ['to turn', 'turning', 'turned', 'turns'], 'wait for ＋ N ＋ to V（等待…做…）'),
    (4, 'We changed the wake word. It’s not Google ___.', ['anymore', 'any', 'no more', 'already'], 'not… anymore（不再…）'),
    (4, 'How did Noodle know ___ I’d like it or not?', ['whether', 'that', 'what', 'which'], 'whether… or not（是否…）'),
    (4, 'It has a list of your favorite songs, so it knows what ___.', ['to play', 'playing', 'play', 'played'], 'wh- ＋ to V：what to play（要播什麼）'),
    (4, 'These tools are ___ useful that people use them in many parts of their lives.', ['so', 'such', 'very', 'too'], 'so ＋形容詞＋ that…（如此…以致於…）'),
    (4, '___ looking at a picture of a room, AI can help plan where to place a lamp.', ['By', 'With', 'For', 'In'], 'by ＋ V-ing（藉由…）'),
    (4, 'Over time, AI will get smarter, and people can expect it ___ in many new ways.', ['to help', 'helping', 'help', 'helped'], 'expect ＋ N ＋ to V（期待…做…）'),
    (4, 'Because of AI, life is getting ___.', ['easier and more convenient', 'easy and more convenient', 'easier and convenienter', 'more easy and more convenient'], 'get ＋比較級：easy → easier；convenient → more convenient'),
    (4, 'When traveling abroad, people can point their cellphone cameras ___ signs or menus.', ['at', 'to', 'on', 'in'], 'point ＋ A ＋ at ＋ B（把 A 對準 B）'),
    (4, 'A: Do you know why the students enjoyed the math class so much today?\nB: ___ they used VR in the classroom.', ['That’s because', 'That’s why', 'Because of', 'So'], '課本 Oral Practice：回答原因用 That’s because ＋句子'),
    (4, 'I’m sure ___ the right buttons, 5-2-5-7.', ['I pushed', 'did I push', 'pushed I', 'I push it'], 'I’m sure (that) ＋句子；說的是剛剛的事 → pushed'),
    (4, 'I want to join the singing contest. Could you tell me where ___?', ['to sign up', 'signing up', 'sign up', 'do I sign up'], 'wh- ＋ to V：where to sign up'),
]
