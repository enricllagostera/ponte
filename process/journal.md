# Process journal

## 2023-08-12 Commits as cases

I managed to create and successfully export commits as cases in a QDPX file. The cases also have variables attached to them, and I have started detailing more what data should be in the QDPX project and how to organzie it.

## 2023-08-11 Work restart

After dealing with some contract issues, I'm back on track.

I created a boilerplate blank Electron project that creates a Windows app. I have then managed to bring in scripts from `archivistagd` to load Git commit date from a GitHub repo info (e.g. `usarname/reponame`). After a couple hours of work, I now have a basic pipeline working, generating a completely empty QDPX project file that could be imported on QualCoder. It is still very early on, but it is the base for a proof-of-concept functionality.

## 2023-08-02 REFI-QDA research and tool definition

### Project setup & paper ideas

After presenting and discussing this idea (repo-to-qda flow) with RIlla, I have set up a new GitHub with some basic MDM-based organization.

One idea here is to use both [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) as the standard for my commit messages, with the added `mdm` scope. I plan to also use footers as way to add some relevant metadata to particular commits to inform about things (mostly stable) like having no builds for a commit.

Also added some initial notes for a [paper idea](paper-ideas) about this tool project.

### Thinking about tool design, Archivista and QDA integration

![Flowcharts about integration](repo_to_qda_pipelines.png)

Above: flowcharts showing some ideas about different pipelines from game project repo to final qualitative analysis.

### Features needed

1. Ways to convert selectively convert source code into REFI-QDA compatible materials (text, images, video, audio).
2. Ways to organize repo files by commit
   1. Embed commit metadata as case attributes and variables
3. Saving/opening of config files that define how the project creation should happen

### Looking into REFI-QDA

1. A file format created by a volunteer consortium involving the larger companies that make quali tool software. The website is: <https://www.qdasoftware.org/>
2. The file format defined in the website is an XML-based file.
   1. It consists of a `.qdpx` file which is actually a ZIP file, with a `.qde` XML file within and a folder containing sources.
3. The specification itself is open with a MIT license.
4. I can checkout the REFI-QDA schema from Taguette or QualCoder, maybe. Both are made in Python.

The format specifications itself is in this file: <https://www.qdasoftware.org/wp-content/uploads/2019/09/REFI-QDA-1-5.pdf>

## 2023-08-01 Researching some FOSS QDA tools and their features

### Taguette testing

1. It has an export option that seems to be made to be interoperable.
2. Materials it can process
   1. It reads one file at a time.
3. It reads markdown files.
   1. It imports them by parsing them into a frame.
4. On tagging
   1. It support hierarchical tagging via punctuation (like "outreach.press").
   2. They can me merged, but it is a permanent operation.
5. Exporting
   1. Projects are exported as a database, not very portable to other applications.
   2. Codebooks are exported in several formats.
   3. Collections of tagged highlights or documents can be exported in a variety of formats, including QDA.

it seems to be a limited tool which would not be enough for a larger and more complex project.

### QualCoder testing

Tool URL: https://github.com/ccbogel/QualCoder

Help Wiki: https://github.com/ccbogel/QualCoder/wiki

Another quali tool for [[3-13 Games as Research RA|GaR]]. This is a FOSS tool that is being developed. It has a very old-school and not very friendly (at first encounter) UI, but it seems to be quite performant and powerful once you get used to it.

- Drawbacks is that it renders text as raw TXT, so formatting and images get somewhat lost context.
- It has extensive reporting systems.
- It has very interesting in vivo and GT support (via memos at different levels). It is pretty customizable. It has a journal system.
- It exports projects and formats to QDA standards ([REFI-QDA](https://www.qdasoftware.org/) files). Should look more into it.

> Curtain, C. (2023) QualCoder 3.3 [Computer software]. Retrieved from [https://github.com/ccbogel/QualCoder/releases/tag/3.3](https://github.com/ccbogel/QualCoder/releases/tag/3.3)

It seems to be an OK alternative for something like QDA Miner Lite: https://provalisresearch.com/products/qualitative-data-analysis-software/freeware/
