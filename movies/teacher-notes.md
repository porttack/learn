---
layout: minimal
title: "Movies: teacher notes"
permalink: /movies/teacher-notes/
---

# Movies: teacher notes

The same notes now live on each movie's own page (the answer key shows when the address ends in `?key=1`, and the warm-ups are always shown). This page keeps every key in one place.

Answer keys for Part 1 of each worksheet. A blank answer means the key still needs to be checked against the film. Check ratings and content for your own students before showing a film. Spare Parts and The Imitation Game are PG-13; The Imitation Game deals with war, a suicide and the prosecution of a gay man, so it suits older students best.

{% assign films = site.movies | sort: "title" %}
{% for film in films %}
{% assign ws = site.data.movie_worksheets[film.slug] %}
## {{ film.title }}

{% for q in ws.part1 %}{{ forloop.index }}. {% if q.answer != "" %}**{{ q.answer }}**{% else %}(to check){% endif %} {{ q.q }}
{% endfor %}

{% if ws.before %}
**Teacher ideas (before the movie)**

{{ ws.before | markdownify }}
{% endif %}

{% if ws.teacher %}{{ ws.teacher | markdownify }}{% endif %}

[Student worksheet]({{ '/movies/' | append: film.slug | append: '-worksheet/' | relative_url }})
{% endfor %}

## Ron's Gone Wrong: discussion questions

Pick and choose. Most take 30 to 60 seconds. Bouncy ones are marked with a star.

**Quick warm-ups**

- ★ Thumbs up or thumbs down: would you want a B-bot? Everybody vote, then call on a few people to say why.
- ★ If your B-bot showed up out of the box right now, what is the first thing you would ask it to do?
- ★ Best scene in the movie. Shout it out.
- ★ Ron glitches constantly. What is the funniest broken thing he did?
- ★ Give Ron a rating out of 10 as a robot. Now rate him out of 10 as a friend. Why are those different numbers?
- ★ If you had to be trapped in a locker with one character from this movie, who and why?

**Comprehension check**

- What was actually wrong with Ron compared to every other B-bot?
- Why did Barney want a B-bot so badly in the first place?
- What did Marc want the B-bots to be? What did Andrew want them to be? How were those different?
- What did Ron do at the end of the movie, and why did he do it?

**Think about it**

- Every other B-bot already knew what its kid liked. Ron had to learn Barney by hanging out with him. Which way makes a better friend, and why?
- The B-bots pushed kids toward people who were already similar to them. What do you miss out on when you only meet people like yourself?
- Savannah's whole life was public. What is one thing that should stay private, even from your closest friend?
- Barney's dad and grandma were trying to help, but they got it wrong at first. Why is it hard for adults to know what kids actually need?
- Ron broke the rules constantly. Was Ron a good robot or a bad robot? Defend your answer.
- The company said they were connecting people. Were they? What were they actually doing?
- Is a friend still a friend if you programmed them to like you?
- Rich was mean to Barney early on and ended up in the friend group later. What changed?

**Real life connection**

- Where do you already see something like a B-bot in your real life? Think apps, feeds, recommendations.
- Your phone or your game already suggests things to you. Who decided what it suggests?
- Name one thing a machine should never be allowed to decide for you.
- If you were on the team building B-bots, what is one rule you would have insisted on?

**Character and self**

- Which character are you most like, and why? Think about how they handle their feelings and how they treat other people.
- Barney had to choose between being popular and being honest. When have you seen someone make that choice at school?
- Name one small thing a person could do tomorrow to be a better friend than a B-bot.

**If you need to stretch:** pair share for 90 seconds on any question, then take three answers out loud. Or do a four corners vote on the "good robot or bad robot" question and have each corner defend itself.
