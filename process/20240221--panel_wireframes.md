Below is the https://wireframe.fun/ code for the mockups in the journal.

```
h.h-3.bg-whitesmoke.gap-3.p-1.v-center Header
    h.expand.px-2
        title Ponte
        text.ml-2 v0.1.1.1111
    h.gap-3
        button new config
        button load config
        button save config


h.v-center.gap-1.v-left FileEntry
    icon File
    text
        faker.text-xs system.filePath

h.v-center.gap-1 TagEntry
    icon Tag
    faker lorem.word

card.p-2.mb-2.gap-2 Commit
    h.py-2.expand
        v.max-w-50.pr-6.v-expand
                faker git.shortSha
                title.mb-2.bg-lightgrey
                    faker lorem.sentence
                title Commit message
                faker lorem.paragraph
        h.max-w-50
            v.w-25.v-expand.scroll
                Changes
                copy FileEntry
                copy FileEntry
                copy FileEntry
            v.w-25.v-expand.scroll
                File tree
                copy FileEntry
                copy FileEntry
                copy FileEntry
                copy FileEntry
                copy FileEntry
                copy FileEntry
                copy FileEntry
                copy FileEntry
                copy FileEntry
                copy FileEntry
                copy FileEntry
                copy FileEntry
    h.border-t-2.gap-2.py-2.v-center
        icon Tag
        text Commit tagged:
        button Some tag
        input.expand


desktop Ponte - 1. Loading repo
    v.expand
        copy Header
        h.expand.bg-whitesmoke.h-center.v-center Main
            v Repo loader
                Load project data
                h.v-center
                    input Enter user/repo
                    button.m-1 Load
        h.h-2.bg-yellow.h-center Footer
            Some notifications


desktop Blogroll
    v.expand
        copy Header
        h.expand.bg-whitesmoke Main
            v.expand
                h.gap-2.px-2
                    button.bg-green Blogroll
                    button Timeline
                v.expand.scroll.p-2
                    copy Commit
                    copy Commit
            v.w-2
                button(click=Ponte - 3. Export panel)
                    icon ChevronsLeft
        h.h-2.bg-yellow.h-center Footer
            Some notifications


desktop Export panel
    v.expand
        copy Header
        h.expand.bg-whitesmoke Main
            v.w-3.p-2
                button(click=Blogroll)
                    icon ChevronsRight
            v.expand.p-2
                title.text-lg.mb-2 Export preview
                h.expand
                    v.w-25
                        v.mb-4.scroll.h-10
                            divider
                            title Sources
                            text.bg-lightgrey
                                Devlog compilation
                            copy FileEntry
                            copy FileEntry
                            copy FileEntry
                            copy FileEntry
                            copy FileEntry
                            copy FileEntry
                            copy FileEntry
                            copy FileEntry
                            copy FileEntry
                            copy FileEntry
                            copy FileEntry
                        v.scroll.h-10
                            divider
                            title Codebook
                            text Summary
                            copy TagEntry
                            copy TagEntry
                            copy TagEntry
                            copy TagEntry
                            copy TagEntry
                            copy TagEntry
                            copy TagEntry
                            copy TagEntry
                            copy TagEntry
                            copy TagEntry
                            copy TagEntry
                            copy TagEntry
                            copy TagEntry
                            copy TagEntry
                    v.w-75.p-1
                        h.expand
                            v.expand.p-1.scroll
                                title.text-xl.mb-2 Devlog compilation
                                faker lorem
                                faker lorem
                                faker lorem
                                faker lorem
                                faker lorem
                                faker lorem
                                faker lorem
                                faker lorem
                            v.w-15.bg-lightgrey.border-l.p-1
                                Some metadata about how the devlog was compiled.
                                divider.my-2
                                v Annotation
                                    No annotations for this source so far.
                                    button.my-2(click=Editing an annotation for a source) Add annotation

        h.h-2.bg-yellow.h-center Footer
            Some notifications

v.bg-lightgrey.w-20.gap-2.p-2 Editing an annotation for a source
    title Edit annotation
    input Enter annotation title
    v.v-expand
        textarea.scroll.h-10 Enter annotation content
    h.gap-2
        button save
        button cancel

v.bg-lightgrey.v-expand.w-20.gap-2.p-2.scroll Displaying an annotation
    title
        faker lorem.sentence
    text.text-xs
        faker date.recent
    divider
    v.scroll.h-10
        text.text-sm
            faker lorem.paragraphs
    divider
    h.gap-2
        button edit
        button remove
```
