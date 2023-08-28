The projects main language (and ensuing tech stack) is Javascript for a desktop environment.

## Tech stack

The app uses Electron as the basis for cross-platform builds, ease of deployment and quick desktop GUI integration with Node. It uses NPM as package manager.

The main functionality will be done via Node modules such as XML parsers, Git libraries, ZIP libraries and JSON manipulation. Other libraries involved are there mostly for dates, and filesystem operations. Right now, an overview of them is:

1. `simple-git` and `git2json` to get Git information from GitHub repos;
2. `xmlbuilder2` for XML parsing and building;
3. `adm-zip` for compressing and extracting ZIP files (used in the QDPX format);
4. `axios` for HTTP requests and downloads;
5. `Luxon` for dates and `fs-extra` for filesystem I/O;
6. `marked` and `html-to-docx` for file format conversions for text sources;
7. (To be added) `gray-matter` for parsing YAML frontmatter in text files;

In terms of operation, I'm doing most things from the `main.js` process. I hardcoded a repo (`enricllagostera/sample_webgame_repo`) for now and I'm mostly just sending data to the GUI for testing. There is no actual two-way communication for now.

### UX/UI

I'm going to organize the UI mostly by using Bootstrap as the main library for components. I'm looking into using `Alpine.js` to organize reactive aprts of the GUI. Both these tools are familiar from `archivistagd` dev.

## Conversion actions

#todo

1. Loading
	1. Commit loading
		1. [ ] Ignore commits from commit list (hashes or hashAbbrev)
		2. [ ] Ignore commits from subject (glob pattern)
	2. File loading
		1. [ ] Copy file as sources from filename (glob pattern)
			1. Radio group: In all commits the file is found; Last existing commit; In specific commit(s);
		2. [ ] Copy file as sources and encode from filename (glob pattern)
			1. Radio group: In all commits the file is found; Last existing commit; In specific commit(s);
2. Coding
	1. Commit encoding
		1. [ ] Encode commits from subject (glob pattern)
			1. Example: All commits with `docs**` on subject line are encoded with `documentation`.
		2. [ ] Encode commits from text content (glob pattern)
		3. [ ] Encode manually selected commits
	2. File encoding
		1. [ ] Encode files from filename (glob patterns)
		2. [ ] Encode files from text content (glob pattern, aka auto-code)
		3. [ ] Encode manually selected files
3. Devlogs
	1. [ ] Generate devlog compilation
		1. Checkboxes: Add commit logs; Add file from commit `devlog` footer; Add link to each build;
	2. [ ] Generate a devlog for each commit
		1. Checkboxes: Add commit logs; Add file from commit `devlog` footer; Add link to each build;
4. Compilations
	1. [ ] Generate a docx from a folder compilation (glob pattern)
		1. Radio group: In all commits the folder is found; Last existing commit; In specific commit(s);
5. Visualizations
	1. [ ] Generate a chronological timeline of commits
		1. Shows passage of time between commits
	2. [ ] Generate a topological timeline of commits 
		1. Shows a linear sequence of commits

## QDPX format notes

- The order of elements in the XML file needs to follow the XSD schema.
- GUIDs being lower or uppercase seems to be irrelevant.
