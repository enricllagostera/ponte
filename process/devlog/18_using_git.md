# 18 On using Git in more depth

I had been using Git in a very limited way. As I explore more ways to handle optimizing disk use, I'm founding quite a lot of interesting commands that can help the tool.

I found some tools, like MergeStat, that provide a SQL (so database-like) querying system for Git repos. That sounds like a productive approach, but the process of integrating these tools in a desktop application seem more complicated than just using Git directly.

## Git implementations

### Via a Git terminal

The current system in the tool uses the [simple-git](https://github.com/steveukx/git-js) library, which is an interface to running Git commands on the local terminal. Some of its pros:  1) ease to code; 2) allows for running raw Git commands; 3) actively maintained and documented; 4) Quite fast. Cons: 1) fragile setup (needs previous installation of Git by the users).

### Via JavaScript implementations of Git

In researching options to alleviate the simple-git installation complexity, I found out there are a few pure-JS implementations of Git. One of the options is [isomorphic-git](https://isomorphic-git.org/), which allows for running Git commands on a `.git` folder without terminal tools. Pros: 1) no need for installing Git; 2) everything lives on JS; 3) Promise-based API.  Con: 1) API is different from Git; 2) Less maintained and documented than simple-git with an older codebase, it seems; 3) I'd need to test out the performance, but seems ok?

## Git commands

### Shows a graph of all branches

This command is useful for sanity checking the data and logic in my graphs (particularly in branching).

```bash
git log --oneline --decorate --graph --all
```

### List all branches a commit is in

This shows the name of all branches that contain this commit in their history. I use this for the branching graph.

```bash
git branch -a --contains <hash>
```

### Shows last commits that changed a file

This can be used to get an idea about how active or stable a file is at a given point in time. It can also be used to get a count of how many commits touched a particular file. This accounts for renaming.

```bash
git log --follow --all -<n> --  <rel/path/to/file.txt>
```

This version below shows only N changes before a particular date, so it is possible to take a point-in-time version of this info.

```bash
git log --follow --before=<date> --all -<n> --  <rel/path/to/file.txt>
```

### Get file contents at specific commit

This would be used as needed to load file contents for preparing sources (e.g. compilations, pass-through copies). I could then keep a local copy stored in a cache.

```bash
git show <hash>:<rel/path/to/file.txt>
```
