/* global window, $, marked, ace, preview, document, location, Prism, resizeSlides,Selectize */
Selectize.define('input_maxlength', function (options) {
  const self = this;
  this.setup = (function () {
    const original = self.setup;
    return function () {
      original.apply(this, arguments);
      this.$control_input.attr('maxlength', this.settings.input_maxlength);
    };
  }());
});

const isCreate = () => location.href.indexOf('create') > 0;

const unsavedCreateIsExist = () => {
  if (localStorage.getItem('unsavedCreate')) {
    let unsavedCreate = {};
    try {
      unsavedCreate = JSON.parse(localStorage.getItem('unsavedCreate'));
      if (unsavedCreate.subject
          || unsavedCreate.tags
          || unsavedCreate.markdown) {
        return true;
      }
    } catch (e) {}
  }
  return false;
};

const loadUnsavedCreate = () => {
  if (unsavedCreateIsExist() && confirm('There were unsaved data. Do you want load?')) {
    const unsavedCreate = JSON.parse(localStorage.getItem('unsavedCreate'));
    document.getElementById('id_subject').setAttribute('value', unsavedCreate.subject);
    document.getElementById('id_tags').setAttribute('value', unsavedCreate.tags);
    document.getElementById('id_markdown').setAttribute('value', unsavedCreate.markdown);
  }
  return false;
};

$(() => {
  const editor = ace.edit('markdown_editor');
  const aceSession = editor.getSession();
  const existMarkdownValue = document.getElementById('exist_markdown').value;

  const unsavedCreate = {
    subject: '',
    tags: '',
    markdown: '',
  };

  if (existMarkdownValue) {
    editor.setValue(existMarkdownValue);
  } else if (isCreate()) {
    loadUnsavedCreate();
  }

  const idMarkdownValue = document.getElementById('id_markdown').value;

  if (idMarkdownValue) {
    editor.setValue(idMarkdownValue);
  }

  const appendSlide = (content, index) => {
    const $preview = $('.preview');
    $preview.append(`<div class="callout secondary slide data-slide-${index}">${marked(content)}</div>`);
  };

  const md2html = () => {
    const markdownContent = editor.getValue();
    const markdownSlides = markdownContent.split(/={5,}/);
    const $preview = $('.preview');

    $preview.html('');
    markdownSlides.forEach((v, i) => {
      appendSlide(v, i);
    });
    Prism.highlightAll(); // highlights code blocks
    resizeSlides(false, $preview);

    document.getElementById('id_markdown').value = editor.getValue();
    unsavedCreate.subject = document.getElementById('id_subject').value;
    unsavedCreate.tags = document.getElementById('id_tags').value;
    unsavedCreate.markdown = document.getElementById('id_markdown').value;

    localStorage.setItem('unsavedCreate', JSON.stringify(unsavedCreate));
  };

  editor.setTheme('ace/theme/tomorrow_night_bright');
  aceSession.setMode('ace/mode/markdown_warp');
  editor.renderer.setShowGutter(false);
  md2html();
  editor.on('change', md2html);
  editor.on('changeSelection', () => {
    preview.syncWithEditorCaret(editor);
  });

  marked.setOptions({
    langPrefix: 'language-',
  });

  resizeSlides(false, $('.preview'));
  $(window).resize(() => {
    resizeSlides(false, $('.preview'));

    // When the screen is resized, the scroll position of preview is also changed,
    // so that user might be disappointed.
    // Because of the above case, we should sync preview with editor cursor on every resizing.
    preview.syncWithEditorCaret(editor);
  });

  $('#id_tags').selectize({
    plugins: ['remove_button', 'input_maxlength'],
    delimiter: ',',
    persist: false,
    input_maxlength: 15,
    createFilter(input) {
      const minLength = 2;
      return input.length >= minLength;
    },
    create(input) {
      return {
        value: input.replace(/\s/gi, '_').replace(/,/gi, ''),
        text: input.replace(/\s/gi, '_').replace(/,/gi, ''),
      };
    },
  });
});


const addHidden = (form, key, value) => {
  // Create a hidden input element, and append it to the form:
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = key; // 'the key/name of the attribute/field that is sent to the server
  input.value = value;
  form.appendChild(input);
};

const publish = () => {
  const form = document.getElementById('form_html');

  addHidden(form, 'subject', $('#id_subject').val());
  addHidden(form, 'tags', $('#id_tags').val());
  addHidden(form, 'is_public', $(':radio[name=is_public]:checked').val());

  localStorage.setItem('unsavedCreate', '');
  form.submit();
};
