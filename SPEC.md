# Daily Fall-Risk Assessment — Product Specification

## Purpose

Replace the paper daily fall-risk assessment with a phone workflow for ward nurses and a ward-wide view for the head nurse. This document describes the intended behavior; it is a specification only. Do not build the app from this request yet.

Use fabricated sample patients only in any mockup, demo, or sample data. Never use real patient details in examples.

## Users and goals

- **Ward nurse:** Sign in, find one admitted patient, complete that patient's assessment at the bedside, and submit it. The flow is for one patient at a time on a phone.
- **Head nurse:** See the whole ward on one screen, including each patient's latest risk level for today and which patients have not yet been assessed.

## Ward patient list

- The ward list is preloaded with admitted patients for the selected ward and date; the nurse does not create a patient record while performing the daily assessment.
- The assessment is associated with the patient's ward, bed, date, name, and hospital number (HN). Show enough identity information to let the nurse confirm the selected patient before entering or submitting an assessment.
- The list includes patients with no assessment today. Their status must read **Not assessed**, distinct from a completed assessment with risk level **None**.
- Source of the admitted-patient list and how admissions, transfers, bed changes, and discharges update it are open questions (see below).

## Nurse assessment flow

1. The nurse signs in. Attribute the submitted assessment to that signed-in nurse; capture the submission time automatically.
2. The nurse selects one patient from the ward's preloaded list and confirms the patient's identity.
3. The form shows ward, bed, date, patient name, and HN from the selected patient and today's assessment context.
4. The nurse ticks all applicable risk factors and any care steps completed.
5. The app calculates the risk level using the rules below and shows it before submission.
6. The nurse submits the assessment. The app confirms it was saved and reflects the result on the ward board.
7. Assessment entry must work offline and sync later when connectivity returns. Pending and synced state, conflict behavior, and reliable time attribution while offline need operational definition.

### Risk factors

Allow all that apply to be selected:

- **R1** Over 65 and has fallen before
- **R2** Confused, or awareness has changed
- **R3** Problem with balance or walking
- **R4** Poor eyesight
- **R5** Medicines that raise fall risk
- **R6** Urgent or frequent toilet needs
- **R7** Lines or devices attached

### Risk calculation

Apply the highest applicable category in this order:

1. **High** — any of R1, R2, or R3 is selected.
2. **Moderate** — none of R1–R3 is selected and any of R4, R5, or R6 is selected.
3. **Low** — none of R1–R6 is selected and R7 is selected.
4. **None** — no risk factors are selected.

Recalculate whenever the selected factors change. Do not require a separate manual risk-level choice.

### Care steps

Care steps are checkboxes for actions done. The ward has not confirmed the clinical list yet. For the initial mockup, show these user-provided examples, each clearly marked **“Example, to be confirmed by the nurses”**:

- Bed in lowest position
- Call bell within reach
- Non-slip footwear
- Fall-risk sign at the bed
- Patient and family told about fall risk

Keep the care-step definitions in one centralized, easily changeable place. Do not present the examples as an approved clinical protocol until nurses confirm them.

## Repeat assessments and history

- A nurse may submit another assessment for the same patient on the same day, including after a change in condition.
- Keep earlier assessments; a later assessment must not overwrite them.
- The ward board shows the latest assessment for today, with its time and risk level. Make the existence of earlier same-day assessments discoverable from patient assessment history.
- Exact clinical policy for when to reassess after a change needs confirmation from the nurses.

## Head nurse ward board

- One screen shows every patient currently expected on the selected ward's daily list.
- At minimum, each row shows bed, patient name, HN, today's latest status/risk level, and assessment time when submitted. Show **Not assessed** for patients with no assessment today.
- Clearly distinguish **Not assessed** from **None** risk.
- Keep the board current after an assessment is submitted or an offline assessment syncs.
- Ward, bed, patient, and date context must be visible so the board is not mistaken for another ward or day.
- Show which nurse submitted the latest assessment, consistent with the form's nurse attribution.
- For the demo, let the head nurse add a made-up patient to an empty ward bed by entering a name and HN. Keep the patient in this browser only, show **Not assessed yet**, and include the patient in the nurse's patient selector.

## Offline behavior

- Nurses must be able to complete and save an assessment without network access, then sync it later.
- A saved offline assessment must remain associated with the selected patient and signed-in nurse, and must not disappear before sync.
- Do not silently overwrite a prior assessment during sync. Preserve multiple assessments and show the latest one for today according to its recorded assessment time.
- Confirm with ward/IT stakeholders how device time, sync conflicts, shared devices, and sign-in expiry should work offline.

## Fabricated sample data

Any example records must be synthetic and visibly labeled as demo data. For example:

| Ward | Bed | Date | Patient | HN | Example assessment |
|---|---|---|---|---|---|
| Demo Ward | D01 | Demo date | Mina Example | DEMO-0001 | R2 selected → High |
| Demo Ward | D02 | Demo date | Arun Sample | DEMO-0002 | No factors selected → None |
| Demo Ward | D03 | Demo date | Niran Fiction | DEMO-0003 | Not assessed |

These names and identifiers are fictional placeholders, not patient records.

The demo ward starts with 20 fabricated patients. The 15 additional entries use numbered “Demo Patient” names and DEMO HNs. Their varied risk-factor combinations are randomized once when seeded, calculated by the rule above, and stored in the browser for demonstration.

## Questions for the nurses

1. **Care steps:** What exact approved set of care-step checkboxes should replace the clearly labeled examples? Are there any steps that are conditional on a patient's risks?
2. **Reassessment:** After what kinds of condition change should the nurse reassess, and are there any other triggers besides a condition change? The app will permit repeat same-day assessments and retain their history while this policy is confirmed.
3. **Ward census:** What is the authoritative source for the admitted-patient list? When should a new admission, transfer, bed move, or discharge appear or disappear from the daily assessment list, and who resolves an incorrect ward/bed assignment?
4. **Daily completion rules:** What counts as “today” for a patient admitted or transferred during the day, and are there cases where an active patient should not be counted as awaiting assessment?
5. **Corrections:** If a nurse submits an assessment against the wrong patient or with an incorrect tick, what correction or void workflow is clinically acceptable while preserving the original record and audit history?
6. **Offline operation:** How should staff handle a shared phone, an expired sign-in, a device clock that is wrong, or two offline assessments that sync out of order? Which recorded time should determine the latest assessment?
7. How should nurses log in with their hospital account?

## Open implementation decisions

- Patient roster integration and update cadence.
- Nurse account provisioning, ward permissions, and head-nurse access scope.
- Authentication and device security for offline use.
- Data retention and audit requirements for assessment history.
- Handling of failed or delayed sync and confirmation that the head nurse can identify pending offline records.

1. R2 and R5 ticked → high
2. R4 and R7 ticked → moderate
3. Only R7 ticked → low
4. Nothing ticked → none
5. R1, R6 and R7 ticked → high
