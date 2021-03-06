import React from 'react';
import { shallow, mount } from 'enzyme';
import { EditorState, Entity } from 'draft-js';
import createStore from '../../../../utils/createStore';
import tooltipEnhancer from '../tooltipEnhancer';

describe('tooltipEnhancer component', () => {
  let editorState;
  let store;

  beforeEach(() => {
    editorState = EditorState.createEmpty();
    store = createStore({
      data: null,
    });
  });

  it('render wrapper with children', () => {
    const ComponentToWrap = () => (
      <span>component</span>
    );

    const EnhanceComponent = tooltipEnhancer(ComponentToWrap);

    const wrapper = shallow(
      <EnhanceComponent store={store} />
    );

    expect(wrapper.find('span').length).toEqual(1);
    expect(wrapper.find(ComponentToWrap).length).toEqual(1);
  });

  it('handle mouse enter and leave', () => {
    const entityKey = Entity.create('TEST', 'IMMUTABLE', {
      key: 'value',
    });

    const ComponentToWrap = () => (
      <span>component</span>
    );

    const EnhanceComponent = tooltipEnhancer(ComponentToWrap);

    const wrapper = mount(
      <EnhanceComponent entityKey={entityKey} store={store} />
    );

    wrapper.simulate('mouseenter');

    expect(store.getItem('data').entityKey).toBe('1');
    expect(store.getItem('data').target).toBe(wrapper.childAt(0).root.nodes[0].wrapper);

    wrapper.simulate('mouseleave');

    expect(store.getItem('data')).toEqual(null);
  });
});
