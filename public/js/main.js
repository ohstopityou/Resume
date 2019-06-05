'use strict'

// Button that hides or shows editor section
document.getElementById('toggle-editor-btn').addEventListener('click', () => {
  document.getElementById('editor-section').classList.toggle('display-none')
})

// Button that updates resume
document.getElementById('update-btn').addEventListener('click', () => {
  saveResume()
    .then(refreshResume())
    .catch(handleError)
})

// Button that creates a new experience
document.getElementById('new-experience-btn').addEventListener('click', () => {
  saveResume()
    .then(fetch('/experience/new', { method: 'POST' }))
    .then(refreshPage())
    .catch(handleError)
})

// Buttons that deletes an experiences
document.querySelectorAll('.delete-experience-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    saveResume()
      .then(fetch(`/experience/${btn.dataset.id}`, { method: 'DELETE' }))
      .then(btn.parentElement.remove())
      .then(refreshResume())
      .catch(handleError)
  })
})

function refreshPage () {
  location.reload()
}

function refreshResume () {
  document.getElementById('preview').contentWindow.location.reload()
}

async function saveResume () {
  const resume = document.getElementById('editor')
  await fetch('/resume', { method: 'PUT', body: new FormData(resume) })
}

function handleError (msg) {
  console.log('--- Something went wrong ---')
  console.error(msg)
}
