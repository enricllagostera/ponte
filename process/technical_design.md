The projects main language (and ensuing tech stack) is Javascript for a desktop environment.

The app uses Electron as the basis for cross-platform builds, ease of deployment and quick desktop GUI integration with Node. It uses NPM as package manager.

The main functionality will be done via Node modules such as XML parsers, Git libraries, ZIP libraries and JSON manipulation. Other libraries involved are there mostly for dates, and filesystem operations. Right now, an overview of them is:

1. `simple-git` and `git2json` to get Git information from GitHub repos;
2. `xmlbuilder2` for XML parsing and building;
3. `adm-zip` for compressing and extracting ZIP files (used in the QDPX format);
4. `Luxon` for dates and `fs-extra` for filesystem I/O;
5. `marked` and `html-to-docx` for file format conversions for text sources;
6. (To be added) `gray-matter` for parsing YAML frontmatter in text files;

In terms of operation, I'm doing most things from the `main.js` process. I hardcoded a repo (`enricllagostera/sample_webgame_repo`) for now and I'm mostly just sending data to the GUI for testing. There is no actual two-way communication for now.

## QDPX format notes

- The order of elements in the XML file needs to follow the XSD schema.
- GUIDs being lower or uppercase seems to be irrelevant.

## Source files per commit

1. [x] Raw log (source/text): a readable version of the full commit log data;
2. [x] Compilation of the whole process folder (journal, to-do, manifesto) journal at this point in time (source/text): useful for context;
3. [x] Link to repo on GitHub for this commit (variable/text): included as a field in the devlog file and compilaiton;
4. [/] Devlog (source/text): commit subject and body combined with any external note files added from commit footer (optional, e.g. `devlog: process/devlog/01_project_start.md`);
	1. [ ] (optional) Add external notes to the devlog entry;
5. [ ] Link to playable build as a GitHub link or folder location (variable/text);
6. Other curated files
   1. [ ] Selected from glob rules and converted to either `txt` or `png/jpg`, as needed, according to user-defined rules;

## Source files for whole repo

1. Compilation of all devlogs (as found in the last commit) as a `text/docx` file;
2. Compilation of all docs on `process` folder as a `text/docx` file;
