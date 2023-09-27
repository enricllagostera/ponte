---
date: 2023-09-27
---

Danny Godin brought up on the Discord an interest in using the GitHub wikis as materials in GDR, and how that could be integrated into the tool. This could be useful for working collaboratively and for journaling purposes, for instance, in a built-in way with GitHub's interface.

A technical issue is that wikis in GitHub are a separate repository, with their own commit history at every change. While this history is then separate from the repo version at that same point in time, it could be possible to establish a joint timeline between them.

One possible way to do it could be by cloning and downloading the materials in the wiki repo, processing them in a similar way to the main repo. Then, the tool could get the timestamp of the wiki commits and add them to a joint list of commits. Instead of seeing only the main repo commits, the central area could also show wiki commits (maybe at a smaller scale). Wiki files could then be picked and added to the QDPX sources. This would result in the center area being a sort of "mixed timeline" of activities, and maybe could use some better formatting and filtering in that case.

I'm wondering if this feature would be a case of duplicating GitHub's own functions, but I'm leaning towards "no". The wiki does live there, but in a way it still relies enough on an idea of separate files to be still "readable" as a source in the CAQDAS we are using. 

Tracking changes in the wiki sounds useful, but what is the granularity needed? Would showing every change be useful or more like the state of the wiki at particular commits? At what point does it become too noisy? I think part of the answer relies in knowing what role the wiki or files take in the process documentation and being very intentional about it, even if it changes later. Let's say: wikis are for discussion and journaling, versus a `process`  folder that holds photo docs, for instance.
