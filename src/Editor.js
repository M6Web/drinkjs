import React, { Component, PropTypes } from 'react';

import Draft, { EditorState, RichUtils, convertFromRaw, convertToRaw } from 'draft-js';
import Editor from 'draft-js-plugins-editor';
import Immutable from 'immutable';

import 'draft-js/dist/Draft.css';
import './Draft.css';

import styles from './Editor.css';

const blockRenderMap = Immutable.Map({
  'paragraph': {
    element: 'paragraph'
  },
  'unstyled': {
    element: 'paragraph'
  }
});

const extendedBlockRenderMap = Draft.DefaultDraftBlockRenderMap.merge(blockRenderMap);

class DrinkEditor extends Component {
  static propTypes = {
    state: PropTypes.object,
    readOnly: PropTypes.bool,
    onChange: PropTypes.func,
    plugins: PropTypes.array,
  }

  static defaultProps = {
    onChange: () => {},
    readOnly: false,
    plugins: [],
  }

  constructor(props) {
    super(props);

    const { state, onChange } = props;

    this.state = {
      editorState: state ?
        EditorState.push(EditorState.createEmpty(), convertFromRaw(state)) :
        EditorState.createEmpty(),
    };

    this.onChange = (editorState) => {
      onChange(convertToRaw(editorState.getCurrentContent()));
      this.setState({ editorState });
    };

    this.onTab = (e) => {
      const maxDepth = 4;
      this.onChange(RichUtils.onTab(e, this.state.editorState, maxDepth));
    };

    this.handleKeyCommand = this.handleKeyCommand.bind(this);
  }

  renderPlugins() {
    const { plugins } = this.props;

    return plugins.reduce((prev, curr) => {
      curr.InlineToolbar && prev.push(React.createElement(curr.InlineToolbar, {
        key: 'inline-toolbar',
      }));

      curr.SideToolbar && prev.push(React.createElement(curr.SideToolbar, {
        key: 'side-toolbar',
      }));

      return prev;
    }, []);
  }

  handleKeyCommand(command: string): DraftHandleValue {

    const { editorState } = this.state;

    if (command === 'delete' ) {

      const contentState = editorState.getCurrentContent();
      const selectionState = editorState.getSelection();
      const blockMap = contentState.getBlockMap();
      const startKey = selectionState.getStartKey();
      const endKey =  selectionState.getEndKey();
      const startOffset = selectionState.getStartOffset();
      const endOffset = selectionState.getEndOffset();
      const startBlock = blockMap.get(startKey);
      const endBlock = blockMap.get(endKey);
      let mergeBlocks = [];

      //change the way to delete blocks if startblock is empty or if last block is not fully deleted
      if(startBlock.getText().length == 0 || endOffset < endBlock.getText().length)
      {

          // Get blocks before and after selection
          const blocksBefore = blockMap.toSeq().takeUntil((_,v) => (v === startKey));
          const blocksAfter = blockMap.toSeq().skipUntil((_,v) => (v === endKey)).rest();
          //get focus key (would be the block just after the last deleted one)
          let focusKey = editorState.getCurrentContent().getKeyAfter(endKey);

          //if part of lastblock must be kept, create a new block with remaining text
          if(endOffset < endBlock.getText().length){
            let modifiedEndBlock =  endBlock.merge({
              text: endBlock.getText().slice(endOffset),
              type: endBlock.getType()
            });
            mergeBlocks.push([modifiedEndBlock.getKey(), modifiedEndBlock]);
            //change focus key
            focusKey = modifiedEndBlock.getKey();
          }


          //merge blocks without deleted selection
          const newBlocks = blocksBefore.concat(mergeBlocks,blocksAfter).toOrderedMap();

          //create new content state with new blocks
          //focus defined on block just after last deleted one
          const newContentState = contentState.merge({
            blockMap: newBlocks,
            selectionBefore: selectionState,
            selectionAfter: selectionState.merge({
              anchorKey: focusKey,
              anchorOffset: 0,
              focusKey: focusKey,
              focusOffset: 0,
              isBackward: false
            })
          });

          //create new editor state from current state and new content state
          const newEditorState = EditorState.push(editorState, newContentState);

          if (newEditorState) {
              this.onChange(newEditorState);
              return 'handled';
            }
      }
    }
    return 'not-handled';
  }

  renderPlugins() {
    const { plugins } = this.props;

    return plugins.reduce((prev, curr) => {
      curr.InlineToolbar && prev.push(React.createElement(curr.InlineToolbar, {
        key: 'inline-toolbar',
      }));

      curr.SideToolbar && prev.push(React.createElement(curr.SideToolbar, {
        key: 'side-toolbar',
      }));

      return prev;
    }, []);
  }

  render() {
    const { editorState } = this.state;
    const { plugins, readOnly } = this.props;

    return (
      <div className={styles.editor}>
        <Editor
          editorState={editorState}
          onChange={this.onChange}
          onTab={this.onTab}
          placeholder="Write something..."
          blockRenderMap={extendedBlockRenderMap}
          readOnly={readOnly}
          plugins={plugins}
        />

        {this.renderPlugins()}
      </div>
    );
  }
}

export default DrinkEditor;
