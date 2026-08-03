# SLV ROV 2026-27 Program Design: Context Dump
Sea Exploration League / SLV ROV, San Lorenzo Valley HS. Teacher: Eric ("Mr. B"). MATE RANGER class, Monterey Bay Regional. Vehicles: Godzillah (ROV), Ebirah (vertical profiling float, PID depth control, Python, repo at slvusd/float). This document summarizes the full program redesign developed July 2026.

---

## 1. Core Concept
The classroom is a **studio** run like an engineering **company**. Structure exists to protect project-based building time, not replace it. Design-first year: Sprint 0 is planning and evidence-gathering; building follows from requirements, not enthusiasm.

## 2. Problems Being Solved (from 26-27 Story)
- Uneven workload; some students socialize while others carry the team
- Sports and other absences
- No formal curriculum; seat-of-pants instruction
- Claw over-complexity repeatedly missing deadlines (recurring failure mode)
- Documentation pawned off to one student who transcribes words without owning ideas
- Accountability systems (todo lists, exit tickets) died from friction
- Grade inflation: mostly As given; wants rigor without alienating high achievers who chose the class for PBL
- Slow school procurement made worse by vague student part requests
- Returning students resist norm resets

## 3. Sprint System
- **3-week sprints** (2-week sprints failed previously: too short)
- Class meets **Tuesday and Thursday, 2 hours each**
- Each sprint ends at a **pool day** (roughly monthly); "done" = demonstrated in the water; bench-demo fallback if pool cancels
- Teams of **3 to 7** publicly commit deliverables at sprint planning; one owner per deliverable; doubled estimates; deliverables must fit one sprint or be split
- Sprint review at pool day + retro; random member defends a random team DDR at review

## 4. Fall 2026 Calendar (built, on actual dates)
- First class **Thu Aug 6**; Tu/Th weekly; no class Thanksgiving week; last class **Thu Dec 10**; 35 sessions
- **Sprint 0** (Aug 6-27, 7 sessions): Day 1 = Most Likely to Succeed + "what should an A mean" norms seminar. Then cards 0.1 (seminar how-to + claw practice seminar), 0.4 (score autopsy, 2 sessions), 0.2 (DDR), 0.6 (SID), waterfall semester planning + team formation, 0.3+0.5 (sprint planning + BOM) with Sprint 1 commitments
- **Sprint 1** (Sep 1-17, pool Sep 17): cards 1.1, 5.1, 5.2 (safety before first pool day)
- **Sprint 2** (Sep 22-Oct 8, pool Oct 8): 2.1, 2.2, 2.3
- **Sprint 3** (Oct 13-29, pool Oct 29): 2.4, 3.1, 3.2
- **Sprint 4** (Nov 3-19, pool Nov 19): 1.2, 3.7, 1.3 (float-focused sprint)
- **Sprint 5** (Dec 1-10, short wrap): 5.4 Argo seminar, integration, 4.3 data logging, semester review/demo
- Python rungs 1-10 due weekly from Sep 1, done by ~mid-Nov
- Weekly rhythm: Tuesday opens with the 20-40 min lesson; Thursday full studio; checks corner first 15 min of studio blocks
- Held for spring: cards 1.4, 2.5-2.7, 3.3-3.6, 3.8, 4.4, 4.5, seminars 5.3, 5.5-5.10; design specs introduced at spring planning; spring sprints work backward from MATE deadlines

## 5. Grading
- Work is **complete or "not yet"**; redos always open
- Students keep their A by keeping lesson cards cleared and contributions visible (competency ladder, not points)
- Norms co-created with students day one after the film
- Framed as reassurance-first to retain high achievers

## 6. Lesson Card System (~31 cards, all drafted)
Format per card: unit/format/time/prereqs, core question, ~10-min resource, hands-on or written activity, clearing mechanism, "If You Miss This Class" path (renamed from "absent or self-paced" for admin optics), competition relevance. Student-facing docs contain **no em-dashes** (AI-signal awareness).
- **Unit 0 Engineering Process:** 0.1 Socratic seminar, 0.2 DDR, 0.3 sprint planning, 0.4 score autopsy, 0.5 BOM, 0.6 SID
- **Unit 1 Water Physics:** 1.1 Archimedes, 1.2 pressure/depth, 1.3 buoyancy control/Cartesian diver, 1.4 drag
- **Unit 2 Electricity/Fab:** 2.1 Ohm's law, 2.2 power/fuses (produces SID annotation), 2.3 wire prep/waterproofing (authorization gate; wall of passing samples), 2.4 penetrators, 2.5 tether voltage drop, 2.6 conductivity/corrosion jars, 2.7 connection autopsy (needs a "box of dead things")
- **Unit 3 Control/Actuation:** 3.1 PWM, 3.2 ESC/brushless, 3.3 servos vs steppers (feeds claw DDR), 3.4 ethernet/networking (uses slvusd/float repo, ports 5000/5001), 3.5 PID (uses real gains kp=40, ki=8, kd=15, imax=0.5), 3.6 joystick mapping, 3.7 sensor unit conversion (kPa/9.81, gauge vs absolute trap), 3.8 cameras analog vs USB (stopwatch latency method)
- **Unit 4 Software:** 4.1 terminal/SSH scavenger hunt, 4.2 Python ladder meta-card, 4.3 data logging (kill-test), 4.4 matplotlib depth plot (competition JPG), 4.5 state machines. All Unit 4 checks are live-at-machine only
- **Unit 5 Mission Science/Safety:** 5.1 JSA (feeds real submission), 5.2 pool deck protocol/launch checklist (tabletop saboteur test), 5.3 Seabed 2030, 5.4 Argo, 5.5 Monterey Bay, 5.6 coral restoration (swap when 2027 manual drops), 5.7 deep-sea mining debate (random sides), 5.8 acidification (shell race, carbonated water as honest analog), 5.9 ghost gear (requirements-before-solutions; rehearses design specs), 5.10 blue economy (job posting wall)
- Priority scheme exists: P1 gates (~14), P2 core (~12), P3 triggered-by-events, P4 tracks (ROS2 is a software-team track gated by an ADR, not a card)
- Note: early cards (0.x, 1.1, 2.3, 3.3, 3.4, 3.5) still use the older longer format/heading; not yet revised to match compact format

## 7. Verification Philosophy (semi-AI-proof)
Written prompts are preparation; the **90-second oral check or live modification is the verification**. Four resistant prompt types: prediction-before-measurement, local-evidence (our pool day, our dead parts, named classmates in seminar), honest-question, artifact-anchored. Teach-back to team = alternate clearing (maps to Ten Bullets "I Understand"). Any written response auditable by one live follow-up from its own content. Avoid generic "explain X" prompts.

## 8. Python Ladder
Think Python 3rd ed. (Downey), chapters 1-10 = rungs 1-10, one per week, notebooks are ungraded practice. Each rung has a robot-context transfer task; cleared by live demo + on-the-spot modification. Rung tasks feed forward (rung 6 = card 3.7's conversion function; rung 9 = float hold-quality metric; rung 10 dicts return in 4.5 state machines). Known issue: rung 4 uses turtle, which stock Colab lacks; ASCII-grid fallback suggested. No autograding year one.

## 9. DDRs and Design Specs
- **DDR** = Nygard ADR format generalized: Title/Status/Context/Options/Decision/Why/Consequences, half page. **Rule: whoever makes the decision writes the record, same sprint.** ADRs = same template for software architecture calls
- Documentation lead **assembles** the tech doc from team-authored DDRs, interviews for gaps; does not invent content
- Enforcement: random member defends random DDR at sprint review = judging rehearsal
- Sprint 0 practice: everyone writes one DDR on a last-season decision (zero stakes). Teacher should author the worked example (fuse story suggested)
- **Design specs**: still to be designed. Direction: shorter than DDR; what it must do, measurable acceptance criteria, constraints, interfaces. Needed by spring Sprint 1 planning; announced in student email; card 5.9 is the on-ramp. Old CTE Project 1-pager judged too heavy (50% writing mechanics); may shrink to a Sprint 0 team charter, and its proposal role survives in the contractor policy

## 10. Working Code / Sweat Equity
Adapted from Tom Sachs' Ten Bullets (modified in practice). Hours logged like a **timecard** ("that record belongs to you") = on-task habit made visible. Mappings: on-the-clock = Be On Time (+ Sacred Space = studio itself); DDRs = Keep a List + Thoroughness Counts; oral checks/teach-backs = I Understand. Equity itself is complex; deserves its own lesson; deliberately kept out of the intro email.

## 11. Procurement
**One-sprint-ahead BOM rule:** parts for sprint N+1 due by middle of sprint N (mid-sprint Tuesday per calendar). Complete row = part, exact link, qty, unit cost, total, need-by, one-sentence purpose. Vague requests bounced same day. Supply chain manager owns intake/tracker; teacher presses the purchase button.

## 12. Independent Contractor Policy (drafted)
Company-of-one for fired or solo-fit students. Granted not chosen; 2-3 slot cap; one-page proposal gate; same sprints/cards/DDRs/hours; projects must sell back to the company (test fixtures, camera studies, props, tooling); explicit path back to teams; firing requires documented retro evidence + probation sprint with written expectations. Sprint review needs a short solo demo slot.

## 13. Student Email (drafted, approved direction)
Tight two paragraphs + plain proposed-lesson list by unit. Covers: studio, sprints, pool days, lessons/cards, miss-a-class path, grade basis ("keep your A by..."), sweat equity/timecard, Ten Bullets, DDRs + design specs teaser, PBL-protection close. No equity detail, no contractor mention, no em-dashes. Optional add if sent in August: one sentence that the season plan comes from the score autopsy evidence.

## 14. Artifacts Created (files)
- DDR_Template.md (includes when-to-write, random-defender check, doc-lead role)
- Contractor_Policy.md
- Semester1_Calendar_Fall2026.md
- Lesson cards: Lesson_Card_0-1 through 0-6, 1-1 (individual files); Unit1_Cards_1-2_to_1-4.md; Unit2_Cards.md (2.1-2.7 minus 2.3); Unit3_Cards.md (3.1, 3.2, 3.6, 3.7, 3.8); Unit4_Cards.md (4.1-4.5); Unit5_Cards.md (5.1-5.10); plus older-format standalones Lesson_Card_24 (=2.3 wire), _25 (=3.4 networking), _26 (=3.3 servos), _13 (=3.5 PID)
- Unit4_Python_Ladder_Rungs_1-10.md
- Unit0_Reading_Packet.md (readings 0.1-0.6) and Unit1_Reading_Packet.md (1.1-1.4): one-page readings, each ending in a prediction/local-evidence prep prompt
- Verification_Prompt_Bank.md: living doc, one semi-AI-proof paragraph per card, dual written/verbal use

## 15. Open Items (priority order, historical — see the published `/rovrobotics/todo/` page for the live tracker)
1. ~~Calendar~~ (done for fall; spring pending MATE 2027 dates)
2. **Tracking mechanics**: one wall chart/spreadsheet for cards + hours + DDRs; timecard rack; checks-corner protocol; must cost minutes/day or it dies like the todo lists
3. **Design spec template** (deferred discussion; needed by spring planning)
4. **Reading packets Units 2-5** (~20 readings; Unit 2 needed by Sep 22). Unit 5 seminar cards also reference provided excerpts that must be pulled/drafted
5. Teacher-authored worked-example DDR for card 0.2
6. Obtain last year's granular scoresheets (email Matt if missing) — card 0.4 depends on them
7. CA CTE standards alignment table (late summer; defensibility for grading reform, contractor status; anchor standards 3/5/6/10 map well)
8. Optional: revise ten early cards to compact format; class-page starter data (depth lists, packet strings); teacher facilitation notes for first seminar, debate, bench-spin
9. Start the "box of dead things" if it does not exist
10. Sprint 0 day-by-day exists in calendar; movie runs ~90 min in a 2-hr block

## 16. Standing Principles
- Student ownership is non-negotiable; teacher steers, does not rewrite
- Judges want WHY not HOW; every card ends in competition relevance
- Consequences do the teaching (BOM window, pool-day deadline, water as project manager)
- One system, no parallel tracks: the same card clears in class, solo, or after absence
- Evidence over vibes: autopsy justifies the plan; predictions dated before data
- Interlock everything: cards feed rungs feed DDRs feed the tech doc feed the presentation
- Kill systems that cost more than minutes a day
