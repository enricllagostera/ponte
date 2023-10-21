# 17 Getting insight from commit and file history

As I started the viz sketches I mention in the journal (see [2023-10-17 Visualization tests](../journal.md#2023-10-17%20Visualization%20tests)), I started to list out and do some research on what kind of insights or metrics would be useful. I came across a few posts that discussed static code analysis using Git history, and some ideas from there were interesting. The aim is certainly different, as the author goal is all about efficiency and auditing code, while in here the goal is to identify and build knowledge on design process.

## Potentially interesting data

### Commits with most additions

This might indicate groups of ideas or very active periods in the process.

### Commits with most deletions (or  "cleanups")

It might indicate big redesigns or changes in design direction. Also a good place to check the journal and in-process notes.

### Most frequently changed files

This might help understand which are the key files in a repo (important for familiarizing with data or external researchers), as well as suggest places for longitudinal analysis. Therefore, it might be useful to see this both for the whole project or for a specific timeframe.

### When files became stable? Or stop changing?

By listing the date of last change of the files in the latest commit, it is possible to get a sense of when most of the materials became stable and might help periodize and prioritize analysis. This metric can be used for the final version, but could also be presented as **"file age" at any commit**, and could help identify what is in active development at each point in time.

### "Knowledge" embedded in / of a file (from [here](https://willschenk.com/howto/2020/gitlog_in_sqlite/#headline-12))

A way to connect authors with files: the more they changed it, the more they know about it. This knowledge happen as at specific points in time and would decay. There is also another alternative interpretation: if a file is changed often, it might have more invested time / knowledge in it (reading the contents over time would be a good way to check this).

### File change coupling by commit

This can give an idea of significant groupings of files and how often were they changed together. It could potentially be visually represented as a force-directed graph with a stronger or weaker link forces. However, it is a complex piece of information.
