---
title: Deep CNN for Malaria Parasite Detection
summary: An undergraduate thesis proposing a 13-layer convolutional neural network for malaria parasite detection, reaching 96.41% common accuracy under five-fold cross-validation on 27,578 single-cell images.
category: Machine Learning
context: academic
organization: Rajshahi University of Engineering & Technology
role: Undergraduate thesis
started: 2021-06-01
ended: 2022-12-31
ongoing: false
tech:
  - Python
  - Deep learning
  - CNN
  - Image classification
featured: true
order: 4
published: true
publishedAt: 2022-12-31
---

## Overview

My undergraduate thesis at RUET: an improved machine learning framework for
detecting malaria parasites in single-cell microscopy images, built on a
purpose-designed 13-layer convolutional neural network rather than a fine-tuned
general-purpose model.

## Problem

Malaria diagnosis by microscopy requires a trained technician to examine blood
smears and identify parasites cell by cell. It is slow, it does not scale to the
settings where malaria is most common, and accuracy depends on the examiner.

Automated classification is a natural fit, and the usual approach is transfer
learning - take a large network pre-trained on general image data and fine-tune
it. That works, but it inherits a model far larger than the task requires, which
matters if the goal is deployment on modest hardware in a clinic rather than a
benchmark number on a workstation.

The question the thesis asks: can a smaller, purpose-built network match transfer
learning on this task?

## Dataset

**27,578 single-cell images**, split between parasitised and uninfected cells -
each image a single segmented cell rather than a whole smear, which makes the
task a binary classification problem on a consistent input.

## Methodology

A **13-layer CNN** designed for this problem rather than adapted from a general
image classifier, evaluated with **five-fold cross-validation** so the reported
figure reflects performance across the whole dataset rather than a single
favourable split.

Five-fold cross-validation matters for a medical classification claim. A single
train/test split on a dataset this size can vary by a percentage point or more
depending on which images land where, and reporting the best split is how
published accuracy figures stop being reproducible.

## Results

**96.41% common accuracy** across the five folds - close to what transfer
learning achieves on the same dataset, from a substantially simpler and more
computationally efficient model.

The finding worth stating precisely: the comparison is not that the purpose-built
model is *more* accurate. It is that it is *comparably* accurate while being
smaller and cheaper to run, which is the property that matters for deployment on
constrained hardware.

## Lessons learned

Model size is a design constraint, not an afterthought. It is easy to reach for
the largest pre-trained network available and report the accuracy it gives you;
it is more useful to ask what the smallest model that meets the requirement looks
like - which is the same instinct that embedded work rewards.
