# Process journal

## 2023-09-22 Pre-meeting fixes

I added a first version of the [related_work](related_work.md) notes. Also, I fixed some bugs with the saving and loading of the config file (it was generating a 40MB JSON before for some reason). Now that works OK, together with manually ignoring commits.

## 2023-09-21 File visualizations

As I tried to improve the copying of files, I thought that actually showing more info about the files at each commit within the interface would make sense, so that the researcher can have an idea of what to include when browsing the commits. I added a simple file tree, which I think I'll add a "Include as Text" or "Include as image" checkbox, to make it quick to hand pick files to include. (...) OK, it is mostly working. Some weird bugs when adding from both patterns and manually, but that's OK for now. There should also be a way to quickly exclude sources too, so that user don't have to keep searching for the checkbox to exclude a hand-picked file.

## 2023-09-20 Copying text files into QDPX bundle

I can finally move on to the actual copying of files, now that I have them available and their path data sent to the GUI. (...)

OK, for now this took the shape of a very rough interface that takes glob patterns and copies files as text sources, reading whatever opening them as `utf-8` gives out. There are some issues yet, but saving / loading of config and the QDPX export seem to be working alright, so I'll commit as-is. This is already enough to bring in script files or notes both in a cross-repo form or from the latest commit. Hmm, maybe this could be changed to an automatically determined most recent version?

## 2023-09-18, 19, 20 Dowloading files

I'm preparing to add back the functionality to download and extract commit files, so as to enable copying files as sources in the QDPX bundle. (...) For now I'm downloading all the commits and unpacking them in the `temp` folder. I know this is far from optimal, but it will work well enough for now.

Also ended up making some improvements to user feedback in the UI. (...)

I finally finished doing this, downloading things to a better organized temp folder and also preparing an array with the absolute paths to each file in each commit.

## 2023-09-15 GaR meeting

- [ ] Prepare a Mac build of version 0.0.1 #todo

After I talked about how design is more of a distributed process than just the integration on one folder/tool, and that this might need a combination of methodologies for analysis, Danny mentioned that even though automating some of that would be beneficial, it was important to not lose sight of the process, and that journaling / practices like that could support that. I sent the message below on Zoom as a clarification.

![](20230915115024.png)

## 2023-09-08 GaR meeting

1. Meeting notes
   1. What is the tool (internal/external) ecosystem you use in the process?
      1. When? For what purposes and limitations?
2. Repo to QDA work
   1. What work to prioritize (in the 10h remaining)?
      1. Usability: Building, running and testing in diff machines %% OK, focus on this. %%
      2. Features: File-copying
      3. Features: Encoding
   2. How to make this public?
      1. License for code: MIT; license for written content: copyright;
         1. Shahrom's idea: have a front-facing repo only with the code.
      2. How to deal with notes that might be the basis for unpublished paper? %% Discussion for later. Probably define a protocol for the whole GaR or maybe prepare a paper on it? %%
         1. What could a writing embargo look like?
   3. Joseph will work with the UX of the tools for the GaR project: **repo-to-qda**, archivistagd. %% Focus will be on repo-to-qda work. %%
      1. [ ] Write a note to Joseph on the UX and references for the repo-to-qda app and tag him on the repo #todo

## 2023-09-05 Encoding actions bug fixing and changes of component

Started bug-fixing the loading of the coding action and it's not working at all. I really will need to re-think this more slowly. (....) I had an idea to change the implementation from the _Svelecte_ component to the same JS library (_Choices.js_) that I used in _archivistagd_. I'm more familiar with it and it seems to have enough low-level configuration that I can wire it to Svelte without much issues. (...) And that didn't work. After more fiddling around, now I'm trying out one called [_svelte-select_](https://github.com/rob-balfre/svelte-select). It is a bit better documented and used, so there's that, but still very messy to use. I'll have to continue work on this later. Amazing how fragile these libraries can be. (...) OK, finally. After a lot of tweaking to finally understand the lifecycle of information I have the save/loading of quali codes working well enough with the encoding by pattern action. So annoying.

## 2023-09-04 Re-implementing exporting to QDPX

I'm basically pasting back the export code from the proof-of-concept version, with some refactoring to make it separated and more modular. This might make it easier to maintain and keep extending it. (...) Happy to say that I managed to export both codes and text sources successfully. In doing so, I also figured out a way to deal with encoding commits: for now, I attach the codes defines in actions to any occurrences of the commit's `hashAbbrev` in the generated text sources. This way, it is possible to navigate directly to that coding when reading a longer source, instead of attaching it to a header.

## 2023-09-01 After meeting and re-implementing to exporting

After my presentation at the GaR meeting, we talked about starting to test out the tool. I think the main features still needed before that is possible is to 1) save/load configurations (so they can easily be re-done if needed) and 2) to export the QDPX file itself. So, today I focused on implementing the save and loading. (...) OK, it works pretty well now. It basically saves the `userRepoInfo` and the actions that were setup. After it loads the config file, it fetches the commit log data from GitHub and runs the conversion actions again. It is not a very optimized system, but so far, so good. Later I'll have to think of ways to bypass / cache it to avoid repeated downloads.

## 2023-08-29 Work is picking up pace with new tech stack

After the changes to the underlying libraries, I'm getting some more functionality into the app. I have implemented basic devlog generation (per commit and as a repo compilation). The process for adding features feels more straightforward now. I'll continue doing that for the next couple days.

## 2023-08-25 Continuing on UI

I'll work on integrating and creating the technical backbones for the GUI. (...) Ended up doing some unrelated clean-up, to remove some of the libraries that were giving security warnings. Those were related to the commit xips downloading and extracting.

## 2023-08-24 Work on customization process

I need to plan and better understand the flow of using the tool, to make sure that the UI will make sense / work well enough. My initial idea is to have something like a three-fold format with panes. The left-most pane is for the repo info and general project information. The middle column is for the rules, transformations and conversions that the tool will perform. The right pane is for a preview of the contents and their structure (e.g. sources, codes).

## 2023-08-22 Post meeting work

After last meeting, I also talked to Rilla and we agreed on me implementing more of the UI and actual workflow of the tool, so that it can be deployed and tested by others soon. This also involves implementing some of the customization functionality that I outlined and ideated in previous posts.

## 2023-08-18 Meeting and next steps

Today there will be a GaR meeting. I'll present what I have so far and show how that could be useful. The goal is also to get inputs (feedback, ideas, comments) to help decide on next actions.

- What to prioritize next?
  - Tool usability? Compilations/visualizations? Interoperability? Integration with `archivistagd`?
- Is the feature set shown already useful? What is missing?

(...) Some meeting notes:

1. Pippin asked how brittle is the tool (in terms of requiring specific structures)?
   1. Quite brittle, this would take a good UI to support the flexibility
2. How to make it MDM agnostic?
3. There is a strong linearity in these big complication materials: how to account for something less linear, so that it influences analysis differently?
   1. Possible approach: Use of graphs and networks within the CAQDAS tool themselves
4. Conversion wizard steps, connected to Rilla's comment on how to make the codes more usable and to increase the value for researchers in using this tool.
   1. Idea: add codes to files according to glob patterns
   2. Idea: add codes to commits according to patterns
   3. Idea: select commits or files to add codes manually
   4. Idea: filter out commits per subject pattern
5. Pippin: how to preserve the mess of the creation process and not tell a story that is too tidied-up or sanitized (connects to comment on linearity).
   1. Idea: find a way to capture / visualize the repo project structure at each commit (but this is slightly replicating the GitHub browse-at-commit function)

## 2023-08-17 Adding files from commit to QDPX

My goal for today is to download and copy files from the cloned repo directly to the QDPX project, tagging them with a commit code. So far, I have only added a file I generated, instead of dealing with all the downloads. I have that code from the `archivistagd`, and I hope re-using it will prove to be quick enough.

(...) Ok, I was able to do the reuse I wanted to. It seems to work fine. So, for now, I have created sources from raw data and Git commit messages.

Managed to get `docx` into the QDPX, by converting markdown into HTML and then to docx. It is a contrived effort, but it keeps images in context, which is great. For now, it converts local images (from the repo files at each commit) into base64 images (PNG only, so far) and saves them into the docx files. This took longer to setup than I expected and was quite fiddly, but it works now.

## 2023-08-16 Import & export in Atlas.ti

I have moved on to use Atlas.ti as the tool for testing importing/exporting of QDPX projects. In terms of how to encode information, I'm using mostly codes, organized into code-subcode hierarchies. (...) I was able to generate codes for each commit and associated them to a JSON/txt file with the raw commit log data (the code is added to the first character of the file). Using a hierarchical (1-deep) code structure seems to work well.

## 2023-08-15 Import / export shenanigans

I worked on trying to get cases and source files to connect on my QDPX file when opened into QualCoder, without success. In the process, I started looking into what is and isn't supported by the tool and other CAQDAS. I got an Atlas.ti trial account for testing its importing/exporting functionality as well.

In the process, I did a bunch of research into the different tool supports. Also became more familiar with XML and the particularities of the QDE and QDPX formats.

## 2023-08-14 Adding source files

While I worked on creating commits from cases, I had some ideas about what sources to include in the QDPX project. As a test of the process, I'll include the raw JSON for each commit as a separate text file. (...) I managed to do that, but because of the limitations on the import/export functionalities of QualCoder, I don't have a proper CAQDAS software to double check my results.

I think the best move now would be to focus on creating the different source files and making sure they are readable. As soon as I get access to a CAQDAS tool, I'll go back to checking my import/export process and QDPX file.

Hmmm, as soon as I started trying to add more variables to a case (to expose things like the commit's author), I found problems with the XML builder library I was using. So, I have decided to change for a better one. (...) great, found a better one and converted the code. The XML being exported is cleaner and the code is more readable.

## 2023-08-12 Commits as cases

I managed to create and successfully export commits as cases in a QDPX file. The cases also have variables attached to them, and I have started detailing more what data should be in the QDPX project and how to organize it.

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
