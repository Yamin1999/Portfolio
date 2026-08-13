---
title: Understanding ERPS Ring Protection
excerpt: Why a ring topology needs a deliberately blocked link, how G.8032 decides where to put it, and what actually happens in the milliseconds after a fibre is cut.
category: Networking
tech:
  - Ethernet
  - ERPS
  - G.8032
  - Layer 2
featured: true
published: true
publishedAt: 2026-08-12
---

Ring topologies are attractive to network operators for an obvious reason: every
node has two paths to every other node, so any single link failure still leaves
the network connected. They are also, in Ethernet, immediately fatal - because a
ring is a loop, and Ethernet has no TTL field.

A broadcast frame entering a ring with no loop prevention circulates forever,
gets duplicated at every node, and saturates the ring within milliseconds. This
is the broadcast storm, and it is why you cannot simply cable a ring of switches
together and call it redundant.

ITU-T **G.8032**, usually called ERPS (Ethernet Ring Protection Switching), is the
standard that makes rings usable.

## The core idea: block a link on purpose

ERPS resolves the loop the only way a loop can be resolved - by not having one.
One link in the ring is designated the **Ring Protection Link (RPL)**, and in
normal operation the RPL owner **blocks** it.

The result is a ring that is physically a ring but logically a line. Traffic
flows around it in both directions from the block, and the topology is loop-free
at every instant.

```
        Node A ───────── Node B
          │                 │
          │                 │
        Node D ══XX══════ Node C
                  ▲
                  └── RPL, blocked in idle state
```

When a link fails somewhere else in the ring, that failure becomes the break in
the loop - so the RPL is no longer needed, and it unblocks. The ring is still
loop-free, because there is still exactly one break; it has just moved.

## What happens when a link fails

The sequence is worth walking through, because the interesting engineering is in
the ordering:

1. **The nodes adjacent to the failure detect it.** This is a hardware link-down
   event, not a timeout - which is why the detection path has to be
   event-driven. Any polling interval here becomes a floor on your convergence
   time.
2. **Those nodes block the failed port** and send a **Signal Fail (SF)** message
   in both directions around the ring.
3. **Every node receiving SF flushes its filtering database.** This is the step
   that matters most and the one that is easiest to get subtly wrong.
4. **The RPL owner receives SF and unblocks the RPL.** Traffic now has a path
   again.

## Why the FDB flush is the hard part

Each switch's filtering database maps MAC addresses to ports - it is how a switch
knows which way to send a frame. After the topology changes, every one of those
mappings on the affected path is wrong: the MAC that used to be reachable
clockwise is now reachable counter-clockwise.

If you do not flush, frames are forwarded confidently out of the port where the
destination *used* to be, and get dropped. The ring is physically healed and
traffic still does not flow - until the entries age out, which takes far longer
than the protection switching you just performed.

Flush too early, and nodes re-learn the old wrong entries from traffic still in
flight before the block is applied, and you are back where you started.

That ordering constraint - block, then signal, then flush, then unblock - is
what most of G.8032's apparent complexity exists to enforce.

## The timers, and why they exist

Three timers do most of the work of keeping a real ring stable:

**Hold-off timer.** Delays reporting a failure. If a lower layer has its own
protection mechanism, you want to give it a chance to fix the problem before
triggering a ring-level switch on top of it.

**Guard timer.** Started after a state change, during which the node ignores
received ring messages. Its purpose is to prevent stale messages - sent before
the change, still propagating around the ring - from being interpreted as current
state. Without it, a node can act on information that was already obsolete when
it arrived.

**Wait-to-restore (WTR) timer.** After a failed link comes back, the ring does
*not* immediately revert. A link that has just failed is a link that may be about
to fail again, and a flapping link that triggers a protection switch in each
direction every few seconds is worse for the network than a link that stays down.
WTR forces the recovered link to stay healthy for a sustained period before the
ring reverts.

The guard timer is the one to implement precisely. Its whole function is to
suppress a race, and a guard timer implemented as "approximately this long"
produces intermittent, load-dependent instability that is very hard to attribute
after the fact.

## Debugging a ring

Two tools answer nearly every question:

**Wireshark**, for what the nodes are actually saying to each other. Ring
messages carry the node ID and the request state, so a capture at one node tells
you what the ring believes about itself. Interoperability disagreements between
vendors are usually visible as one field, in one message, with an unexpected
value.

**Kernel tracing** (`trace-cmd`, `ftrace`, KernelShark), for questions about
time. When convergence is slower than the specification allows, the question is
never "did it converge" - it is *where the milliseconds went* between the
hardware link-down event and the port state change. A trace shows you directly;
reasoning about it from logs mostly produces confident wrong answers.

## The thing worth remembering

ERPS is not complicated because ring protection is complicated. It is
complicated because *the failure cases* are - simultaneous failures, flapping
links, messages that arrive after the state they describe has already changed.
The steady state is one blocked link. Everything else in the standard exists to
get from one steady state to another without ever, even briefly, having a loop.
