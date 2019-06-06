'use strict'

// Buttons that deletes an experiences
// TODO: Promt if user really wants to delete
document.querySelectorAll('.delete-resume-btn').forEach(btn => {
  btn.addEventListener('click', (event) => {
    // Disables clicking the element below as deletebtn is position absolute
    event.stopPropagation()
    fetch(`/resume/${btn.parentElement.dataset.id}`, { method: 'DELETE' })
      .then(btn.parentElement.remove())
      .catch(handleError)
  })
})

// Redirects to resume editor when clicking on preview
document.querySelectorAll('.preview-wrapper').forEach(preview => {
  preview.addEventListener('click', () => {
    window.location.href = `/editor/${preview.dataset.id}`
  })
})

// Button that creates a new resume
document.getElementById('new-resume-btn').addEventListener('click', () => {
  fetch('/resume/new', { method: 'POST' })
    .then(location.reload())
    .catch(handleError)
})

function handleError (msg) {
  console.log('--- Something went wrong ---')
  console.error(msg)
}
