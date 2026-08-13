---
title: Ethernet Linear Protection Switching
designation: ITU-T G.8031 (Y.1342)
publisher: ITU-T
area: Point to point protection switching
summary: Protection for point to point Ethernet connections, defining the 1+1 and 1:1 architectures, the APS protocol that coordinates both ends, and when a switched service should revert.
officialUrl: https://www.itu.int/rec/T-REC-G.8031
document: /reports/itu-t-g8031-elps-overview.pdf
documentLabel: G.8031 ELPS overview (PDF)
documentPages: 17
documentThumb: /reports/thumbs/itu-t-g8031-elps-overview.webp
implemented: false
relatedProjects:
  - layer-2-protocol-development
order: 7
published: true
publishedAt: 2026-08-13
---

## What it defines

G.8032 protects a ring. G.8031 protects a point to point connection, which is
the other topology carriers sell. A working path carries the service and a
protection path stands by, and the standard specifies how the two ends agree on
which path is active.

## The two architectures

**1+1** bridges the traffic permanently onto both paths. The receiver simply
selects whichever it prefers, so recovery is a local decision and no signalling
is strictly required in the unidirectional case. The cost is that the protection
path carries a full copy of the traffic at all times.

**1:1** sends traffic on the working path only, leaving the protection path free
for lower priority traffic or idle. That is more efficient, but it means both
ends must agree before switching, so it depends on the APS protocol.

## Switching modes and reversion

**Unidirectional** switching lets each direction switch independently.
**Bidirectional** keeps both directions on the same path, which matters when a
service is being measured, because a delay figure taken across two different
physical paths is not a meaningful number.

**Revertive** operation returns to the working path once it recovers, after a
wait to restore period. **Non revertive** stays where it is. The trade is
between a predictable normal state and avoiding a second traffic hit purely for
tidiness.

## APS

The Automatic Protection Switching protocol carries request state, the requested
and bridged signal numbers, and flags for the architecture and mode in use.
Because both ends must agree, mismatched configuration produces a protection
scheme that appears to work until the moment it is needed.

## Status

Studied in detail, documented in the attached report. This is one I have read
closely rather than implemented in production.
