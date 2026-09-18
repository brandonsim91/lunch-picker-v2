# Lunch Picker V2

A 2026 rebuild of **Lunch Picker**, a lightweight lunch decision tool for Samsung SDS colleagues working around Mapletree Business City (MBC), Singapore.

## Why this exists

Lunch Picker started in 2025 as a small web tool built to solve a recurring problem among colleagues: deciding where to eat lunch without spending too much time debating the same options.

V2 revisits the same problem with a clearer product model and cleaner architecture.

The goal is simple:

> Help an SDS colleague or lunch group make a suitable lunch decision in under 30 seconds.

## Core user journey

```text
Open Lunch Picker
→ choose today's constraints
→ get a short list of suitable places
→ pick one
→ open it in Google Maps
```

If nobody wants to decide:

```text
JUST PICK SOMETHING
→ Lunch Picker chooses for the group
```

## Product principles

- Fast enough to use during the actual lunch rush
- Useful for one person or a group
- Prefer simple deterministic logic over unnecessary AI
- Make restaurant data maintainable instead of hard-coding it into the interface
- Reduce repetitive decision-making without removing user choice
- Keep the experience lightweight and slightly playful

## V2 scope

Initial filters may include:

- walking time / distance
- price range
- cuisine
- quick lunch
- healthier option
- something new
- indoor / outdoor
- recent visits

The first release will focus on **MBC and nearby lunch options**.

## Project status

**Current phase: Product definition and data modelling**

Before implementation, the project is defining:

1. product problem and success criteria
2. restaurant data schema
3. decision rules
4. minimum viable user journey
5. technical architecture

See:

- [Product Brief](docs/PRODUCT_BRIEF.md)
- [Restaurant Data Model](docs/RESTAURANT_DATA_MODEL.md)

## History

The original 2025 prototype is preserved separately at:

**brandonsim91/Lunch-Picker**

V1 was a static HTML/CSS/JavaScript application using a manually maintained restaurant array and random selection.

V2 is intentionally a separate repository so the evolution in product thinking and implementation can remain visible.
