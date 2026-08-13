---
title: OAM Functions and Mechanisms for Ethernet Based Networks
designation: ITU-T Y.1731 (G.8013)
publisher: ITU-T
area: Service OAM and performance monitoring
summary: The measurement half of Ethernet OAM. Defines how loss, delay and delay variation are measured across a service, and the fault signals that tell each layer what has gone wrong.
officialUrl: https://www.itu.int/rec/T-REC-Y.1731
document: /reports/oam-learning-report.pdf
documentLabel: Y.1731 OAM learning report (PDF)
documentPages: 23
documentThumb: /reports/thumbs/oam-learning-report.webp
implemented: true
relatedProjects:
  - layer-2-protocol-development
order: 6
published: true
publishedAt: 2026-08-13
---

## What it defines

802.1ag gives you connectivity fault management: is the service up, and where
does it break. Y.1731 adds the question a carrier actually gets paid on, which
is how well the service is performing. It shares the maintenance entity model,
so MEG levels, MEPs and MIPs mean the same thing in both documents, then layers
performance measurement and additional fault signalling on top.

## Performance monitoring

**Frame loss measurement (ETH-LM)** compares transmitted and received frame
counters between endpoints. Single ended uses a request and reply pair from one
MEP; dual ended has both endpoints advertising their counters continuously.

**Delay measurement (ETH-DM)** covers one way and two way. Two way needs no
clock synchronisation because the initiator times the round trip itself, which
is why it is the one usually deployed. One way gives a truer figure but requires
synchronised clocks at both ends.

**Synthetic loss measurement (ETH-SLM)** injects its own frames rather than
counting service traffic, so loss can be measured even on a quiet service.

## Fault management signals

Alarm indication signal (ETH-AIS) suppresses alarm storms by telling higher
levels that a fault has already been detected below. Locked signal (ETH-LCK)
distinguishes an administrative lock from a genuine failure. Client signal fail
(ETH-CSF) propagates a client side failure across the network. Test signal
(ETH-Test) supports throughput and bandwidth verification.

## The part that matters in implementation

Counters have to be sampled at defined points relative to frame processing, or
the measurement is subtly wrong in a way no test will catch until a customer
disputes an SLA. Frame loss measurement is only as good as the agreement between
the two endpoints about what exactly was counted, and when.

## Where I have used it

OAM development on carrier Ethernet switches at Shanghai BDCOM. My learning
report on this specification is attached above.
