
$(document).on('click', '[data-uri]', function() {

    window.location = $(this).attr('data-uri')


})


$("body").tooltip({
    selector: '[data-toggle="tooltip"]',
    container: 'body'
})

$('.sbh-download-picture').click(function() {

    var element = document.getElementById('design').childNodes[0]

    saveSvgAsPng(element, 'figure.png')

})


$('.sbh-datatable').DataTable()

$(".chosen-select").chosen()

require('./autocomplete')
require('./dataIntegration')
require('./visbol')
require('./sse')




function createWikiEditor($el, saveButtonText, updateEndpoint) {

    var $textarea = $('<textarea class="form-control"></textarea>')
    var $saveButton = $('<button class="btn btn-primary">').text(saveButtonText)
    var $cancelButton = $('<button class="btn btn-default">').text('Cancel')

    $textarea.val($el.attr('data-src'))

    var $div = $('<div></div>').append($textarea).append($saveButton).append($cancelButton)

    var $orig = $el
    $el.replaceWith($div)

    $cancelButton.click(function() {
        $div.replaceWith($orig)
    })

    $saveButton.click(function() {

        var desc = $textarea.val()

        $.post(updateEndpoint, {
            uri: meta.uri,
            desc: desc,
        }, function(res) {
            $div.replaceWith($(res))
        })

    })

    $textarea.focus()
}



$(document).on('click', '#sbh-add-description', function() {
    createWikiEditor($(this), 'Save Description', '/updateMutableDescription')
    return false
})


$(document).on('click', '#sbh-edit-description', function() {
    createWikiEditor($('#sbh-description'), 'Save Description', '/updateMutableDescription')
    return false
})

$(document).on('click', '#sbh-add-notes', function() {
    createWikiEditor($(this), 'Save Notes', '/updateMutableNotes')
    return false
})


$(document).on('click', '#sbh-edit-notes', function() {
    createWikiEditor($('#sbh-notes'), 'Save Notes', '/updateMutableNotes')
    return false
})

$(document).on('click', '#sbh-add-source', function() {
    createWikiEditor($(this), 'Save Source', '/updateMutableSource')
    return false
})


$(document).on('click', '#sbh-edit-source', function() {
    createWikiEditor($('#sbh-source'), 'Save Source', '/updateMutableSource')
    return false
})


$(document).on('click', '#sbh-add-citations', function() {
    createWikiEditor($(this), 'Save Citations', '/updateCitations')
    return false
})


$(document).on('click', '#sbh-edit-citations', function() {
    createWikiEditor($('#sbh-citations'), 'Save Citations', '/updateCitations')
    return false
})


// https://www.abeautifulsite.net/whipping-file-inputs-into-shape-with-bootstrap-3
//
$(function() {

  // We can attach the `fileselect` event to all file inputs on the page
  $(document).on('change', ':file', function() {
    var input = $(this),
        numFiles = input.get(0).files ? input.get(0).files.length : 1,
        label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
    input.trigger('fileselect', [numFiles, label]);
  });

  // We can watch for our custom `fileselect` event like this
  $(document).ready( function() {
      $(':file').on('fileselect', function(event, numFiles, label) {

          var input = $(this).parents('.input-group').find(':text'),
              log = numFiles > 1 ? numFiles + ' files selected' : label;

          console.log($(this).closest('form').length)
          console.log($(this).closest('form').find('button').length)
          $(this).closest('form').find('button[type=submit]').prop('disabled', false).addClass('btn-success')

          if( input.length ) {
              input.val(log);
          } else {
              //if( log ) alert(log);
          }

      });
  });
  
});

$('#sbh-attachment-form').submit(function(e) {

    e.preventDefault()

    var formData = new FormData($(this)[0])

    console.log($(this))
    console.log($(this)[0])
    console.log($(this).attr('action'))

    console.log(formData)

    $.ajax({
        url: $(this).attr('action'),
        method: 'post',
        data: formData,
        cache: false,
        contentType: false,
        processData: false,
        success: function(data) {
            $('.attachments-table').replaceWith($('<div></div>').html(data).find('.attachments-table'))

            var form = $(':file').val('').closest('form')
            form.find('button[type=submit]').prop('disabled', true).removeClass('btn-success')

            $(':file').parents('.input-group').find(':text').val('')
        }
    })


    return false

})



$('.sbh-sparql-editor').each((i, textarea) => {

    var cm = CodeMirror.fromTextArea(textarea, {
        lineNumbers: true
    })

})


