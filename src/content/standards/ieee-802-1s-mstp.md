---
title: Multiple Spanning Tree Protocol
designation: IEEE 802.1s
publisher: IEEE
area: Loop prevention
summary: Extends spanning tree so groups of VLANs can follow different topologies, instead of forcing every VLAN onto one tree and idling half the links.
officialUrl: https://standards.ieee.org/ieee/802.1Q/10323/
implemented: true
relatedProjects:
  - layer-2-protocol-development
order: 3
published: true
publishedAt: 2026-08-13
---

## What it defines

Classic spanning tree computes one loop free topology for the whole bridged
network. That is safe but wasteful: every link blocked by the tree carries no
traffic at all, regardless of which VLAN it would have carried.

MSTP maps VLANs to Multiple Spanning Tree Instances. Each instance computes its
own topology, so a link blocked for one instance can forward for another. The
result is loop freedom per instance and considerably better link utilisation.

## The parts that matter in implementation

**Region membership is exact.** Two bridges are in the same MST region only if
the configuration name, revision level and the VLAN to instance mapping table
all match. The mapping is compared as a digest, so a single differing VLAN puts
a neighbour in a different region and silently changes the topology. This is one
of the most common field misconfigurations and it looks like a protocol bug.

**The mapping table is state that must stay consistent** across every bridge in
the region, which makes configuration handling as important as the protocol
logic itself.

**Convergence still hinges on database flushing** at the right point in each
instance's transition, exactly as with ring protection.

## Where I have used it

MSTP development on carrier Ethernet switches at Shanghai BDCOM.
