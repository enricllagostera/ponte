window.repo_to_qdaAPI.onGitData((_event, value) => {
  const dataElement = document.getElementById("inputData");
  console.log(JSON.parse(value));
  dataElement.innerText = value;
});
