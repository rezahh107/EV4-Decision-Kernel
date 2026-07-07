# Builder UX Response Boundary

**Version:** 0.1.0  
**Status:** draft / Builder-facing UX boundary  
**Scope:** user-facing LLM response UX for EV4 Builder-like task-guidance systems  
**Not a Kernel domain-rule registry**

---

## 1. Purpose

This document defines how UX-response guidance from the EV4 LLM UX reference should be used in the Decision Kernel ecosystem.

It prevents two mistakes:

```text
1. Putting UX tone/format rules inside domain validation logic.
2. Ignoring UX rules in Builder sessions, causing drift, verbosity, hidden-state claims, or unsafe UI instructions.
```

---

## 2. Boundary Rule

```text
Kernel contracts enforce decision safety.
Builder UX rules improve user-facing execution reliability.
Do not merge them into one undifferentiated prompt document.
```

Kernel owns:

```text
- evidence model
- decision records
- CE closure requirements
- Builder resolution contract
- hard gates
- pin/hash/lineage expectations
- behavioral rule coverage for Critical/High rules
```

Builder UX owns:

```text
- user-facing batch template
- status template
- correction template
- screenshot request template
- active silence after confirmation
- UI vocabulary sync
- evidence request wording
- Escape Hatch after repeated failure
- no hidden-state claims
```

---

## 3. Core UX Principles for Builder-like Agents

### 3.1 Smart Information Filtering

Show fields only when they tell the user what to do.

Hide internal fields from normal output:

```text
element_generation_source
evidence_status raw value
internal_reason
hidden_state
reasoning_trace
```

Show technical identifiers only when actionable:

```text
class names
file paths
confirmation tokens
schema IDs when in technical review
control names when the user must find them
```

### 3.2 Active Silence

After a normal confirmation, do not explain the checkpoint loop.

```text
تأیید شد ✓ — ادامه می‌دهیم.
```

Then proceed only if the workflow state allows it.

### 3.3 UI Vocabulary Sync

Do not assume the user’s Elementor UI labels from training data.

Preferred evidence order:

```text
1. screenshot
2. direct user statement
3. installed-version evidence
4. official documentation
5. inference only — not executable
```

### 3.4 Evidence Honesty

If a UI path, control, state, or responsive option is not verified, do not issue a confident executable instruction.

Use:

```text
این کنترل ممکن است در نسخه شما نام یا جای متفاوتی داشته باشد.
اگر نمی‌بینی، screenshot از پنل بفرست.
```

Do not use:

```text
حتماً برو به Advanced > ...
```

unless evidence supports that exact path for the target context.

### 3.5 Escape Hatch

After two repeated failures on the same action, do not repeat the same instruction a third time.

Required behavior:

```text
- stop normal build flow
- identify last safe checkpoint
- preserve confirmed items
- offer a recovery route or ask for targeted evidence
```

### 3.6 No Hidden State Claim

If no real persistent storage exists, never say:

```text
ذخیره کردم
در حافظه دائمی ثبت شد
در metadata داخلی ذخیره شد
```

Allowed phrases:

```text
در همین session نگه می‌دارم.
در خلاصه session ثبت می‌کنم تا دفعه بعد paste کنی.
```

---

## 4. Output Templates

### 4.1 Operational Batch

```text
موقعیت: [لایه اول] ← [لایه دوم] ← [اینجا]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
اقدام [N] — [نام کوتاه و فعل‌محور]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
هدف:                [نام عنصر / مسیر]
داخل:               [نام والد]
نوع عنصر:           [label واقعی در UI کاربر]
نام در پنل:         [نامی که کاربر باید وارد کند]
کلاس Elementor:     [class name بدون dot]
محل ثبت:            Local Classes | Global Classes
تغییر نده:          [محدوده ممنوع]
نتیجه مورد انتظار: [چیزی که باید ببیند]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

بعد از انجام بنویس: [token تایید]
اگه مشکل داشتی: «اصلاح» + توضیح کوتاه
```

Do not include internal metadata in visible-only deployments.

### 4.2 Status Report

```text
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
وضعیت session
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
حالت: [workflow_mode]
وضعیت: [runtime_state]
نقطه بازگشت: [last_safe_checkpoint]
دسته فعلی: [batch_id]

تمام‌شده:
✓ ...

در انتظار:
○ ... ← الان اینجاییم

هشدارهای فعال: [ندارد / لیست]
ایمن برای ادامه: بله / خیر
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Status response must not start a new build batch.

### 4.3 Correction

```text
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
اصلاح — [نوع مشکل]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
مشکل: [یک جمله]
وضعیت فعلی: [چیزی که کاربر دیده یا گزارش کرده]
آنچه هنوز معتبر است: [موارد درست]
قدم بعدی: [یک قدم کوچک]

برای ادامه:
screenshot از [هدف دقیق] بفرست
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 4.4 Targeted Screenshot Request

```text
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
هدف تصویر
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
عنصر انتخابی: [نام عنصر]
چه چیزی دیده شود: [کنترل/پنل/قسمت لازم]
کلاس فعال: [اگر لازم است]
پنل/تب: [نام پنل]
محدوده برش: [کجا crop شود]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 5. Integration With Kernel MVK

This UX boundary supports, but does not replace, these Kernel MVK contracts:

```text
Builder Resolution Result
UI path evidence status
Repair Route Record
Behavioral Rule Coverage
CE Closure
Project Gate Acceptance Packet
```

Example:

```text
Kernel rule:
  Exact UI path requires evidence.

Builder UX behavior:
  If evidence is missing, ask for a targeted screenshot using the screenshot request template.
```

---

## 6. What Must Not Be Done

Do not:

```text
- use UX templates as proof that a decision is constructible
- treat user-facing wording as evidence
- allow a polished UX response to hide missing CE closure
- emit hidden/internal metadata in visible-only environments
- let Builder continue after missing UI control without evidence or repair
```

---

## 7. Stress Tests for Builder UX

Minimum future tests:

```text
Silence Test:
  five confirmations in a row must stay short and controlled.

Vocabulary Drift Test:
  if UI label differs from known_control_map, Builder must verify instead of using training-data labels.

Hidden State Claim Test:
  if no real storage exists, Builder must not claim persistent memory.

Internal Metadata Leak Test:
  normal output must not expose hidden_state, raw evidence_status, or internal_reason.

Escape Hatch Test:
  after two repeated failures, Builder must not repeat the same instruction again.
```

---

## 8. Current Use

This document is a boundary reference for future Builder profile work.

It should not be used to create Kernel domain schemas directly, except where UX behavior needs a schema carrier such as:

```text
known_control_map
ui_evidence_status
repair_route
last_safe_checkpoint
confirmation_token
```