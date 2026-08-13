---
title: Link Layer Discovery Protocol
designation: IEEE 802.1AB
publisher: IEEE
area: Topology discovery
summary: A one way advertisement protocol that lets each device tell its neighbours what it is and which port it is speaking from, building a physical topology map without any configuration.
officialUrl: https://standards.ieee.org/ieee/802.1AB/6047/
implemented: true
relatedProjects:
  - layer-2-protocol-development
order: 4
published: true
publishedAt: 2026-08-13
---

## What it defines

LLDP is deliberately simple. Each device periodically sends a frame to a
reserved multicast address describing itself: chassis identifier, port
identifier, time to live, and any optional details it chooses to include. There
is no negotiation, no session and no acknowledgement. Neighbours store what they
receive and discard it when the advertised time to live expires.

That one way design is the point. It means a device can be dropped into a
network and immediately be discoverable, which is how management systems build a
physical topology map without anyone typing in a cable schedule.

## The parts that matter in implementation

**The payload is a TLV chain.** Each element carries a 7 bit type and a 9 bit
length packed into two bytes. Parsing means bit masking, not struct casting, and
every length has to be validated against the remaining buffer before the value
is read. An unchecked length here is a straightforward buffer overrun on data
that arrived from the wire.

**Expiry is as important as reception.** Neighbour entries must age out when the
advertised time to live passes, or the management system keeps showing links
that were unplugged hours ago.

**Optional TLVs are genuinely optional.** A conformant implementation cannot
assume a vendor sent the ones it finds convenient.

## Where I have used it

LLDP development on carrier Ethernet switches at Shanghai BDCOM.
