# Technical design

The project's main language (and ensuing tech stack) is Javascript, running on a local-first desktop environment.

## Tech stack

The app uses Electron as the basis for cross-platform builds, ease of deployment and quick desktop GUI integration with Node. It uses NPM as package manager. Electron is supported via the template and CLI tool called Electron Vite.

On the frontend side, I am using the framework Svelte to create modular, reactive UI. As for layouts and visual design, I'm using the Bootstrap library of component styles and the Bootstrap Icons for graphics. Some components are off-the-shelf, like the one for selects (used for tagging).

The main functionality (i.e. data and file handling and processing) is done via Node modules such as XML parsers, Git libraries, ZIP and JSON manipulation. Other libraries involved are there mostly for dates, and filesystem operations. Right now, an overview of them is:

1. `simple-git` and `git2json` to get Git information from GitHub repos;
2. `xmlbuilder2` for XML parsing and building;
3. `adm-zip` for compressing and extracting ZIP files (used in the QDPX format);
4. `axios` for HTTP requests and downloads;
5. `Luxon` for dates and `fs-extra` for filesystem I/O;
6. `marked` and `html-to-docx` for file format conversions for text sources;
7. (To be added) `gray-matter` for parsing YAML frontmatter in text files;

In terms of operation, I'm doing most things from the `main.js` process.

### UX/UI

I'm going to organize the UI mostly by using Bootstrap as the main library for components. I'm using Svelte to implement reactive parts of the GUI.

## Features

{ 2023-10-05T17:49:04-04:00 I moved the features to-do list to a separate file: [to-do](to-do.md) }

## QDPX format notes

- The order of elements in the XML file needs to follow the XSD schema.
- GUIDs being lower or uppercase seems to be irrelevant.
