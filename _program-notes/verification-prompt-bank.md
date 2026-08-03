# Verification Prompt Bank
One paragraph per card. Each prompt works as the 90-second oral check or as a written response, and each is anchored to something a chatbot cannot supply: the student's own measurements, a physical artifact in their hands, an event from our studio or pool days, or a live modification performed on the spot. A response that could have been written by someone who was not there is a response that has not cleared.

Teacher notes: for written responses, require handwriting or in-studio composition when in doubt. Any written response can be spot-audited with one live follow-up question drawn from its own content. This is a living document; add prompts as cards are added, and retire prompts that start producing rehearsed answers.

---

## Unit 0: Engineering Process

**0.1 Socratic Seminar.** Name one specific claim someone else made during our practice seminar (who, and what they said, in your own words), and respond to it now with either support or a challenge, using one piece of evidence from your own experience on this team. If your account of the seminar does not match the room's memory of it, that is the follow-up conversation.

**0.2 Writing a DDR.** Take the DDR you wrote and argue the other side: what evidence, if the team had possessed it at the time, would have flipped the decision to your rejected option? Then say what you personally witnessed that supports the option that actually won. The check fails if you can only restate the record and cannot inhabit the reasoning behind it.

**0.3 Sprint Planning.** Pick one deliverable from your team's actual current commitment. Define what "done" looks like for it in demonstrable terms, then name the interruption most likely to eat it, drawn from something that has actually derailed this team before. Generic risks ("we might run out of time") do not clear; named, historical ones do.

**0.4 Score Autopsy.** Put your written pre-autopsy prediction next to the real scoresheets and identify where you were most wrong: which loss you overestimated or never saw coming, by roughly how many points, and what that gap reveals about what this team believes versus what the record shows. A student whose "prediction" perfectly matches the sheets has answered a different and more awkward question.

**0.5 BOM and Purchase Requests.** Your submitted BOM row is on the table. The part arrives and it is wrong: wrong size, wrong quantity, or wrong item. Walk backward through your actual row, field by field, and identify every place the error could have entered, then state which field on YOUR row was weakest as submitted. The row must be the one in the tracker, not a hypothetical.

**0.6 Reading a SID.** Verbal only, printed SID on the table: the teacher points at a component you did not annotate, and you trace its full power path aloud from surface to component, naming the voltage at each stage and the fuse that protects it. Written variant: describe the single largest difference between your from-memory sketch and the real SID, and what that difference would have cost at an inspection.

---

## Unit 1: Water Physics

**1.1 Archimedes.** With your data sheet in hand: state your canister's measured volume, the neutral weight you calculated from it, and the weight it actually took, then account for the difference between the last two numbers. Then live: the teacher hands you an object and its weight; estimate the displacement it needs to hover and say whether it needs foam or lead as it sits.

**1.2 Pressure vs. Depth.** Your written prediction and your observed syringe result, side by side: explain the gap, including whether your arithmetic or your assumptions caused it. Then live: compute absolute pressure at a depth the teacher names on the spot, out loud, and state whether a sensor reading gauge pressure would agree with you.

**1.3 Buoyancy Control.** Your Cartesian diver in hand: run it, then point at the physical part of your diver that corresponds to the float's piston, and name the one step where the two mechanisms differ in HOW they change volume. Then answer your prep prediction against reality: does the float's motor work while holding depth, and how do you now know?

**1.4 Drag and Thrust.** Your stopwatch table on the table: defend your predicted ranking against your measured one, and if they differ, say where the water charged you a fee you did not anticipate. Then live: the teacher names one object currently bolted to Godzillah; make the case for or against it in drag terms, with a number from your own trials if one applies.

---

## Unit 2: Electricity and Fabrication

**2.1 Ohm's Law.** Your nine-measurement table in hand: point to your prediction-round error percentage and account for where it came from (meter, resistor tolerance, arithmetic, or wiring). Then live: the teacher names a voltage and a resistance; produce the current aloud, and state what a corroded connector adding one ohm in series would do to it.

**2.2 Fuses and Power.** Your annotated SID on the table: walk through your fuse calculation, then explain the difference between your computed value and what the robot actually ran last season, and which of the two you now trust more and why. Then live: the fuse blows mid-mission; state your on-deck checklist, in order, before a new fuse goes in.

**2.3 Wire Prep and Waterproofing.** Your tagged splice sample in hand, post-dunk: name which of the three failure points from the demo was hardest for you to avoid, and point to the physical evidence of that struggle (or its absence) on the sample itself. Then live: the teacher hands you someone else's anonymous sample; grade it against the wall standard aloud.

**2.4 Penetrators.** Your potted sample in hand after its dunk: point to where water would attack it first and defend the claim from the sample's own geometry. Then rank the three sealing strategies by how gracefully they fail, and state which failure you would rather have at four meters and why the mission changes that answer.

**2.5 Tether Voltage Drop.** Your measured tether resistance next to the gauge chart's prediction: account for the difference. Then live: the robot browns out when all thrusters fire at once; give two fixes that do not involve buying a new tether, with the cost of each, and point at your own hand-drawn graph to justify one of them.

**2.6 Conductivity and Corrosion.** Your photo log in hand: rank your three jars by damage and defend the ranking from your own day-by-day photos, then explain why the powered jar behaved the way YOUR jar actually behaved, including anything that surprised you. A log with no surprises invites the follow-up: which photo would you show a teammate who thinks rinsing the robot is optional?

**2.7 Connection Autopsy.** Your failure report and the actual dead part on the table: the teacher challenges your prevention recommendation on one axis (cost, weight, pull test, or build time) and you defend or amend it holding the evidence. The part must be present; the conversation is with the corpse.

---

## Unit 3: Control and Actuation

**3.1 PWM.** Live at the whiteboard: sketch the waveform for a duty cycle the teacher names on the spot, labeled with on-time and period, then state the pulse width that centers a servo and what happens if a motor-style 1 kHz signal hits it instead. Written variant: your own bench observation of where "half bright" landed versus 50% duty, and your explanation.

**3.2 ESCs and Brushless.** Your bench current log in hand: state your measured idle and loaded currents and connect the difference to the stall discussion. Then live: the thruster twitches but will not spin; give three causes spanning signal, ESC, and motor, with the test for each, in the order you would actually run them at a pool day.

**3.3 Servos and Steppers.** Live: the teacher hands you a mission task description; choose an actuator and defend the pick including the failure mode you are knowingly accepting, then survive one challenge. Reference what you physically felt at the two bench stations; a student who never touched the hardware has nothing to cite, and it shows.

**3.4 Networking.** Live simulation: the ROV is dead at the pool and the teacher plays the vehicle, answering only what your diagnostics would actually reveal. Walk the stack from link light upward; clearing requires reaching the fault in a defensible order, not guessing it. Written variant: a triage narrative of a real network failure from one of our own pool days, with what was checked and what the fix was.

**3.5 PID.** With the float's real gains visible: predict aloud what the pool would show if kd were zeroed, then the teacher doubles kp and describes oscillation, and you name the adjustment and its tradeoff. Written variant: annotate an actual depth-vs-time plot from our float, labeling overshoot and settling, and state which term you would touch first and why.

**3.6 Joystick Mapping.** Your feel-test record in hand: explain why the winning mapping won for YOUR partner specifically, citing what they said or did during the blind test. Then live: the pilot reports fine positioning is impossible during the coral task; state which part of the mapping you change and what it costs at full speed.

**3.7 Sensors and Conversion.** Your verification numbers in hand: state your measured error between tape measure and computed depth, and account for it. Then live: competition moves to salt water; state what changes in your function, roughly by how much, and what happens to a float that nobody told.

**3.8 Cameras.** Your latency table in hand: defend your placement recommendation (which camera on the claw, which surveying) against one live challenge, using your own measured numbers. If your numbers differ from a teammate's for the same chain, the follow-up is to hypothesize why, which is a better lesson than the card itself.

---

## Unit 4: Software (all verbal, all live at a machine)

**4.1 Terminal and SSH.** Live only: the teacher names a file somewhere on the studio Pi; SSH in, navigate to it, and display its contents, narrating each command. Tab completion is fluency, not cheating. No written variant exists for this card; the terminal is the paper.

**4.2 Python Ladder (any rung).** Live only: run your transfer task, then modify it on request, twice. The modifications come from the rung card's examples or the teacher's imagination. Code that runs but cannot be bent on the spot has been obtained, not understood, and the difference takes about forty seconds to surface.

**4.3 Data Logging.** Your CSV and your kill-test result on screen: show what your logger kept when you killed it mid-run, state what it lost before your fix, and show the fix. Then live: format one line of your own data as a competition packet and defend each field against the manual's spec.

**4.4 Plotting.** Live: open your script, regenerate your JPG, then modify on request ("first sixty seconds only," "add a horizontal line at target depth"). Then point at your own plot and narrate what the float was doing at a moment the teacher picks.

**4.5 State Machines.** Your hand-drawn diagram on the table: the teacher names a weird moment ("ascending, and the pressure sensor starts returning garbage") and you trace, finger on paper, exactly where your machine goes and whether that is acceptable. If your diagram has no answer, the check becomes designing the missing transition aloud, which also clears.

---

## Unit 5: Mission Science and Safety

**5.1 JSA.** Your own JSA on the table: identify the control most likely to be skipped when people are rushed, defend why you believe that about THIS studio specifically, and propose the change that makes it skip-proof. Then live: the teacher names a task from your sheet and you state its hazards from memory, because at a real site the paper is in a binder and the hazard is in your hands.

**5.2 Pool Deck Protocol.** Your team's actual checklist in hand: pick any line and tell the story of the failure it exists to prevent, from this team's history if possible. Then live: the teacher removes one line and asks what failure just became possible. After the first pool day, the prompt upgrades: cite something the checklist caught or missed on the actual deck.

**5.3 Seabed 2030.** Cite one claim made in OUR seminar, by name, and respond to it now with support or challenge you did not voice in the room. Then connect one mission task from our own manual to the real survey work discussed, in your own words. Written variant requires the same named citation; a response that could have been written without attending has not cleared.

**5.4 The Argo Program.** With your plotted profile in hand: point at the thermocline in the real data you plotted, then walk the chain from that measurement to Ebirah's dive cycle to the piston, without notes. The check is the walk, one end to the other, because that walk is verbatim what a judge will ask for in May.

**5.5 Monterey Bay.** Cite one claim from our seminar (who, and what) and extend or challenge it. Then live: the teacher names one stakeholder discussed (fisher, researcher, tourist operator, Navy) and you state the hardest tradeoff the sanctuary asks of them, in terms someone from that group would recognize as fair.

**5.6 Coral Restoration.** Name the mission task from our manual that simulates restoration work and explain what the real-world version of that exact task looks like, then take a position from your prep notes (solution, stopgap, or distraction) and survive one challenge to it, drawing on what was said in our seminar by someone who disagreed with you.

**5.7 Deep-Sea Mining.** State, steel-manned and in full, the strongest argument for the side you did NOT draw in the debate, then say what you actually think and name one thing said in the room, by whom, that moved you or failed to. A student who argued FOR mining clears by making the AGAINST case sound like its best advocate wrote it, and vice versa.

**5.8 Ocean Acidification.** Your cup observations in hand: report what your three cups actually showed, including your caveat sentence about why the vinegar cup exaggerates. Then live: walk the full chain from a car's tailpipe to a thinner oyster shell, step by step, no skipped links, using your own cups as the evidence for the middle steps.

**5.9 Ghost Gear.** Your team's ranked requirements list in hand: defend the requirement YOU argued into the top three, against one challenge, and name which requirement our actual robot as currently built fails worst. The follow-up connects forward: what would the design spec for that requirement have to say?

**5.10 Blue Economy.** Your job posting card from the wall: present the posting, then defend your mapping of three lesson cards onto its requirements, and identify the largest gap between the posting's demands and what this class teaches. The gap answer is the honest one; a mapping with no gaps invites the question of whether you read the posting.
