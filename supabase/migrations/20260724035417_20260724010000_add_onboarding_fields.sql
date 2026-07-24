/*
# Add Onboarding Fields to Profiles

## Overview
Adds columns to the `profiles` table to support a personalized onboarding flow.
New users will be guided through selecting their learning style, study goals,
and preferred study times. An `onboarded` flag tracks whether the user has
completed the onboarding wizard so it only shows once.

## Modified Tables

1. `profiles` — added 3 new columns:
   - `learning_style` text — one of 'visual', 'auditory', 'reading', 'kinesthetic', 'mixed'
   - `study_goals` text — free-text goal the student wants to achieve (e.g. "Pass all AP exams with A's")
   - `onboarded` boolean NOT NULL DEFAULT false — set to true when onboarding is complete

## Security
- No new tables. Existing `profiles` RLS policies (select_own_profile, update_own_profile)
  already cover these new columns — no policy changes needed.

## Important Notes
1. All three columns are nullable/defaulted so existing profiles remain valid.
2. The `onboarded` flag defaults to false, so existing users who haven't gone through
   onboarding will be prompted to complete it on next login. This is intentional —
   their profile data from the account page is preserved, and they can skip steps.
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS learning_style text;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS study_goals text;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarded boolean NOT NULL DEFAULT false;
