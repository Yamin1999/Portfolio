---
title: Layer 2 Protocol Development for Carrier Ethernet Switches
summary: Design, implementation and maintenance of Layer 2 features - ERPS ring protection, MSTP, LLDP, CFM/OAM, VLAN and SNMP - on ARM-based carrier Ethernet switches, against IEEE and ITU-T standards.
category: Networking & Protocols
context: professional
organization: Shanghai BDCOM
role: Software Engineer (R&D)
started: 2023-04-01
ended: 2026-07-31
ongoing: false
tech:
  - C
  - Embedded C
  - Embedded Linux
  - VxWorks
  - ARM
  - Wireshark
  - Scapy
  - GDB
standards:
  - ITU-T G.8032
  - IEEE 802.1Q
  - IEEE 802.1AB
  - IEEE 802.1ag
  - IEEE 802.1s
cover: /uploads/Screenshot from 2024-12-13 21-25-31.png
repo: ''
demo: ''
docs: ''
video: ''
confidentiality: Written at the level of protocol behaviour and engineering approach. Product internals, source and customer specifics remain confidential to the employer.
featured: true
order: 2
published: true
publishedAt: 2026-07-31
---

## Overview

Over three years I designed, implemented and maintained Layer 2 networking
features for ARM-based carrier Ethernet switches running embedded Linux and
VxWorks: ERPS (G.8032) ring protection, EAPS, MSTP, LLDP, CFM/OAM, VLAN handling
and SNMP instrumentation - each implemented against its IEEE or ITU-T
specification.

## Problem

Carrier Ethernet is unforgiving in a specific way: the equipment sits in someone
else's network, interoperating with someone else's boxes, and it is judged on
behaviour during failures rather than behaviour when everything works. Two
constraints follow.

**Interoperability is defined by the document, not by the peer.** If a competitor's
switch and ours disagree about a timer or a state transition, the standard
decides who is wrong. Reading specifications precisely is the core skill, not a
preliminary to the work.

**Convergence time is the product.** A ring that heals in tens of milliseconds and
a ring that heals in seconds are different products at different prices. Every
implementation decision on the failure path is a decision about that number.

## Approach

The protocols share a shape: a state machine driven by received PDUs, expiring
timers and hardware link events, whose outputs are forwarding-database changes
and port state changes.

Working from that shape, my approach was consistent across features:

1. **Read the specification first and model the state machine explicitly** -
   states, events, transitions and timers written down before code, so the
   implementation could be checked against the document rather than against
   intuition.
2. **Keep the protocol logic separate from the hardware abstraction layer**, so
   the same state machine could be reasoned about independently of the switching
   silicon underneath it.
3. **Treat link-event handling as event-driven, not polled.** The failure path
   begins with a hardware notification, and any polling interval on that path
   becomes a floor on convergence time.

## Implementation

Recurring engineering concerns across these features:

- **PDU parsing and construction.** Protocol frames are packed structures with
  defined bit layouts and network byte order. Structure packing, explicit
  byte-order conversion and careful type handling are constant work; a field read
  at the wrong offset produces a switch that mostly works and occasionally does
  something inexplicable.
- **Timer discipline.** Standards specify hold-off, guard and wait-to-restore
  timers with real semantics. Guard timers exist to suppress stale PDUs during
  topology change, and a guard timer implemented as "roughly this long" produces
  intermittent flapping that is extremely hard to attribute later.
- **Ring protection state.** G.8032's value is that the ring protection link is
  blocked in the idle state and unblocked on failure, so the topology is
  loop-free at every instant. The implementation work is making sure the FDB is
  flushed at exactly the right point in the transition - too early and traffic is
  black-holed, too late and it loops.
- **64-bit counters and statistics.** SNMP-visible counters must be monotonic and
  wrap correctly, which is a real source of low-level bugs on 32-bit-oriented
  code paths.

## Debugging

This is where most of the time went, and where the useful skills live.

- **Wireshark** for protocol conformance: capture both sides of an
  interoperability failure and the disagreement is usually visible in a single
  field of a single PDU.
- **Scapy** for crafting PDUs by hand - the fastest way to drive a state machine
  into a transition that is awkward to reach with real equipment, including
  malformed frames to confirm the parser rejects them safely.
- **trace-cmd, ftrace and KernelShark** for timing questions. When convergence
  is slower than expected, the question is _where the time went_ between the
  hardware notification and the port state change, and a kernel trace answers it
  directly instead of by inference.
- **GDB** for the low-level faults - pointer and memory issues, packed-structure
  misreads, and byte-order mistakes.

## Results

- Standards-compliant Layer 2 feature set shipping in production carrier
  Ethernet switches.
- Interoperability issues diagnosed and resolved against third-party equipment,
  with root causes identified from packet captures rather than guesswork.
- Measurable improvements to stability and convergence behaviour through kernel
  tracing and performance analysis of the failure path.

## Lessons learned

Reading the specification carefully is faster than debugging. A significant share
of the hard problems I saw traced back to a clause that had been skimmed - a
timer's exact start condition, or precisely which event triggers an FDB flush.
The document is dense, but it is dense because the failure modes are subtle, and
an afternoon spent with it routinely saved a week of packet captures.
