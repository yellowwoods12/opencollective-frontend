import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import 'react-quill/dist/quill.snow.css';

import { upload } from '../lib/api';
import LoadingPlaceholder from './LoadingPlaceholder';

/*
 * Simple editor component that takes placeholder text as a prop
 */
class HTMLEditor extends React.Component {
  static propTypes = {
    placeholder: PropTypes.string,
    defaultValue: PropTypes.string,
    className: PropTypes.string,
    onChange: PropTypes.func,
    LoadingPlaceholderheight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** Use `false` instead of a number to disable a title level. eg. [false, 2, 3] */
    allowedHeaders: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.bool])),
  };

  static defaultProps = {
    allowedHeaders: [1, 2, false],
    LoadingPlaceholderheight: 242,
  };

  constructor(props) {
    super(props);
    this.state = { editorHtml: props.defaultValue, theme: 'snow' };
    this.handleChange = this.handleChange.bind(this);
    this.saveToServer = this.saveToServer.bind(this);
    this.insertToEditor = this.insertToEditor.bind(this);
    if (typeof window !== 'undefined') {
      this.ReactQuill = require('react-quill');
    }

    /*
     * Quill modules to attach to editor
     * See https://quilljs.com/docs/modules/ for complete options
     */
    this.modules = {
      // See https://quilljs.com/docs/modules/toolbar/
      toolbar: {
        container: [
          [{ header: props.allowedHeaders }],
          ['bold', 'italic', 'underline', 'blockquote'],
          [{ color: [] }],
          [{ align: '' }, { align: 'center' }, { align: 'right' }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'image'],
        ],
        handlers: {
          image: () => {
            this.selectLocalImage();
          },
        },
      },
      // See https://quilljs.com/docs/modules/clipboard/
      clipboard: {
        // toggle to add extra line breaks when pasting HTML:
        matchVisual: false,
      },
    };

    /*
     * Quill editor formats
     * See https://quilljs.com/docs/formats/
     */
    this.formats = [
      'align',
      'color',
      'header',
      'font',
      'size',
      'bold',
      'italic',
      'underline',
      'strike',
      'blockquote',
      'list',
      'bullet',
      'indent',
      'link',
      'image',
      'video',
    ];
  }

  componentDidUpdate(oldProps) {
    if (this.props.value !== oldProps.value) {
      this.setState({ editorHtml: this.props.value });
    }
  }

  handleChange(html) {
    this.setState({ editorHtml: html });
    this.props.onChange(html);
  }

  selectLocalImage() {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.click();

    // Listen upload local image and save to server
    input.onchange = () => {
      const file = input.files[0];

      // file type is only image.
      if (/^image\//.test(file.type)) {
        this.saveToServer(file);
      } else {
        console.warn('You can only upload images.');
      }
    };
  }

  /**
   * Step2. save to server
   *
   * @param {File} file
   */
  saveToServer(file) {
    upload(file)
      .then(fileUrl => {
        return this.insertToEditor(fileUrl);
      })
      .catch(e => {
        console.error('Error uploading image', e);
      });
  }

  /**
   * Step3. insert image url to rich editor.
   *
   * @param {string} url
   */
  insertToEditor(url) {
    const editor = this.reactQuillRef.getEditor();
    // push image url to rich editor.
    const range = editor.getSelection();
    editor.insertEmbed(range.index, 'image', url);
  }

  render() {
    if (!this.ReactQuill) {
      return <LoadingPlaceholder height={this.props.LoadingPlaceholderheight} />;
    }

    return (
      <div className={classNames('HTMLEditor', this.props.className)} data-cy="HTMLEditor">
        <style jsx>
          {`
            .HTMLEditor :global(.quill) {
              height: auto;
            }
            .HTMLEditor :global(.quill) {
              height: auto;
            }
            .HTMLEditor :global(.ql-container) {
              min-height: 20rem;
              max-height: 35rem;
              overflow-y: auto;
              border: 1px solid #dcdee0;
              border-radius: 4px;
            }
            .HTMLEditor :global(.ql-toolbar) {
              border: 1px solid #dcdee0;
              border-radius: 4px;
            }
            .HTMLEditor.small :global(.quill) {
              height: auto;
              min-height: 20rem;
            }
            .HTMLEditor.small :global(.ql-container) {
              height: 15rem;
            }
          `}
        </style>
        <this.ReactQuill
          ref={el => (this.reactQuillRef = el)}
          theme="snow"
          onChange={this.handleChange}
          value={this.state.editorHtml || ''}
          defaultValue={this.props.defaultValue || ''}
          modules={this.modules}
          formats={this.formats}
          bounds={'.app'}
          placeholder={this.props.placeholder}
        />
      </div>
    );
  }
}

export default HTMLEditor;
