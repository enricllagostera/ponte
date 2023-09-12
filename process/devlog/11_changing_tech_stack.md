---
date: 2023-08-28
---

# 11 On changing a tech stack

OK, so this weekend I managed to make some key changes to the tech of the app.

I had been bothered for a while with how it was organized, as it was getting hard and very brittle to both add backend functionality (NPM module based file handling and creation) and to make a GUI that was responsive, reactive and well organized. I had tried to convert the project to Typescript to try to improve the brittleness, but I failed.

During this weekend I tried again, this time trying out other tooling for Electron, a bit more recent (via the template **Electron Vite**). This really helped, as the template project and **Vite** bundler configuration helps to handle the NPM conflicts I was having. It also handles integrating the frontend framework **Svelte**, which helps to create modular interfaces and define rich behavior.

I am very satisfied with how this turned out so far, and I think I'll be able to get back to the quick pace I was having in creating new GUI-focused functionality.
