---
date: 2023-08-11
---

# 03 Choosing a tech stack

As I started work on this proof-of-concept initial prototype, I thought that It was a good idea to try to think about the maintainability of the tool from early on. I started worrying about choosing a combination of libraries, themes and other modules for the frontend that would be easy for someone else to maintain later on in this tools life cycle. This involved asking questions about should I pick React or Svelte or Bootstrap or all sorts of different software libraries and parts and thinking how easy are they to understand and start using. Dilemmas like: should I pick something easy for me to start with or making a better architecture/structure?

At some point I realized that this was stopping me from getting to the actual functionality of my tool. So, I started to just scaffold an initial Electron project (which was a choice that I was sure about) using vanilla Javascript and as little front end libraries as I could. I focused on reusing code from my previous archivista project to get some basic repository data and use it to write an empty QDPX file (from the REFI-QDA standard). To do that I had to reimport a bunch of different NPM modules: most of them I had used before when working on archivistagd, so I was already familiar with their functionality and getting them to work.

I guess this note is more to think about like how sometimes it's better to get to really a minimal version of the concept instead of overengineering it, especially if I'm still in a mix of an exploration / validation moment.

I want to move on to thinking about how do I need to transform a repo so that it is a meaningful set of sources for a qualitative analysis effort.
