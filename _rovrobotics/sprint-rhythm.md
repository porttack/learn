---
title: "Sprint Rhythm"
order: 2
source: original
nav: primary
---

# Sprint Rhythm

Twelve sprints this year, numbered 1 through 12. Three weeks each, six sessions. Every sprint has the same shape.

| | Tuesday | Thursday |
|---|---|---|
| **Week 1** | Retro and planning | Taught card + build |
| **Week 2** | **BOM due 5:00** + build | Scrambled standup + taught card + build |
| **Week 3** | Water day | **1-on-1s** + self-directed work |

Sprints 1 and 7 are two weeks. No water day, one taught card, 1-on-1s on Week 2 Thursday.

See also: [Daily Rhythm]({{ '/rovrobotics/daily-rhythm/' | relative_url }}) · [Sprint Calendar]({{ '/rovrobotics/sprint-calendar/' | relative_url }}) · [Why This Class Runs This Way]({{ '/rovrobotics/why-this-class-runs-this-way/' | relative_url }})

---

## Cards

**Three cards clear each sprint** through Sprint 6, then two as competition work takes over.

A card is a piece of skill or knowledge with something to show at the end. Most run 45 to 60 minutes. A few are 15, a few are 90.

**Pick your cards with other people.** At Week 1 Tuesday planning, cards get called out and you group up with whoever else is taking them. Three or four people on a card means you work it together, teach each other, and can verify each other. Working a card alone by accident is the failure mode.

**Two of your three get taught** on Thursdays. The third is on you and your cohort. Be honest about the arithmetic: three cards at an hour each is more than the seated block holds, so some card work happens in the build block and some happens at home.

**Some cards need a bench, not a table**, because they involve fabrication or soldering. Marked on the card list. Schedule them on purpose instead of discovering it at 3:15.

### Clearing a card

Two ways. The card list says which.

**Peer verified.** Somebody who has already cleared that card watches you do it, asks you about it, and signs your signoff sheet. That signature means something: if a card you signed turns out to be hollow, that is on you too. Two of those and you do not verify cards again this semester.

**Verified by me.** Safety cards, anything on the critical path, all of Unit 4 software. Oral, and I will ask you to change something while I watch.

Either way, **every card produces something you can show.** A measurement, a working circuit, code you modify on the spot, a part you made. Not a claim. The thing itself.

At every 1-on-1 I pick one of your peer-verified cards at random and ask you about it for sixty seconds. Not to catch anybody out. It just means you cannot afford to have any of them be hollow, since you do not know which one I will pick.

---

## Week 1 Tuesday: Retro and Planning

**Retro** on the sprint that just ended. What did we say we would do, what happened, why the gap. Not a blame session and not a victory lap.

Your team writes down **at most three changes, each with a name on it.** Three weeks from now your status report asks whether they happened.

**Planning** for the sprint starting now:

- One sentence on what you intend to demonstrate at water day
- Three to five deliverables, each with an owner and a date
- Parts you will need
- What you are waiting on from another team
- Two rough lines on the sprint after this one, because of the BOM deadline

Both live in one document in `01 Company/Sprint Records/`. If you missed this session, that is where you read what happened.

---

## Week 2 Tuesday: BOM Due, 5:00 pm

**Parts for the next sprint get requested in the middle of this sprint.**

School purchasing is slow, slower than is reasonable, and urgency does not change it. Miss the deadline and the part does not exist next sprint. Not a punishment. That is how long ordering takes.

A complete row is six fields plus one sentence: part name, exact link or part number, quantity as a number, unit cost, total cost, need-by date, and what it is for.

Rejected every year for the same four reasons:

- A link to a search page or a category instead of the actual item
- Quantity given as "some" or "a few"
- No need-by date, which makes your row lowest priority by definition
- A part that breaks a MATE rule. Check voltage, materials, and size first.

Before you submit: read the DDR for your subsystem, and search the tracker to see whether another team already ordered it.

---

## Week 3 Tuesday: Water Day

The robot gets wet. Some cards only clear here.

Water day is not a demo for an audience. It is a test, and things will not work. That is what a test is for. Write down actual numbers, because a measurement from the water is worth more than anything you can guess at a bench.

If we do not have water that sprint, it becomes a dry integration test: assembled, powered, tethered, running on the bench. The sprint still ends with something demonstrated.

---

## Week 3 Thursday: 1-on-1s

**The graded checkpoint. The one you cannot skip.**

Very little in this class is graded directly. This is. If you miss it you will see it in your grade, and there is no version of "I forgot" that fixes it afterward.

Sign up for a slot. Slots are limited per session and go first come. If a game is going to eat the last Thursday, book earlier. That is the whole solution and it is available to everyone.

While I am meeting people one at a time I am unavailable for two hours. **Week 3 Thursday is a self-directed session** and a bad day for anything that wants me watching. No soldering, no first-time tool use, no fabrication you have not done before.

Good for: status report and folder, documentation, DDRs, reading for the next unit, seated card work. Come in with a plan.

### Water day and 1-on-1 conflicts

If you own a card that only clears in water and you are not there, it does not clear. A teammate cannot clear it for you, because then it is their card. If you know you will miss water days regularly, do not take critical-path cards. Real constraint, and I would rather tell you in September than in May.

---

## What You Bring to a 1-on-1

A **status report** and your **folder**.

### The status report

Submit as a Google Doc **before** we meet. Template in `00 Program/Templates/`.

Header: name, team, date, cards cleared, cards planned next sprint, total hours.

Then:

- **Important.** Optional. Anything I need to know about or help with.
- **New goals and progress against prior goals.** A table. Status code and projected completion date on every row. N new, D done, L late (which is fine), C changed, R reassigned. Asterisk any date that moved.
- **Photo or screenshot.** Required. Show something you did.
- **Concerns.** Optional.
- **Work log.** Dates, hours, a few words. More for you than for me.
- **Retro,** copied from your team's, plus your own reflection if you want.
- **Retro follow-through.** What did your team decide to change, and did it happen?

A goal with a date is an estimate, and an estimate that moves is useful information. **L is safe to report.** One late item is nothing. The same item late three sprints running is a conversation, and I would much rather have that conversation than read three sprints of invented progress.

### Hours

Log outside-class hours. Every entry should name something that exists: a document, a commit, a part. Not because I doubt you, but because hours with an artifact attached are verifiable in ten seconds and hours without one are unverifiable, which is unfair to whoever is being honest.

**Outside hours count toward meeting the bar, not beating it.** They are how you make up what you missed. Make every session, log zero outside hours, and you are in good standing.

Athletes: you do not need to make up every hour of class time. You do need to do some work every week.

### The folder

Bring it. No folder, no meeting. I am not collecting it and not grading it. We open it on the table and you take it home.

**Your folder is about you:**

- **Signoff sheet.** Every card, the date, who verified it. First page.
- Printed status reports
- 1-on-1 sheets, signed by both of us
- Whatever your cleared cards produced
- Front matter: safety agreement, syllabus, Ten Bullets, procurement rule, card list

**Your team binder is about the robot.** It lives on a shelf and holds BOMs, DDRs, retro records, weekly logs, test data, spec sheets, calculations.

> **If it is about you, it goes in your folder. If it is about the robot, it goes in the team binder.**

The binder is also what a safety inspector asks for at competition. Real companies keep it for that reason. Ours is on a shelf.

Start with a folder. When the folder stops working, and it will, come get a binder.

### What the 1-on-1 sounds like

Five minutes, roughly the same questions:

- What did you clear this sprint? Show me what each one produced.
- Let me ask you about this one. *(picks a peer-verified card at random)*
- Which cards next sprint, and why those?
- Show me your hours. You logged three on a Saturday, what came out of it?
- Show me a part you specified that is now on the vehicle. What does it do?
- Anything you ordered that came late or wrong? What did the team do instead?
- Your team decided to change something at the retro. Did it happen?
- What is the one thing you got stuck on, and what did you do about it?

None of these are trick questions. All of them are easy if you have been doing the work and impossible to fake if you have not.

---

## The Weekly Log

Each team keeps a log, one entry a week, written by a **rotating scribe**. Four or five short documents a week for the whole shop.

Lives in `02 Teams/<your team>/Logs/`. Not graded. I read it.

Two reasons it exists. Parallel standups mean I only hear one corner at a time, and the log is how I find out what happened in the others. And **the retro reads from the log**, so a team that did not keep one shows up Week 1 Tuesday with nothing to look at.

Rotating job, like facilitating standup. Everyone does it.
