## 2023-08-11 Empty QDPX proof-of-concept

Main language: JS.

The app uses Electron as the basis for cross-platform builds, ease of deployment and quick desktop GUI integration with Node. It uses NPM as package manager.

The main functionality will be done via Node modules such as XML parsers, Git libraries, ZIP libraries and JSON manipulation. Other libraries involved are there mostly for dates, andfilesystem operations. Right now, an overview of them is:

1. `simple-git` and `git2json` to get Git information from GitHub repos;
2. `fast-xml-parser` for XML parsing and building;
3. `adm-zip` for compressing and extracting ZIP files (used in the QDPX format);
4. `Luxon` for dates and `fs-extra` for filesystem I/O;

In terms of operation, I'm doing most things from the `main.js` process. I hardcoded a repo (`enricllagostera/sample_webgame_repo`) for now and I'm mostly just sending data to the GUI for testing. There is no actual two-way communication for now.
