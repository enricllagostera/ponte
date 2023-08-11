---
date: 2023-08-02
---

# 02 On commit messages and file organization

The main uses of keeping the reflective message in the commit body are:

1.  To easily access it via commit history interfaces
2.  To connect it permanently and directly to a commit

Keeping the reflective devlog separate from the commit body can help to maintain some Git based functionality (like Conventional Commits or Semantic Versioning, CI/CD systems) separate from reflective writing.

As long as it is kept in a sensible location (e.g. `process/devlog/XXX.md`), it will be easy to notice in a commit's diff view.

It would be linked to the commit itself by adding a footer to the commit message (e.g. `Devlog: process/devlog/XXX.md`). That way it could be picked up by tooling like `archivista` or `repo-to-qda` and be processed accordingly. Mostly, this would take the form of making visible in the right place.
