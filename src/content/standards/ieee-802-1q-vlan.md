---
title: VLAN Bridging
designation: IEEE 802.1Q
publisher: IEEE
area: Layer 2 bridging
summary: The base bridging standard. Defines the VLAN tag, how bridges learn and forward, and the behaviour every other Layer 2 feature builds on.
officialUrl: https://standards.ieee.org/ieee/802.1Q/10323/
implemented: true
relatedProjects:
  - layer-2-protocol-development
order: 2
published: true
publishedAt: 2026-08-13
---

## What it defines

802.1Q is the document everything else on a switch refers back to. It specifies
the 4 byte VLAN tag inserted after the source MAC address, carrying a 12 bit
VLAN identifier, a 3 bit priority field and the drop eligible indicator. It also
specifies the forwarding process itself: how a bridge learns source addresses
into the filtering database, how it looks up a destination, and what it does
when the lookup misses.

Later revisions absorbed the spanning tree protocols and the bridge management
model, so the single document now covers far more than tagging.

## The parts that matter in implementation

**The tag is a packed structure on the wire.** Reading the VLAN identifier means
masking 12 bits out of a 16 bit field in network byte order. Getting the offset
or the endianness wrong produces a switch that forwards most frames correctly
and occasionally does something inexplicable.

**Ingress, forwarding and egress rules are separate steps.** Acceptable frame
types, ingress filtering, the member set and the untagged set each apply at a
defined point. Treating them as one step is a common source of interoperability
bugs.

**The filtering database is shared state.** Every protocol that changes topology,
spanning tree and ring protection alike, has to flush it correctly.

## Where I have used it

VLAN handling on carrier Ethernet switches at Shanghai BDCOM, alongside the
spanning tree and ring protection features that depend on it.
