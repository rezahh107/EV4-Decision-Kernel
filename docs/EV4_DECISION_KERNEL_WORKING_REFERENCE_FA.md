# سند مرجع کاری EV4 Decision Kernel

## هسته تصمیم‌گیری Elementor V4، پوشش رفتاری، و مرز UX اجرای Builder

**نسخه:** 0.1.0-working-reference  
**تاریخ ثبت وضعیت:** 7 July 2026  
**وضعیت:** مرجع کاری؛ نه معماری نهایی، نه Roadmap اجرایی نهایی  
**مخاطب:** مدل‌های زبانی، توسعه‌دهندگان، بازبین‌های فنی، و مالکان ریپوهای EV4  
**هدف:** ثبت فشرده و عملیِ جهت معماری، مرز نقش‌ها، ریسک‌ها، MVK، و تصمیم‌های باز برای شروع امن ریپوی Kernel.

---

## 0. روش خواندن سند

این سند چهار نوع گزاره را جدا می‌کند:

```text
[یافته ریپو]
  از فایل‌ها، schemaها، protocolها یا READMEهای فعلی EV4 استخراج شده است.

[یافته رسمی]
  با مستندات رسمی Elementor، Elementor Developers، GitHub Docs یا منبع رسمی مشابه تطبیق داده شده است.

[روش پیشنهادی]
  بهترین مسیر فعلی تحلیل است، ولی هنوز تصمیم قطعی پروژه نیست.

[تصمیم باز]
  موضوعی که باید با ADR، prototype، fixture یا توافق مالکین ریپوها نهایی شود.
```

اصل ستون فقرات:

```text
Documented capability
!= Enabled in target project
!= Allowed for current user
!= Correct design choice
!= Constructability proven
!= Exact UI path proven
!= Builder executed
!= Responsive validated
!= Production ready
```

---

# 1. حکم معماری فعلی

تصمیم فعلی:

```text
MODIFY_ARCHITECTURE
```

معماری مرکزی رد نمی‌شود، اما باید کوچک‌تر و سخت‌گیرانه‌تر شروع شود.

پذیرفته می‌شود:

```text
- central Kernel concept
- local profile without rule fork
- MVK-first approach
- vendored/pinned snapshot before releases
- local CI wrapper before reusable workflow
- Project Gate as verifier, not domain owner
```

به تعویق می‌افتد:

```text
- full release automation
- reusable workflow centralization
- docs monitoring
- migrations
- full control registry
- signed validation outputs
```

نیازمند ADR:

```text
- repo مستقل یا shared-contracts
- distribution model
- Project Gate boundary
- profile allowed content
- exact Builder-ready definition
```

---

# 2. مسئله اصلی

چالش EV4 کمبود دانش عمومی Elementor نیست. چالش این است که دانش رسمی، تصمیم طراحی، اثبات ساخت‌پذیری و اجرای واقعی هنوز باید به زنجیره‌ای واحد، قابل‌ردیابی و قابل‌رد شدن تبدیل شوند.

فرمول فعلی:

```text
Registry alone is a knowledge base.
Decision Pipeline turns it into a design engine.
CE Closure turns a proposal into a proven strategy.
Builder Resolution turns the strategy into safe actions.
Responsive validation turns execution into runtime evidence.
Project Gate turns evidence into controlled handoff.
```

---

# 3. نقش ریپوها

## 3.1 Architect

Architect مالک انتخاب طراحی است:

```text
visual role decomposition
-> candidate generation
-> comparison
-> selected architecture with reasons
-> decision records
```

Architect نباید ادعا کند:

```text
Builder executed
Responsive validated
Production ready
```

## 3.2 Constructability Engineer / CE

CE مالک اثبات و closure است:

```text
constructability proof
version and permission proof
control and unit feasibility
open decision count
Builder-ready authorization
```

قاعده مطلوب:

```text
Architecture decisions open = 0
Constructability decisions open = 0
Bounded execution details may remain
Runtime evidence may remain
```

## 3.3 Builder

Builder مالک execution resolution است، نه معماری:

```text
selected locked decision
-> exact control
-> value
-> unit
-> class
-> state
-> viewport
-> UI path
-> safe action
```

Builder اگر evidence یا control ندارد:

```text
ask evidence
or request repair
or enter CORRECTION
never guess
```

## 3.4 Responsive

Responsive مالک runtime validation است:

```text
Viewport × State × Input Method × Direction
```

و باید مقدارها را با provenance ببیند:

```text
explicit
inherited
overridden
reset
default
unknown
```

## 3.5 Project Gate

Project Gate مالک acceptance envelope است:

```text
lineage
schema validity
evidence completeness
registry version/hash
stage authority
ownership
```

Project Gate نباید تشخیص دهد SVG بهتر است یا Image، یا Flex بهتر است یا Grid.

## 3.6 Workbook

Workbook منبع آموزشی و rule inspiration است:

```text
workbook_derived
!= official Elementor capability
```

Workbook-derived rules باید یا `proposed` بمانند یا با fixture/experiment/official source تقویت شوند.

---

# 4. Decision Kernel چندلایه

## 4.1 Canonical Capability Registry

پاسخ می‌دهد:

```text
Elementor چه capabilityهایی دارد؟
```

حداقل فیلدهای آینده:

```yaml
feature_id:
official_name:
category:
official_sources:
version_context:
last_verified_at:
dependencies:
known_limitations:
permission_requirements:
pro_dependency:
evidence_requirements:
```

## 4.2 Element Registry

پاسخ می‌دهد:

```text
Element واقعی چیست و چه نقش و محدودیتی دارد؟
```

MVK element set:

```text
Div Block
Flexbox
Grid
Heading
Paragraph
Button
Image
SVG
```

## 4.3 Control-Level Registry

پاسخ می‌دهد:

```text
روی این Element، کدام Control با چه Value type و Unit واقعی وجود دارد؟
```

اما full control registry در MVK ساخته نمی‌شود. در MVK فقط shape و چند نمونه محدود لازم است.

## 4.4 Decision Rule Registry

این لایه capability رسمی نیست. این لایه ruleهای تصمیم را نگه می‌دارد:

```text
simple wrapper/scope -> Div Block candidate
one-dimensional layout -> Flexbox candidate
two-dimensional alignment -> Grid candidate
repeated value -> Variable candidate
repeated style package -> Global Class candidate
repeated structure -> Component candidate
```

هر rule باید origin داشته باشد:

```yaml
rule_origin: official | workbook_derived | project_derived | controlled_experiment
rule_status: proposed | fixture_validated | accepted
```

## 4.5 Project Environment Profile

هر run باید محیط را جدا کند:

```yaml
wordpress_version:
elementor_version:
elementor_pro_version:
editor_v4_enabled:
atomic_elements_enabled:
relevant_feature_flags:
user_role:
class_permissions:
component_permissions:
variable_permissions:
custom_breakpoints:
site_direction:
active_theme:
relevant_plugins:
dynamic_data_sources:
```

## 4.6 Capability Use Ledger

```yaml
capability_use_id:
feature_id:
registry_version:
registry_hash:
node_id:
control_id:
architect_decision_ref:
ce_decision_ref:
builder_execution_ref:
responsive_validation_ref:
evidence_refs:
unresolved_risks:
gate_status:
```

---

# 5. Evidence Model

Evidence باید سه‌محوره باشد.

## 5.1 Source class

```text
official_elementor_help
official_elementor_developer_docs
elementor_release_notes
css_spec
mdn_reference
project_export
real_editor_capture
frontend_runtime
browser_computed_style
controlled_experiment
workbook_derived
user_input
```

## 5.2 Support status

```text
supported
partially_supported
contradicted
insufficient_evidence
proposed
deprecated
version_sensitive
```

## 5.3 Verification scope

```text
platform_capability
developer_api_capability
editor_v4_ui
project_availability
constructability
builder_execution
responsive_runtime
production_readiness
```

نمونه:

```yaml
evidence:
  source_class: official_elementor_help
  support_status: supported
  verification_scope: platform_capability
```

این نمونه فقط platform capability را ثابت می‌کند، نه project availability.

---

# 6. Behavioral Rule Coverage

LLM prompt/protocol repositories باید به‌عنوان behavioral source code دیده شوند.

یک rule مهم اگر فقط در prose باشد، enforce نشده است.

اصطلاح:

```text
EFBG = Enforcement-Free Behavioral Gate
```

برای ruleهای Critical و High، هدف این زنجیره است:

```text
Concept
  -> Canonical schema field
  -> Minimum semantic children
  -> Validator rule
  -> Valid fixture
  -> Invalid fixture
  -> CI enforcement
  -> Downstream rejection
```

MVK باید فقط Critical/High rules را track کند. tone، formatting و low-risk guidance نباید وارد coverage matrix شوند.

نمونه ruleهای MVK:

```text
R-MVK-001 Builder must not invent architecture
R-MVK-002 CE closure required before Builder-ready package
R-MVK-003 Selected candidate must remain locked
R-MVK-004 Approved classes must not be added/removed by Builder
R-MVK-005 Absolute positioning requires containing-block proof
R-MVK-006 Nested clickable topology is rejected
R-MVK-007 Exact UI path requires evidence
R-MVK-008 Project Gate rejects missing kernel pin/hash
R-MVK-009 production_ready cannot be true without QA evidence
```

Critical rule با status زیر open enforcement gap است:

```text
prose_only
schema_backed
```

---

# 7. UX Boundary

UX rules برای کاربر مهم‌اند، اما نباید با Kernel domain logic قاطی شوند.

UX سند باید بیشتر در Builder-facing protocols استفاده شود:

```text
- active silence after confirmation
- fixed output templates
- UI Vocabulary Sync
- screenshot request template
- evidence request template
- correction flow
- Escape Hatch after repeated failure
- No Hidden State Claim
```

Kernel domain logic باید مستقل بماند:

```text
- absolute containing block proof
- nested link rejection
- CE closure required
- schema/semantic/runtime separation
- Builder cannot invent architecture
```

قانون:

```text
UX guidance improves interaction.
Kernel contracts enforce decision safety.
Do not mix them into one undifferentiated prompt document.
```

---

# 8. Design Resolution Pipeline

نام پیشنهادی کامل:

```text
EV4 Design Resolution Pipeline
```

تصمیم‌های حساس:

```text
Element
-> Control
-> Property
-> Value strategy
-> Unit
-> Position
-> Containing block
-> Class target
-> State
-> Viewport
-> Fallback
-> Verification
```

این pipeline باید hybrid باشد:

```text
LLM:
  role/intent understanding, candidate generation, tradeoff explanation.

Deterministic code:
  registry lookup, hard constraints, evidence completeness, schema validation.

Runtime evidence:
  UI path proof, control availability, frontend/computed style proof.
```

---

# 9. Decision Records

## 9.1 Element Decision Record

```yaml
element_decision_record:
  decision_id:
  node_id:
  candidates: []
  selected_element_id:
  selected_generation:
  decision_path: []
  selection_reason: []
  rejected_alternatives: []
  required_capabilities: []
  required_controls: []
  evidence_refs: []
  unresolved_questions: []
```

## 9.2 Position Decision Record

```yaml
position_decision_record:
  decision_id:
  node_id:
  candidates: []
  selected_position:
  containing_block_ref:
  overflow_dependencies:
  responsive_projection_ref:
  rejected_positions: []
```

## 9.3 Value/Unit Decision Record

```yaml
value_unit_decision_record:
  decision_id:
  node_id:
  control_id:
  property:
  value_strategy:
  candidate_units: []
  selected_unit:
  value_source:
  responsive_scope:
  reversibility:
  evidence_refs: []
```

## 9.4 CE Decision Closure

```yaml
ce_decision_closure:
  closure_id:
  architect_decision_refs: []
  constructability_status: proven | blocked | insufficient_evidence
  architecture_decisions_open:
  constructability_decisions_open:
  bounded_execution_details_open: []
  runtime_evidence_open: []
  builder_ready: true | false
  repair_route_if_blocked:
```

## 9.5 Builder Execution Resolution

```yaml
builder_resolution_result:
  action_id:
  target_node:
  selected_element_id:
  decision_ref:
  ce_closure_ref:
  control_resolution:
    control_id:
    ui_evidence_status:
    exact_path_allowed:
  value_unit_resolution:
    value_strategy_ref:
    unit_policy_id:
    value_source:
    responsive_scope:
    safe_to_emit:
  position_resolution:
    position_decision_ref:
    relative_parent_proof:
  decision: emit_action | ask_for_ui_evidence | request_ce_repair | request_architect_repair | enter_correction
```

---

# 10. Hard Gates for MVK

## 10.1 Builder must not invent architecture

Missing upstream decision must route to repair/evidence request.

## 10.2 CE closure required

Builder-ready package without CE closure is invalid.

## 10.3 Absolute containing block proof

Absolute positioning requires proof of a positioned containing block.

## 10.4 Nested clickable topology rejected

Clickable ancestor + clickable descendant must be invalid unless a documented exception is explicitly proven.

## 10.5 Exact UI path requires evidence

Official docs prove platform capability; current UI screenshot, direct user statement, installed-version evidence, or applicable official docs are needed for executable UI paths.

## 10.6 Responsive provenance required

Desktop evidence must not silently become Tablet/Mobile validity.

## 10.7 Project Gate verifies, not designs

Project Gate rejects missing lineage/hash/evidence but must not choose an Elementor design.

---

# 11. Distribution Strategy

Recommended staged strategy:

```text
Wave 1:
  vendored/pinned snapshot + hash

After vertical slice:
  GitHub Release artifact + pin + hash

Later:
  reusable workflow with commit SHA
```

Local profiles must remain small:

```text
decision-kernel-profile/
├── KERNEL_PIN.json
├── profile.yaml
├── adapter-map.yaml
├── local-ci-wrapper.*
└── README.md
```

Profile must not fork rule logic.

---

# 12. Minimum Viable Kernel

Smallest useful MVK:

```text
1. Evidence model
2. Kernel pin schema
3. Core element IDs:
   Div Block, Flexbox, Grid, Heading, Paragraph, Button, Image, SVG
4. Core constraints:
   nested links
   absolute containing block
   responsive provenance
5. Element Decision Record schema
6. Position Decision Record schema
7. Value/Unit Decision Record schema
8. CE Closure schema
9. Builder Resolution schema
10. Project Gate Acceptance Packet schema
11. Valid/invalid fixtures
12. One validator script/CLI
```

---

# 13. Vertical E2E Slice

One small section:

```text
Root wrapper: Div Block or Flexbox
Content: Heading + Paragraph + Button
Media: Image or SVG decision
Position case: decorative SVG absolute inside relative parent
Responsive case: desktop explicit, tablet inherited, mobile override or unknown
Negative fixture: absolute without relative parent
Negative fixture: clickable card + clickable button nested link
```

Target proof:

```text
Architect produces decision records
-> CE closes decisions
-> Builder resolves only locked decisions
-> Responsive validates one runtime/responsive record
-> Project Gate rejects incomplete package and accepts complete package
```

---

# 14. Repair Routing

Every blocked state must name the owner.

```yaml
repair_route:
  missing_semantic_role: architect
  missing_element_selection: architect
  missing_architecture_family: architect
  missing_constructability_proof: ce
  missing_control_mapping: ce
  missing_current_ui_path: builder_evidence_request
  unsupported_unit_in_current_ui: ce_or_builder_repair
  responsive_runtime_failure: responsive
  architecture_runtime_conflict: architect
  package_integrity_failure: project_gate
```

---

# 15. Wave Plan

## Wave 0 — Governance and ADRs

Create ADRs and MVK planning artifacts only.

## Wave 1 — Shared contracts and evidence model

Create evidence model, registry envelope, MVK coverage, pin shape, and fixtures.

## Wave 2 — Architect decision records

Create Element/Position/Value decision record contracts and fixtures.

## Wave 3 — CE closure

Create CE closure contract and open-decision counting.

## Wave 4 — Builder resolution

Create Builder Resolution Gate, locked decision fields, fallback policy, and repair routing.

## Wave 5 — Responsive and Project Gate validation

Create runtime validation record and Gate acceptance packet.

---

# 16. Decisions Still Open

```text
1. Independent repo vs shared-contracts final governance.
2. Exact distribution model after MVK.
3. Exact ID namespace.
4. Exact Builder-ready definition.
5. Full control registry scope.
6. Release automation timing.
7. Reusable workflow timing.
8. Official-doc monitoring timing.
9. Migration/deprecation policy.
10. Signed validation output policy.
```

---

# 17. Final Working Principle

```text
Kernel defines the rules.
Architect makes traceable choices.
CE proves and closes choices.
Builder resolves and executes locked choices.
Responsive validates runtime behavior.
Project Gate accepts only complete, pinned, evidence-backed handoffs.
```

This document is the starting reference for Wave 0. It must not be treated as a complete implementation patch.