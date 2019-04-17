"use strict";

const toggleEditorButton = document.getElementById("toggleEditor");
const editorPanel = document.getElementById("editor");
toggleEditorButton.addEventListener("click", event => {
  editorPanel.style.display = ("none" == editorPanel.style.display ? "block" : "none");
});