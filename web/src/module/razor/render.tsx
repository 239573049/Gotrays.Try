// @ts-nocheck
import * as React from 'react';

// 对应razor组件

/**
 * 用于渲染Blazor组件
 */
class RenderView extends React.Component {
  render() {
    // 对应razor组件
    return (
      <render-razor></render-razor>
    )
  }
}

/**
 * 显示全局Using引用 
 */
class UsingList extends React.Component {
  render() {
    return (<global-using></global-using>)
  }
}

export {
  RenderView,
  UsingList
}