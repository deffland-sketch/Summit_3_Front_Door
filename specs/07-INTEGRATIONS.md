# Spec 7: Integrations and the Futre Adapter

Summit 3.0 Homebase · Working draft v1 · October 20, 2026

Resources plug in at two points: they post Offerings and they return Evidence. Futre is the one source the platform also reads for context. Every adapter has the same interface; in sandbox mode every adapter is a stub fed by the seed.

## Adapter Interface

```
interface SourceAdapter {
  name: 'futre' | 'kira' | 'teach_to_one' | 'calendar' | 'partner' | 'gradebook'
  pullOfferings(week: Date): Offering[]        // what students can be scheduled into
  pullEvidence(since: Date): Evidence[]        // signals of progress tagged to outcomes
  pushCompletion?(slot: Slot): void            // tell the source a slot happened
  health(): { ok: boolean; lastPull: Date; message: string }
}
```

Outcome tagging is the adapter's job. Each adapter carries a mapping table from the source's own codes to Outcome ids. Unmapped signals land in the Evidence Log as "unmapped," never as evidence.

## Futre

What Futre holds, from Summit's own design documents and Futre's public descriptions: a vision board built at onboarding; career exploration across 800 plus careers with fit scores from the student's answers; pathways (post-high school routes) under build; experiences with reflections and an experiences hub where a school posts its offerings; a portfolio with reflection on upload; a caregiver view on the roadmap. Homebase reads Futre and writes back only experience reflections.

Fields to request from Futre, by object:

| Object | Fields Requested | Used For |
|---|---|---|
| Student link | futre_student_id, Summit student id, consent status | Joining records |
| Vision | vision_text, vision_board_url, updated_at | My Pathway header; mentor Student screen |
| Concrete Next Step | cns_type (four-year, two-year, apprenticeship, military, work, training, undecided), cns_text, target_careers[] (futre career id, title, fit_score), updated_at | Ranking open-slot options; level review; mentor Pathway component |
| Careers explored | career_id, title, cluster, explored_at, fit_score, saved (bool) | My Pathway; which RW slots to rank up |
| Experiences | experience_id, title, type (expose, explore, pursue), provider, start, end, status, reflection_text, reflection_at | Evidence of durable skills and pathway; RW slot history; level review |
| Experiences hub offerings | offering_id, title, provider, type, days, capacity, outcomes_tagged | Offerings for RW slots, so school partner slots published in Futre show in Homebase |
| Portfolio | portfolio_url, item_count, latest_item {title, url, reflection, added_at} | Progress evidence links; validation prep |
| Caregiver view | whether enabled | Family screen in a later spec |

Write back: one call per completed RW slot, `pushCompletion`, carrying the slot, the student's reflection line, and the outcomes served, so Futre's experience record stays whole.

Questions for Futre (Diane's team), to send as a short list:

1. Is there an API or export for the fields above, and what is the auth model (per-school key, per-student OAuth)?
2. Do experiences carry a type we can map to Expose, Explore, Pursue, and can we set it?
3. Can the experiences hub accept Summit partner slots with capacity and days, and return who booked?
4. Can we write an experience reflection back, and does it appear in the student's Futre record?
5. What does the data agreement need to cover for a sandbox with no real students, and later for a pilot?

## Kira

| Direction | Fields |
|---|---|
| Offerings | Assigned practice sets per student (lesson ref, estimated minutes), self-paced course modules, open practice hub hours |
| Evidence | Mastery per standard or lesson (pct), attempts, time on task, flags (stuck, ready), with the lesson ref so Assignment.status updates |
| Push | Which lesson a workshop covered, so Kira can skip or adjust practice |

Mapping: Kira lesson refs to Lesson ids are stored on Lesson.kira_ref; Kira standard codes to CCSS ids in the adapter table.

## Teach to One

| Direction | Fields |
|---|---|
| Offerings | Roadmap sessions by day for each enrolled student |
| Evidence | Roadmap progress (pct), skill mastery by TTO skill id mapped to CCSS |

## Calendar and Partners

| Direction | Fields |
|---|---|
| Offerings | Whole-group events (from the school calendar), partner slots (from each partner's shared calendar or a simple sheet): title, provider, day, start, end, capacity, place, type |
| Evidence | Attendance confirmation from the partner, which becomes Slot.status and, with a reflection, Evidence of durable skills |

## Gradebook (Optional, Transition Only)

For a school still keeping grades beside outcomes: read a Google Sheet gradebook as Evidence of cognitive skill scores on final products. Not in the sandbox.

## Sandbox Stubs

Each adapter has a stub that reads `/public/sandbox/{name}.json` and returns it as if pulled. The seed writes those files. `health()` returns ok with a fixed lastPull. A sandbox control panel lets a demo driver nudge one source (lower a Kira mastery score, add a Futre reflection, cancel a partner slot) and watch the week respond, and offers a what-if: one setting, one score, or one adult's availability previewed as a side-by-side diff for one student and the school, read-only until Apply (Spec 6 What-if).
