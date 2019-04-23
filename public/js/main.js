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

const supportForm = document.getElementById('resumeForm')
supportForm.addEventListener('submit', event => {
  event.preventDefault()

  fetch('http://localhost:8080/resume/1', {
    method: 'PUT',
    headers: {
      'Content-type': 'application/json'
    },
    body: formToJSONString(event.target)
  })
    .then(validateResponse)
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
