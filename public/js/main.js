'use strict'

// Response is ok if status code is 2XX
// Response body is data or error message
function validateResponse (response) {
  if (!response.ok) {
    throw response
  }
  return response
}

const toggleEditorButton = document.getElementById('toggleEditor')
const editorPanel = document.getElementById('editor')
toggleEditorButton.addEventListener('click', event => {
  editorPanel.style.display = (editorPanel.style.display === 'none' ? 'block' : 'none')
})

const refreshResumeButton = document.getElementById('refreshResume')
const resumeIframe = document.getElementById('resumeIframe')
refreshResumeButton.addEventListener('click', event => {
  console.log('reloading iframe')
  resumeIframe.contentWindow.location.reload()
})

const resumeForm = document.getElementById('resumeForm')
resumeForm.addEventListener('submit', event => {
  event.preventDefault()
  let formData = new FormData(resumeForm)

  fetch('/resume', {
    method: 'PUT',
    body: formData
  })
    .then(resumeIframe.contentWindow.location.reload())
    .catch(console.log('reeeeeeeeeee'))
})
