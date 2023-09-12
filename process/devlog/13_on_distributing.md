---
date: 2023-09-12
---

# 13 On preparing for distribution

After the last meeting, we had discussed that now is the time to get the tool into other users. For that, I need to make sure it can actually be exported to those platforms and key issues are ironed out.

(...) Right away, what happened was that some UI interactions were broken, like dropdowns and modals. I ended up having to to a lot of back-and-forth to fix that. Now it works alright on another Windows machine, but I haven't tested it on macOS yet.

(...) Another issue that came up is that the app uses Git as a requirement. Basically, it needs to have it installed and available as a command like `> git ...` on the terminal. Without this, I would have to recode the project to use GitHub's API instead of the clone-based process it uses right now.

This certainly makes me feel like the complexity of cross-platforming and actually packaging and distributing software is always tricky. Later I'll have to figure out how to streamline those requirements, so that maybe an installer could automatically download and install Git, for example. Or maybe I should refactor everything to use GitHub's API? Right now the whole project depends a lot on GitHub web API anyway... Still, it is a bit more agnostic right now? I'd like to keep it this way.

A question that emerged is how to organize this distribution process? I don't know if I should just make the repo public as-is. That would make all the notes public as well, even if they might yet be part of unpublished paper in the future. Would that create a self-plagiarizing problem? Could this open margins to other researchers citing and publishing about it before I can prepare that work myself? Not sure how to handle this. Shahrom mentioned the possibility of making public only the code, via something like GitHub Actions workflow. I think I might take a look at this. For now I'll just send ZIPs in the Discord. (...) Actually, I'll just create an empty repo to publish releases and track issues. That basically works more easily than the GitHub Action automation for now. Why over-engineer this?
