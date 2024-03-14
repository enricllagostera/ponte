# 21 Thinking about file age

1. **Different scales**: intra and interfile, or line and file scale.
	1. Intra is given by something like `git blame`.
	2. Inter is given by `git log <sha> -- <path>`.
2. **File-scale explorations**
	1. **Showing a file-scale last 5 commits history** .
		1. To get last 5 commits history, it would be necessary to check if the file has had any changes in those commits (`git log --follow --oneline -5 <sha> -- <path>`) and then compare those SHAs with the last 5 commit SHAs (`git log --oneline -3 <rev>`). From there it would be possible to get the kind of change to show to users from the diff that is already fetched by the app. It might be necessary to check when the file was added (`git log --follow --diff-filter=A -- <path>`) just to make sure it is displayed correctly.
3. **Line-scale explorations**
	1. Technically, it would be a way to create a more readable presentation to `git blame` information. 
	2. Linking to the interactive blame page on GitHub is the minimum.
	3. How to evaluate which lines are more important?
		1. A) Look at which lines changed most recently. This is how the more usual blame views operate. But this should take as reference point the timestamp of the commit itself.
			- [p] Easy to understand. Intuitive. 
			- [c] It might miss lines that are important but have not been recently changed.
		2. B) Look at which line changed the most up to that point in time. This approach would connect with the notion of "accumulated knowledge" as locations that see most change over time.
			- [p] Insight across time. 
			- [c] More complicated to explain. It is a relative measure.
