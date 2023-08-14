---
date: 2018-08-12
---

# 04 On converting a repo into a QDA project

1. What REFI-QDA element to associate each commit with?
	1. QualCoder cannot read `Sets`, so I'm testing making each commit a `Case`.
	2. QualCoder seems to have some errors in importing and exporting sources associated with cases. This is a blocking bug.
2. Repo versus commit-specific info?
	1. Basic data for each commit (associated with the commit's case)
		1. Commit summary (source/text): a readable version of the full commit log data
		2. Process journal at this point in time (source/text);
		3. Devlog (source/text): commit subject, body and any notes added from commit footer (if so);
		4. Devlog compilation (source/text): merging of all previous devlogs up to this one, in reverse chronological order;
		5. GitHub link to repo at this commit;
		6. Link to playable build (source/text): GitHub link or folder location;
		7. Included files
			1. Selected from glob rules and converted to either `txt` or `png/jpg`, as needed, according to user-defined rules;
	2. Repo info generated from last commit data (as a separate case)
		1. Full Git graph (source/image);
		2. Last process journal (source/text);
		3. Last playable build (source/text): GitHub link or folder location;
		4. Last devlog compilation (a source merging all devlogs)
