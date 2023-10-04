---
date: 2023-08-24
---

# 10 Workflow design

Here is a draft of a general flow. It has a three-pane structure.

![](conversion_workflow.png)

From this, and together with ideas from the last meeting, I designed a list of possible actions up on [technical_design](process/technical_design.md). In a way, the list is more of a wishlist, I'm not sure all of that will be needed. Maybe a way to prioritize them is to think of what would be useful in each of these cases:

1. **MDM, consistent organization.** This would require the least amount of actions. Maybe just a compilation step or some ignoring. This could be the case to benefit most from auto-encoding features.
2. **MDM, inconsistent organization.** This would need some custom filters and rules, to make sure that all the info that is wanted will make it to the QDPX project.
3. **No MDM, consistent docs.** Docs are found on specific locations in most commits, and could be easily aggregated.
4. **No MDM, some messy docs.** A repo that does not really have a consistent MDM approach, but has docs scattered across the commits that could be useful for a chronological data analysis. This would require lots of detailed customizations.

One thing that writing this above has made me think is that I don't want to repeat the CAQDAS toolset. So, maybe some of this auto-coding could be delegated to the tools themselves instead of the base project generation? I don't know...

## Reasonable defaults

I think some kind of **reasonable defaults** would be important. I think the baseline is the **devlog compilation of commit logs**, including links to builds and to browse the commit at this point in time.
