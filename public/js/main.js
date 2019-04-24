'use strict'

// Response is ok if status code is 2XX
// Response body is data or error message
function validateResponse(response) {
  if (!response.ok) {
    throw response
  }
  return response
}

// Used as error handler
function logError(error) {
  // Prints response body to console, unless it is a 404
  if (!error.status === 404) {
    error.text().then(console.log)
  }
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

const supportForm = document.getElementById('resumeForm')
supportForm.addEventListener('submit', event => {
  event.preventDefault()
  console.log(resumeIframe.contentWindow.location)
  // Update resume using put
  fetch(resumeIframe.contentWindow.location, {
    method: 'PUT',
    headers: {
      'Content-type': 'application/json'
    },
    body: formToJSONString(event.target)
  })
    .then(validateResponse)
    // Refreshes resume iframe
    .then(resumeIframe.contentWindow.location.reload())
    .catch(logError)
})

function formToJSONString(form) {
  const formData = new FormData(form)
  var JSONform = {}
  formData.forEach((value, key) => {
    JSONform[key] = value
  })
  console.log(formData)
  return JSON.stringify(JSONform)
}
