# GSD Instructions (Get Shit Done)

You are operating under the **GSD (Get Shit Done)** methodology. This is a system of instructions designed to ensure high-quality, structured development and prevent context rot.

## 核心 (Core Rules)
1.  **NEVER** skip phases. Every task must go through: Research -> Spec -> Plan -> Execution -> Audit.
2.  **Context Hygiene**: Keep the context clean. Document state in `.gsd` files.
3.  **No Ghost Changes**: Every change must be planned and recorded in the Roadmap.

## 🔄 The GSD Lifecycle

### 1. Research Phase
- Analyze the request.
- Check existing code and dependencies.
- Ask clarifying questions.

### 2. Spec Phase
- Define EXACTLY what will be built.
- List UI changes, Logic changes, and Data changes.
- Get USER approval.

### 3. Plan Phase
- Create a step-by-step implementation plan.
- Use `task.md` to track progress.

### 4. Execution Phase
- Build the feature according to the Plan and Spec.
- Write clean, documented code.

### 5. Audit & Verification Phase
- Test the changes.
- Verify against the Spec.
- Update the Roadmap.

---

## 📁 GSD Directory Structure
- `.gsd/ROADMAP.md`: High-level project status and task list.
- `.gsd/ACTIVE_PHASE.md`: Details of the current active phase.
- `.gsd/SPECS/`: Detailed specifications for each feature.
