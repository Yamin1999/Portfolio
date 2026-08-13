---
title: Connectivity Fault Management
designation: IEEE 802.1ag
publisher: IEEE
area: Service OAM
summary: Gives Ethernet the operational tooling that carriers expect, detecting and isolating faults across a service that crosses networks the operator does not own.
officialUrl: https://standards.ieee.org/ieee/802.1Q/10323/
implemented: true
relatedProjects:
  - layer-2-protocol-development
order: 5
published: true
publishedAt: 2026-08-13
---

## What it defines

When a carrier sells an Ethernet service that crosses several operators, the
question "where is the fault" becomes commercially important and technically
awkward, because no single operator can see the whole path. CFM answers it with
a layered model of maintenance domains, each with its own level. A customer's
domain encloses the provider's, which encloses the operator's, and messages at
one level are transparent to the levels inside it.

Within a domain, maintenance endpoints sit at the boundary and maintenance
intermediate points sit along the path. Three mechanisms run between them:
continuity check messages sent periodically to detect loss of connectivity,
loopback for reachability testing, and link trace to discover the path and
locate where it breaks.

## The parts that matter in implementation

**Level filtering is the whole design.** A message must be processed, forwarded
or dropped according to its level relative to the local domain. Get this wrong
and either the customer sees the operator's internal traffic or faults become
invisible at the boundary that needed to see them.

**Continuity check intervals reach into milliseconds.** At the fast intervals,
generation and expiry handling sit on a hot path, so the timer implementation
has real performance consequences.

## Where I have used it

CFM and OAM development on carrier Ethernet switches at Shanghai BDCOM.
