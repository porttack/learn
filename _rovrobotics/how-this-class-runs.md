---
title: "How This Class Runs"
order: 6
source: original
---

# How This Class Runs

*The reasoning behind all of this, including the parts still being worked out, is on [Why This Class Runs This Way]({{ '/rovrobotics/why-this-class-runs-this-way/' | relative_url }}).*

This class runs like a shop, not like a lecture. That means the schedule is predictable and the deadlines do not move. Once you learn the rhythm you will never have to ask what is due, because it is the same thing on the same day every three weeks.

Two cycles matter: the **day** and the **sprint**. There is no weekly homework packet. There is no Friday check-in. Learn these two cycles and you are set.

---

## The Daily Rhythm

We meet Tuesday and Thursday, 3:00 to 5:00.

| Time | What happens |
|---|---|
| 3:00 | Punch in. Eat. Standup. Seated work. |
| 3:30 | Benches open. Build. |
| 4:50 | Clean up. Punch out. |

### 3:00, punch in and eat

You are on the clock when you punch in, not when you feel ready. Punching in is how your hours get counted, and your hours are part of your grade. Nobody will remind you.

Eat now. Food does not come to the bench, ever. Not a drink, not a snack, not "I'm almost done." The first half hour is when food happens, and at 3:30 it is over.

### 3:00 to 3:30, standup and seated work

Standup runs 3:05 to about 3:15. It is described in full in the next section.

The rest of the half hour is seated work: reading, seminar, planning, writing in your notebook, filling out a BOM row, working through a Python rung. This is real work and it is not warmup. Some of the most important things you do this year happen in this half hour.

### 3:30, benches open

This is the build block. It is the biggest part of the day and it belongs to you and your team.

If you want a card cleared, this is when you come find me and demonstrate it. Cards clear whenever you are ready. Do not save them up for the end of the sprint, because when six people want to clear cards on the same afternoon, the last two are not getting cleared.

### 4:50, clean up

Everything goes back. Tools to the board, parts to their bins, benches wiped, floor clear. Then write in your notebook. What did you do, what did you measure, what did you decide, what went wrong. Two minutes of writing now saves you an hour of remembering later.

Then punch out.

---

## Standup

Standup is the shortest meeting you will ever attend and it is the one that keeps the shop from running into itself.

Three questions. Per person, one sentence each:

1. What moved since last session?
2. What am I doing today?
3. What is blocking me?

That is the whole thing.

### The rule that keeps standup alive

**Blockers get named, not solved.**

The way standup dies, every time, in every organization that has ever tried it, is that somebody says "the thruster won't spin up" and four people start debugging while eleven people stand there watching. Twenty minutes gone.

When a blocker comes up, the facilitator says who can help with that, talk at 3:30, and moves to the next person. The conversation still happens. It just happens at the bench, with only the people who need to be in it.

### Standup is not a report to me

You are telling your team, not me. I will be standing at the back, listening, and some days I will be listening to a different team than yours.

That distinction matters more than it sounds like. A room where everyone reports to the teacher is a roll call. A room where people report to each other is a shop.

### Two levels, eight minutes

| Time | What |
|---|---|
| 3:05 to 3:10 | **Team standups**, all at once, in your corners. Three to seven people. Loud is fine. |
| 3:10 to 3:13 | **Shop sync.** One sentence per team from whoever facilitated. This is where cross-team problems get found. |

If your team's standup takes longer than five minutes, you are solving problems in it. See above.

Shop sync is where you find out that the software team is waiting on a measurement the frame team already has, which is the entire reason we do it out loud instead of assuming everyone knows.

### Who runs it

**Rotating facilitator.** Not the team lead, and not permanently anybody.

Running a standup is a five-minute mechanical job: call the order, hold people to one sentence, park the blockers, carry one sentence to shop sync. It takes no authority and it is not a promotion. Everybody does it, and by spring everybody in this room has run a meeting, which is a genuinely useful thing to be able to say.

Team lead is a different role. The lead owns the subsystem and is accountable for what the team committed to. The facilitator just runs the meeting. Sometimes they are the same person and that is fine, but the jobs are not the same job.

Facilitating cleanly, twice, is a card. See [Card 0.6, Running a Standup]({{ '/rovrobotics/card-0-6-running-a-standup/' | relative_url }}).

### Scrambled standup, once a sprint

On the **second Thursday of every sprint**, we scramble. Mixed groups of four or five, drawn on the spot, one person from each team where it works out. Same three questions.

The point is that nobody in your group knows your subsystem, so you cannot say "I fixed the thing" and have everyone nod. You have to explain it. That is harder than it sounds and it is exactly the skill the engineering presentation judges are testing in May.

It also catches the question your own team has stopped asking, which is usually some version of why are you doing it that way.

---

## The Sprint Rhythm

A sprint is three weeks, which is six sessions. Every sprint has the same shape.

| | Tuesday | Thursday |
|---|---|---|
| **Week 1** | Retro and planning | Build |
| **Week 2** | Build, **BOM due 5:00** | Build |
| **Week 3** | Water day | Build, **1-on-1s** |

### Three Cards Per Sprint

Alongside the build work, **three lesson cards clear each sprint.** That number drops later in the year as competition work takes over, but that is the load to plan around in the fall.

A card is a piece of skill or knowledge with something to show at the end. Most run 45 to 60 minutes. A few are as short as 15, and a few run to 90.

Do the arithmetic on that, because it matters: three cards at an hour each is about three hours per sprint, and the 3:00 to 3:30 seated block across six sessions is exactly three hours. **Cards are designed to fit in the seated block.** They are not supposed to eat your build time, and if they are eating your build time, either the card is harder than it should be or you did not start it in the seated block where it belongs.

A few cards need a bench, not a table, because they involve fabrication or soldering. Those are marked on the card list. Schedule them on purpose instead of discovering it at 3:15.

**Cards clear continuously and there is a queue.** There are around twenty of you and three cards each, which is roughly sixty demonstrations per sprint. Spread across six sessions that is fine. Piled into the last week it is not, and I will run out of afternoon before you run out of cards. The people who clear early get a real conversation. The people who show up on the last Thursday get whatever is left.

**Every card produces something you can show me.** A measurement, a working circuit, a piece of code you modify on the spot, a part you made, a written analysis. Not a claim that you did it. The thing itself. Cards clear on demonstration, and for a lot of them I will ask you to change something while I watch, because that is the difference between understanding a thing and having read about it.

Whatever the card produced goes in your folder. By spring your folder is a record of everything you can actually do, which is worth considerably more than a grade.

### Week 1 Tuesday: retro and planning

Two things, in this order.

**Retro** on the sprint that just ended. What did we say we would do, what actually happened, and why was there a gap. This is not a blame session and it is not a victory lap. It is the meeting where we get honest so the next three weeks go better than the last three.

**Planning** for the sprint starting now. Your team commits to deliverables out loud, in front of everyone. Public commitments are the point. You are also roughing out the sprint after this one, because of the BOM deadline below.

> **Still being written.** The detailed format for both meetings, who talks when, what gets written down, and how team commitments get reconciled with the individual goals in your status report, is not finished yet. It will land here before Sprint 1. For now: retro looks backward and is honest, planning looks forward and is public.

### Week 2 Tuesday: BOM due, 5:00 pm

**Parts for the next sprint must be requested by the middle of this sprint.**

School purchasing is slow. It is slower than you think and slower than is reasonable, and no amount of urgency on your part changes it. If you want a part on the bench in Sprint N+1, the request lands by 5:00 on the second Tuesday of Sprint N.

Miss the deadline and the part does not exist next sprint. That is not a punishment, it is just how long ordering takes. Plan around it.

A complete BOM row has six fields plus one sentence:

- Part name
- Exact link or part number, not a category page
- Quantity, as a number
- Unit cost
- Total cost
- Need-by date
- One sentence: what is this for

Rows that get rejected, every year, for the same reasons:

- A link to a search results page or a product category instead of the actual item
- Quantity listed as "some" or "a few"
- No need-by date, which automatically makes your request the lowest priority in the queue
- A part that breaks a MATE rule. Check voltage, materials, and size limits before you ask.

### Week 3 Tuesday: water day

If we have water access, this is when the robot gets wet. Some cards can only clear in water, and this is the day.

Water day is not a demo for an audience. It is a test. Things will not work. That is what a test is for. Bring a notebook and write down actual numbers, because the numbers you measure in the water are worth more than anything you can guess at a bench.

If we do not have water this sprint, this is a build day with a dry integration test instead: assembled, powered, tethered, and running on the bench.

### Week 3 Thursday: 1-on-1s

**This is the graded checkpoint. This is the one you cannot skip.**

Very few things in this class are graded directly. This is one of them. If you miss it, you will see it in your grade, and there is no version of "I forgot" that fixes it after the fact.

You sign up for a slot. Slots are limited per session and they go first come. While I am meeting with people one at a time, everyone else builds.

---

## What You Bring to a 1-on-1

Two things: a **status report** and your **folder**.

### The status report

Submit it as a Google Doc **before** we meet, not during. I print it and it goes in your folder afterward, so you never have to print anything yourself.

It has eight parts:

1. **At least three goals for the next sprint.** Specific and checkable. "Work on the claw" is not a goal. "Claw closes on a 40mm pipe and holds it through a 30 second transit" is a goal.
2. **Progress against your last set of goals.** Each one: done, partly done, or not done, and what happened. "Not done" with an honest reason is a fine answer. "Not done" with no reason is not.
3. **Cards you cleared this sprint.** List them by number. Bring what each one produced.
4. **Cards you intend to clear next sprint.** Three of them, by number. Look at your card list and choose on purpose.
5. **Other progress.** Things you did that were not on the list. This counts, and it is often the most interesting part.
6. **Concerns.** What is going wrong, what you are worried about, what you need that you do not have. Say it here, in writing, where it is on the record. A concern raised in week 2 is a problem we can solve. The same concern raised in April is a postmortem.
7. **Pictures.** At least one, and screenshots count. A photo of the part you built, the failure you are describing, the plot of your data, your CAD. A status report with no images is a status report about nothing.
8. **Your hours.** Straight off your log.

Notice what parts 1, 4, and 6 have in common: they are all about the sprint that has not happened yet. **The status report is not a book report on the past three weeks. It is your plan for the next three.** Half of it looks backward so the other half is grounded in something real.

That also means you are choosing your own cards rather than being assigned them. Choose badly, stack three 90-minute cards into a sprint where your team is also trying to get the vehicle in the water, and you will find out what that feels like. That is a real lesson and it is cheaper to learn in October than in April.

### The folder

Bring it. No folder, no meeting.

I am not collecting it and I am not grading it. We open it together and look at it on the table, and then you take it home. It should contain, in order:

- Front matter: safety agreement, syllabus, the Ten Bullets, the procurement rule, your card list
- Printed status reports and notebook pages from previous sprints
- Signed 1-on-1 sheets from previous sprints
- Whatever each cleared card produced: data, sketches, analysis, printouts
- Design Decision Records you wrote
- BOM rows you submitted, with what happened to them
- Water test data in your own handwriting
- Spec sheets for parts on the subsystem you own

That last one is not busywork. At competition, a safety inspector can ask about any component on the vehicle, and the correct answer is to hand them the spec sheet. Real companies keep this folder for exactly that reason. Ours happens to be split across your backpacks.

**Left pocket is the current sprint. Right pocket is everything before it.** Every page gets printed with a date and sprint number, so if the folder spills you can put it back together.

Start with a folder. When the folder stops working, and it will, come get a binder.

### What the 1-on-1 actually sounds like

Five minutes, and I ask roughly the same things every time:

- What did you clear this sprint? Show me what each one produced.
- Which three are you taking next sprint, and why those?
- Show me your hours.
- Show me a part you specified that is now on the vehicle. What does it do?
- Anything you ordered that came late or came wrong? What did the team do that sprint instead?
- What are you specifying for next sprint, and does the need-by date actually clear procurement lag?
- What is the one thing you got stuck on, and what did you do about it?
- What are you owning next sprint?

None of these are trick questions. All of them are easy if you have been doing the work and impossible to fake if you have not.

---

## Missing a Session

You will miss sessions. Sports, illness, and life happen, and I am not going to fight you about it.

Here is the deal.

**Missing a Tuesday or Thursday is not a grade event.** Nobody takes attendance points. But the hours you did not work are hours you did not log, and your hours are visible.

**Making it up is on you.** Not on me, and not on your team. If you missed a build session, find the time. If you missed a card demo, come clear it another day. Cards clear continuously, so there is no such thing as a card you cannot make up.

**Missing a 1-on-1 is a grade event.** The window is published in advance, slots are limited, and booking is your job. If you know a game is going to eat the last Thursday, book earlier. That is the entire solution and it is available to everyone.

**Water day is the hard case.** If you own a card that can only clear in water and you are not there, it does not clear. A teammate cannot clear it for you, because then it is their card. If you know you will miss water days regularly, do not take critical path cards. That is a real constraint and I would rather tell you in September than in May.

---

## The Two Habits Everything Else Rests On

Out of the Ten Bullets, two carry this class:

**Be on the clock.** Punch in, work, punch out. When you are on the clock you are working, and when you are not, you are not pretending to.

**Write things down.** In the moment, at the bench, in your own hand. Not later, not from memory, not reconstructed the night before a 1-on-1.

Everything in this document is a structure for making those two habits automatic. If you do those two things, the rest of this is just a calendar.
