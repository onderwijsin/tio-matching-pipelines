# Trainees in onderwijs matching scripts

This repository contains data pipeline scripts for the yearly matching process between trainees and schools.

---

## Overview

The scripts in this repo are responsible for:

- Fetching matching settings and submitted preferences from the CMS
- Normalizing and validating the data (removing invalid references, handling missing entities)
- Building a match model based on mutual and one-sided preferences
- Generating Excel outputs used for manual review and final matching decisions

The process is executed in multiple rounds (e.g. round 1, round 2), after which final preferences
are collected.

For more details, or a step-by-step guide, see the [Playbook](#playbook).

---

## Requirements

- Node.js > 22
- pnpm

---

## Getting started

1. Copy `.example.env` → `.env` and fill in the required values
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Run the matching script:
   ```bash
   pnpm match
   ```
4. Or run the dates script:
   ```bash
   pnpm dates
   ```

> The current KeystoneJS CMS does not support static auth tokens. It's easiest to copy the session
> token from a logged-in user with proper permissions

---

## The Matching

The matching script is a **data pipeline** that transforms raw CMS data into structured Excel
outputs.

### Flow

1. **Fetch settings**
   - Contains configuration like number of preferences per round

2. **Fetch submissions**
   - Raw preferences from schools and trainees

3. **Normalize data**
   - Detects missing/invalid references (e.g. deleted schools, typos)
   - Optionally filters these out (`FILTER_MISSING_RECORDS`)

4. **Build match model**
   - Constructs relationships between schools and trainees
   - Identifies:
     - ✅ Double-sided matches (both prefer each other)
     - ➡️ Single-sided matches (only one side prefers the other)

5. **Generate Excel outputs**
   - Matching matrix (main output)
   - School list (details per school)
   - Trainee list (details per trainee)

---

### Configuration

The script is configured via environment variables:

| Variable                 | Description                                            |
| ------------------------ | ------------------------------------------------------ |
| `ROUND`                  | Active matching round (`day_1`, `day_2`, `final_3`)    |
| `OUTPUT_DIR`             | Directory where Excel files will be written            |
| `FILTER_MISSING_RECORDS` | If `true`, removes invalid preferences before matching |

---

### Output

After running the script, the following files are generated:

#### 1. `matchings_schema.[ROUND].xlsx` (main output)

A matrix where:

- Rows = schools
- Columns = trainees
- Cells = match type:
  - `match` → mutual preference (strong signal)
  - `match vanuit trainee` → trainee prefers school
  - `match vanuit school` → school prefers trainee

Also includes:

- Match counts per row/column
- Comments from both sides

👉 This file is used for:

- Manual review
- Creating definitive matches

---

#### 2. `school_list.[ROUND].xlsx`

Flattened overview of all schools:

- Contact info
- Preferences
- Notes
- Attendees

---

#### 3. `trainee_list.[ROUND].xlsx`

Flattened overview of all trainees:

- Preferences
- Notes
- Additional context

---

### What to do next

After generating the Excel files:

1. Review `matchings_schema.[ROUND].xlsx`
2. Manually adjust matches where needed
3. Use this as input for the next step (e.g. speed dates)

---

## The Dates

The dates script is a **data pipeline** that transforms the reviewed matching output into structured
speed date schedules.

---

### Flow

1. **Fetch settings**
   - Contains configuration like number of slots and slot duration per round

2. **Fetch submissions**
   - Provides the full list of schools and trainees

3. **Read matching schema**
   - Input: `matchings_schema.[ROUND].xlsx` (after manual review)
   - Extracts confirmed matches per school

4. **Build dataset**
   - Normalizes match data into a structured format
   - Filters out invalid or non-relevant rows (e.g. totals, comments)

5. **Apply availability overrides**
   - Allows manual constraints (e.g. limited availability per entity)

6. **Run scheduling algorithm**
   - Assigns trainees to slots per school
   - Ensures:
     - no double bookings
     - availability constraints are respected

7. **Generate Excel outputs**
   - Dates schema (matches per school)
   - Slot schedules (per school and per trainee)

---

### Configuration

The script is configured via environment variables:

| Variable     | Description                                         |
| ------------ | --------------------------------------------------- |
| `ROUND`      | Active round (`day_1`, `day_2`)                     |
| `INPUT_DIR`  | Directory containing the matching schema input file |
| `OUTPUT_DIR` | Directory where Excel files will be written         |

---

### Output

After running the script, the following files are generated:

#### 1. `dates_schema.[ROUND].xlsx`

A table where:

- Rows = schools
- Columns = date slots
- Cells = trainees

👉 This file shows the ordered matches per school

---

#### 2. `slotsBySchool.[ROUND].xlsx`

A table where:

- Rows = schools
- Columns = slots
- Cells = trainees

👉 This file is used for operational planning per school

---

#### 3. `slotsByTrainee.[ROUND].xlsx`

A table where:

- Rows = trainees
- Columns = slots
- Cells = schools

👉 This file shows each trainee’s personal schedule

---

### What to do next

After generating the Excel files:

1. Collect new preference submissions after the speed dates have occurred  
2. Repeat the process for the next round

---

## Playbook

Follow these steps in the yearly matching cycle:

1. Collect all submissions for round 1
2. Perform the `match` script with `ROUND=day_1` setting
3. Give the output files to the team. They will review and adjust matches.
4. Use the adjusted file as input for the `dates` script with the same `ROUND` setting.
5. Give the output to the team. They process the dates schema into a definitive version
6. After the speed dates have occurred, collect new preference submissions and repeat the process
   for the next round (step 1-5).
7. After the second round of speed dates have occurred, we'll collect the final preferences and
   run the `match` script one last time.

## How does the scheduling algorithm work?
The scheduling algorithm assigns trainees to time slots using a **heuristic approach**.

It does not guarantee a perfect solution, but aims to produce a good schedule under real-world constraints.

### Key ideas

- **Greedy assignment with scoring**
  - For each match, the best available slot is selected based on a scoring function
  - Earlier slots and lower trainee load are preferred

- **Constraint-aware ordering**
  - Schools with fewer matches are scheduled first (hardest cases first)
  - Trainees with limited availability are prioritized

- **Availability constraints**
  - Respects:
    - manual overrides
    - school availability
    - trainee availability
  - Prevents double bookings

- **Multiple runs**
  - The algorithm runs several times with the same input
  - The result with the fewest unassigned matches is selected

### Result

The output aims to:

- minimize unassigned matches  
- distribute meetings evenly across trainees  
- respect all availability constraints  

👉 In practice, this produces reliable schedules without requiring complex optimization algorithms.