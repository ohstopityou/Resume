'use strict'

const toggleEditorButton = document.getElementById('toggleEditor')
const editorPanel = document.getElementById('editor')
toggleEditorButton.addEventListener('click', event => {
  editorPanel.stye.display = (editorPanel.style.display === 'none' ? 'block' : 'none')
})

const resumeForm = document.getElementById('form-resume')
// Send form to server, then update editor
resumeForm.addEventListener('submit', event => {
  event.preventDefault()
  saveResume()
    .then(refreshResume())
})

// Create new experience
const newExperienceBtn = document.getElementById('new-experience-btn')
newExperienceBtn.addEventListener('click', () => {
  saveResume()
    .then(fetch('/experience/new', { method: 'POST' }))
    .then(refreshPage())
    .catch(console.log)
})

// Buttons to delete experiences
const deleteBtns = document.querySelectorAll('.delete-experience-btn')
deleteBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    saveResume()
      .then(fetch(`/experience/${btn.dataset.id}`, { method: 'DELETE' }))
      .then(btn.parentElement.remove())
      .then(refreshResume())
      .catch(console.log)
  })
})

function refreshPage () {
  location.reload()
}

function refreshResume () {
  document.getElementById('resume-iframe').contentWindow.location.reload()
}

async function saveResume () {
  await fetch('/resume', { method: 'PUT', body: new FormData(resumeForm) })
}
