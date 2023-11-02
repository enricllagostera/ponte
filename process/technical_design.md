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

## GUI

### Colors table

Originally created on [this spreadsheet](https://docs.google.com/spreadsheets/d/1zhFrn5MR97Z8v880WRLIC968utfq5d3-4SPtYhVLprU/edit#gid=0). It is based on the color system used in Boosted.

| Pairing (bg/text) | Background color       | Text color             | Color contrast | Notes          |
| ----------------- | ---------------------- | ---------------------- | -------------- | -------------- |
| Black/App         | core-black ~101010     | app ~13d44e            | 9.56           | AAA            |
| App/Black         | app ~13d44e            | core-black ~101010     | 9.56           | AAA            |
| App/White         | app-accessible ~10a73e | core-white ~fafafa     | 3.04           | AA lg txt only |
| Black/White       | core-black ~101010     | core-white ~fafafa     | 16.70          | AAA            |
| Black/Grey        | core-black ~101010     | f-grey-100 ~a0a0a0     | 7.28           | AAA            |
| Grey/White        | f-grey-200 ~555555     | core-white ~fafafa     | 7.14           | AAA            |
| White/Grey        | core-white ~fafafa     | f-grey-200 ~555555     | 7.14           | AAA            |
| White/App         | core-white ~fafafa     | app-accessible ~10a73e | 3.04           | AA lg txt only |
| White/Black       | core-white ~fafafa     | core-black ~101010     | 16.70          | AAA            |
| Info/Black        | f-info ~668ee3         | core-black ~101010     | 5.93           | AAA lg txt     |
| Info/White        | f-info ~668ee3         | core-white ~fafafa     | 3.07           | AA lg txt      |
| Success/Black     | f-success ~30dbde      | core-black ~101010     | 11.16          | AAA            |
| Warn/Black        | f-warn ~ffb300         | core-black ~101010     | 10.60          | AAA            |
| Danger/White      | f-danger ~d73306       | core-white ~fafafa     | 4.61           | AA             |
| Danger/Black      | f-danger ~d73306       | core-black ~101010     | 3.96           | AA lg txt only |

## QDPX format notes

- The order of elements in the XML file needs to follow the XSD schema.
- GUIDs being lower or uppercase seems to be irrelevant.
