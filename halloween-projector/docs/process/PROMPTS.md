# Тизер Halloween 2026

## ВАРИАНТ Б (новый): наезд и отъезд прямо в видео, склейка с живой сценой

- Первый кадр: `home-1920.png` (общий план сцены, все на своих местах)
- Последний кадр: тот же `home-1920.png`
- 16:9, 1080p, 8 секунд, звук не важен
- Промпт:

```
Dark pixel art horror scene at night: a moonlit graveyard with a huge full moon, four dancing skeletons around a bubbling cauldron on a fire, a hooded purple reaper with a scythe floating on the hill, framing dead trees. Cold blue and teal moonlight. The shot starts and ends on exactly this same wide frame.

The skeletons, the reaper, the trees, the cauldron and the gravestones stay completely still like a frozen picture for the whole shot; only the fire and the green brew may flicker slightly.

0-2 s: the camera pushes in smoothly and steadily toward the full moon and the far hill right under it, until the moon fills most of the frame.
2-3.5 s: on the far hill ridge right under the moon the ground cracks and bulges, and a huge rotting zombie hand bursts violently out of the earth in a spray of dirt clods; the forearm shoots straight up in jerky movements until the open hand is in the middle of the moon, palm facing the viewer, bony crooked fingers spread wide with long black claws, a dark silhouette against the moon with a thin blue-teal moonlit rim.
3.5-5 s: the fingers twitch and claw at the air once, then the hand holds still in front of the moon.
5-6 s: the hand sinks back down into the ground, the soil closes over it, the hill is empty again.
6-8 s: the camera pulls back out smoothly to exactly the starting wide frame.

Realistic, detailed horror anatomy inside the silhouette: dead grey-blue skin, bony knuckles, torn flesh, wrist tendons, a ragged dark cloth strip on the forearm. Crisp pixel art in the same style as the frame, sharp pixel edges, limited palette. No text, no people, no extra hands, no bats, no other creatures, no camera shake.
```

Negative prompt (если есть поле):
```
camera shake, handheld, rotation, moving characters, skeletons moving, reaper moving, morphing background, text, letters, watermark, logo, blur, smooth 3D render, extra fingers, extra hands, people, faces
```

Как склеится: тизер идёт ровно раз в 20 минут, в моменты, когда облака в сцене возвращаются на те же места, что на `home-1920.png`. За пару секунд до этого скелеты добегают до своих точек и встают в те же позы, жнец замирает, котёл стихает; сцена становится этим кадром пиксель в пиксель, и тут же начинается видео. Пока рука стоит у луны, видео можно придержать: молния, гром и надпись HALLOWEEN 2026 из кода. Видео заканчивается тем же кадром, и сцена продолжает с него. Склейка бесшовная на экране 16:9 (1920x1080 или 1280x720 на весь экран); на другом соотношении сцена шире или уже кадра.

---

## ВАРИАНТ А: только крупный план (наезд в коде)


### Что отдать в Veo 3.1 Fast (режим «первый и последний кадр»)

- Первый кадр: `first-frame-1920.png`
- Последний кадр: тот же `first-frame-1920.png` (рука вылезает, держится у луны и уходит обратно, холм в конце как в начале)
- 16:9, 1080p, 8 секунд, звук не важен
- Промпт:

```
Static locked-off shot, the camera does not move at all: no zoom, no pan, no tilt, no shake. Dark pixel art horror scene at night: a huge full moon over a graveyard hill, cold blue and teal moonlight. The background stays completely still for the whole shot: moon, sky, stars, clouds, trees, branches and gravestones do not move or change. The shot starts and ends on exactly the same empty hill.

At the bottom centre, on the hill ridge right under the moon, the ground trembles, cracks and bulges. A huge rotting zombie hand bursts violently out of the earth in a spray of dirt clods, and the forearm shoots straight up in jerky movements until the open hand is in the middle of the full moon, palm facing the viewer, bony crooked fingers spreading wide with long black claws, a dark silhouette against the moon with a thin blue-teal moonlit rim. The fingers twitch and claw at the air, then the hand holds still in front of the moon for about two seconds.

Then the hand slowly sinks back down into the ground, the fingers curling as they disappear, the soil falls back and closes over it, and the hill is left exactly as it was at the start, empty and still.

Realistic, detailed horror anatomy inside the silhouette: dead grey-blue skin, bony knuckles, torn flesh, wrist tendons, a ragged dark cloth strip on the forearm. Crisp pixel art in the same style as the frame, sharp pixel edges, limited palette. No text, no people, no extra hands, no bats, no other creatures, no camera movement.
```

Negative prompt (если есть поле):
```
camera movement, zoom, pan, tilt, camera shake, moving background, morphing moon, changing clouds, text, letters, watermark, logo, blur, smooth 3D render, extra fingers, extra hands, people, faces
```

Как это встанет в тизер: пока рука стоит у луны, я придержу этот момент в коде, ударю молнией с громом и напишу HALLOWEEN 2026; потом видео доиграет уход руки, и камера отъедет обратно в сцену.

---

Ниже: подробности и запасные варианты.


Файлы:
- `first-frame-1280.png` / `first-frame-1920.png`: первый кадр (крупный план луны из сцены, на него наезжает камера). Брать как есть.
- `hand-zone-guide.png`: только для тебя, НЕ отдавать модели. Композиция как на референсе Дмитрия: раскрытая ладонь по центру луны (красная рамка), предплечье строго вертикально (оранжевая), из холмика земли на гребне (жёлтый).
- Сток-картинку с рукой на фоне луны (Shutterstock, с водяным знаком) модели НЕ отдавать: она только для нас, как ориентир композиции.

Порядок:
1. Сделать последний кадр в генераторе картинок (промпт 1) из `first-frame-1920.png`.
2. Сделать видео в Veo 3.1 Fast по первому и последнему кадру (промпт 2). Если последний кадр не выходит, видео только по первому кадру (промпт 3).
3. Отдать мне mp4: дальше я сам вырежу руку, приведу к палитре и пикселям сцены и вставлю в тизер с наездом, громом и надписью.

Настройки видео: 16:9, 1080p (или 720p), 5-6 секунд (если есть 8, тоже ок), без звука или звук не важен. Камера неподвижна.

---

## 1. Последний кадр (генератор картинок, редактирование первого кадра)

```
Edit this image. Keep everything exactly as it is: the same pixel art style, the same full moon, sky, stars, clouds, hills, gravestones, trees and branches, the same colours and the same framing. Do not move, crop or zoom anything.

Add one thing, in the exact centre of the picture: a huge rotting zombie hand bursting up out of the ground, seen from the front. The forearm rises straight up, vertical, out of a small mound of broken earth on the hill ridge at the bottom centre. The open hand, palm facing the viewer, fingers spread wide and slightly bent like claws, is placed right on the middle of the full moon, so the moon frames it like a halo; the fingertips reach the upper part of the moon. The hand and forearm are a dark silhouette against the bright moon, with a thin cold blue-teal moonlight rim along their edges.

Realistic, detailed horror anatomy inside the silhouette, drawn in the same dark pixel art as a horror game sprite: grey-blue dead skin, bony knuckles and finger joints, torn rotting flesh, tendons on the wrist, long broken black nails, a ragged strip of dark cloth at the wrist. Dirt clods falling off the forearm onto the mound.

No text, no letters, no people, no other creatures, no glow effects, no blur.
```

## 2. Видео по первому и последнему кадру (Veo 3.1 Fast)

```
Static locked-off shot, the camera does not move at all: no zoom, no pan, no tilt, no shake. Dark pixel art horror scene: a huge full moon over a graveyard hill at night, cold blue and teal moonlight.

The background stays completely still for the whole shot: moon, sky, stars, clouds, trees, branches and gravestones do not move or change.

At the bottom centre, on the hill ridge right under the moon, the ground trembles, cracks and bulges into a mound. A huge rotting zombie hand bursts violently out of the mound in a spray of dirt clods and the forearm shoots straight up, vertical, in jerky movements, until the open hand is right in the middle of the full moon, palm facing the viewer, fingers spreading wide like claws, the moon framing it like a halo. The fingers twitch and claw at the air once, then the hand freezes, fingers spread, a dark silhouette against the moonlight with a thin blue-teal rim. Dirt keeps trickling down the forearm onto the mound.

Realistic, detailed horror anatomy inside the silhouette: grey-blue dead skin, bony knuckles, torn flesh, wrist tendons, long broken black nails, a ragged cloth sleeve. Crisp pixel art, the same look as the first frame, sharp edges, limited palette. No text, no people, no extra hands, no bats, no extra characters, no camera movement.
```

Если есть поле negative prompt:
```
camera movement, zoom, pan, tilt, shaking camera, moving background, morphing moon, changing clouds, text, letters, watermark, logo, blur, smooth 3D render, extra fingers, extra hands, people, faces
```

## 3. Запасной вариант: только первый кадр

Тот же промпт 2 и в конце дописать:
```
By the end of the shot the open hand is in the exact centre of the full moon, palm to the viewer, fingers spread like claws, the forearm straight down into the mound at the bottom centre.
```

---

Летучих мышей, молнию и надпись добавлю я в коде (чтобы были чёткие и в нашей палитре), поэтому в видео их нет.

Если модель умеет брать картинку-референс стиля, можно добавить `../boo-ref/boo-sheet.jpg` (наш скример), чтобы рука была в той же рисовке. Но не вместо первого кадра.
