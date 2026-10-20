/** Sentence templates for notes and reflections. Asset language only. */
export const TOUCHPOINT_NOTES: Record<string, string[]> = {
  plan: [
    'Set two goals for the week: finish {lesson} and bring a draft to the studio.',
    'Wants {outcome} to be the focus this week. We picked the seminar on Thursday.',
    'Built the week together. Open slots went to practice and the project studio.',
    'Chose a lighter Wednesday so the placement day has energy behind it.',
  ],
  check_in: [
    'Good energy today. Practice on {lesson} went better than expected.',
    'Felt stuck on {lesson} for ten minutes, then used the worked example. Talked through what to try next.',
    'Asked for a quiet space for the afternoon block. Arranged it.',
    'Quick hallway check. On track for the week; nothing to move.',
  ],
  feedback: [
    'Looked at the draft together. {outcome} is the strongest part; one more round of evidence explanation would move it.',
    'Feedback on the lab write-up: the data table is clear, the claim can be sharper.',
    'Reviewed the exit signals from this week. Two got-its and one need-more on {lesson}.',
  ],
  reflection: [
    'Said the seminar was the best part of the week. Wants more of that.',
    'Reflected on where the focus habit showed up. Named one hard moment and what helped.',
    'Felt the week ran long. We talked about pacing the project studio.',
  ],
  goal: [
    'Goal for next week: {outcome} up one band. Agreed on the evidence to bring.',
    'Wants to have {lesson} mastered before the placement starts.',
    'Revisited the term goal. Still the right one.',
  ],
  family: [
    'Family call: shared the progress on {outcome} and the plan for the next two weeks. Family asked about the placement schedule.',
    'Family check-in by phone. Positive. Next step-back in four weeks.',
  ],
  validation_prep: [
    'Walked through the evidence for {outcome}. Three strong pieces. Deciding who should be in the room.',
    'Prepped for the portfolio review. Chose the two artifacts to lead with.',
  ],
}
export const STUDENT_NOTES = [
  'I got it today.',
  'Need one more try on this.',
  'The studio block was good.',
  'Want to talk about Friday.',
  'Ready for the assessment, I think.',
]
export const FOLLOW_UPS = ['Bring the draft on Thursday', 'Check the Kira practice before Friday', 'Confirm the placement time with the coordinator', 'Share the reflection with family']
export const REFLECTIONS = [
  'I moved on {outcome} today. Next I need another practice set.',
  'The seminar helped me see the counterargument. I need time to write it down.',
  'Practice felt slow but I finished the set. I need a check-in tomorrow.',
  'Today the placement was the best part. I need to write the reflection while it is fresh.',
  'I stayed with the hard problem. Next I need someone to check my work.',
  'Got through the lesson. I need the workshop on the next one.',
]
export const HABIT_REFLECTIONS = [
  'I noticed {habit} when I kept going on the second problem set.',
  '{habit} showed up when I asked for help instead of waiting.',
  'Hard to find {habit} on Wednesday. It was there on Friday in the studio.',
  'I used {habit} to plan the week on my own this time.',
  '{habit} was easy this week because the placement was something I care about.',
]
export const ADULT_OBSERVATIONS = [
  'Got it. Explained the method to a peer without prompting.',
  'Need more. Stayed with it; one more session should do it.',
  'Ready for more. Finished early and asked what comes next.',
  'Got it. Clear work; one small step skipped in the write-up.',
  'Need more. Lost the thread halfway; a worked example helped.',
]
export const FUTRE_REFLECTIONS = [
  'I did not expect to like the field work. Being outside and collecting real data made the statistics feel real.',
  'The newsroom was fast. I learned that asking a good question is most of the job.',
  'Shadowing in the hospital showed me how much the work is about people, not just science.',
  'The college class was harder than I thought and I kept up. That changed what I think I can do.',
  'Building something with my hands all week made me want to learn the math behind it.',
  'The design studio critique was honest and kind. I want to get better at taking feedback.',
]
export const VISIONS = [
  'A life where I get to help people on their hardest days and still have time for my family.',
  'Work that lets me build things people use every day.',
  'A career outdoors protecting the places I grew up in.',
  'Telling stories that matter to my community.',
  'Running my own business with my cousin.',
  'Being the teacher I wish I had in middle school.',
  'Designing things that make life easier for people with disabilities.',
  'A steady trade, a house of my own, and weekends free.',
  'Still figuring it out, and I want to try a lot of things before I decide.',
]
export const GOALS = [
  { text: 'Finish the unit on {unit}', kind: 'content' },
  { text: 'Move {outcome} up one band', kind: 'cognitive' },
  { text: 'Write the reflection the same day as the placement', kind: 'durable' },
  { text: 'Bring a full draft to the studio by Thursday', kind: 'cognitive' },
  { text: 'Ask one question in every seminar', kind: 'durable' },
  { text: 'Get through two practice sets on {lesson}', kind: 'content' },
]
