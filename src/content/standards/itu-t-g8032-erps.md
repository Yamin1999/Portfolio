---
title: Ethernet Ring Protection Switching
designation: ITU-T G.8032
publisher: ITU-T
area: Layer 2 protection switching
summary: Defines how an Ethernet ring stays loop free in normal operation and recovers within tens of milliseconds when a link fails.
officialUrl: https://www.itu.int/rec/T-REC-G.8032
implemented: true
relatedProjects:
  - layer-2-protocol-development
order: 1
published: true
publishedAt: 2026-08-13
---

## What it defines

G.8032 makes ring topologies usable in Ethernet. A ring is a loop, and Ethernet
frames carry no TTL, so a broadcast entering an unprotected ring circulates
until it saturates the link. G.8032 resolves this by designating one link the
Ring Protection Link (RPL) and blocking it during normal operation, so the ring
is physically a ring but logically a line.

When a link fails elsewhere, that failure becomes the break in the loop, so the
RPL unblocks and traffic has a path again. There is always exactly one break.

## The parts that matter in implementation

**Ordering of the recovery sequence.** Nodes adjacent to the failure block the
failed port, signal the ring, every node flushes its filtering database, and only
then does the RPL owner unblock. Flush too late and traffic is black holed;
flush too early and nodes relearn stale entries from frames still in flight.

**Timers with real semantics.** The hold off timer defers reporting so a lower
layer can fix the problem first. The guard timer suppresses stale ring messages
during a state change, which is a race condition the standard exists to prevent.
Wait to restore stops a flapping link from switching the ring back and forth.

**Detection must be event driven.** Recovery starts from a hardware link down
notification. Any polling interval on that path becomes a floor on convergence
time, which is the number the product is sold on.

## Where I have used it

Implemented and maintained ERPS on ARM based carrier Ethernet switches at
Shanghai BDCOM, including interoperability debugging against third party
equipment using packet captures and kernel tracing.
