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
  console.log(formData)
  for (var [key, value] of formData.entries()) {
    console.log(key + ' ' + value)
  }

  console.log(formData.get('exp'))

  fetch('/resume', {
    method: 'PUT',
    body: formData
  }).then(console.log('done'))

  // fetch('/resume', {
  //   method: 'PUT',
  //   headers: {
  //     'Content-type': 'application/json'
  //   },
  //   body: formToJSONString(event.target)
  // })
  //   .then(validateResponse)
  //   // Refreshes resume iframe
  //   .then(resumeIframe.contentWindow.location.reload())
  //   .catch(console.log)
})

// function formToJSONString (form) {
//   const formData = new FormData(form)
//   var JSONform = {}
//   formData.forEach((value, key) => {
//     JSONform[key] = value
//   })
//   return JSON.stringify(JSONform)
// }
