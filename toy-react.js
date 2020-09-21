const RENDER_TO_DOM = Symbol("render to dom")

class ElementWraaper {
  constructor(tag) {
    this.root = document.createElement(tag)
  }

  setAttribute(name, value) {
    //dom添加事件
    if (name.match(/^on([\s\S]+)$/)) {
      this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
    } else if (name === 'className') {
      this.root.setAttribute('class', value)
    } else {
      this.root.setAttribute(name, value)
    }
  }

  appendChild(component) {
    let range = document.createRange()
    range.setStart(this.root, this.root.childNodes.length)
    range.setEnd(this.root, this.root.childNodes.length)
    component[RENDER_TO_DOM](range)
  }

  [RENDER_TO_DOM](range) {
    range.deleteContents()
    range.insertNode(this.root)
  }
}

class TextWraaper {
  constructor(text) {
    this.root = document.createTextNode(text)
  }

  [RENDER_TO_DOM](range) {
    range.deleteContents()
    range.insertNode(this.root)
  }
}

export class Component {
  constructor() {
    this.props = new Object(null)
    this.children = []
    this._root = null
    this._range = null
  }

  setAttribute(name, value) {
    this.props[name] = value
  }

  appendChild(component) {
    this.children.push(component)
  }

  [RENDER_TO_DOM](range) {
    this._range = range
    this.render()[RENDER_TO_DOM](range)
  }

  //重新绘制
  rerender() {
    let oldRange = this._range

    let range = document.createRange()
    range.setStart(oldRange.startContainer, oldRange.startOffset)
    range.setEnd(oldRange.startContainer, oldRange.startOffset)
    this[RENDER_TO_DOM](range)

    oldRange.setStart(range.endContainer, range.endOffset)
    oldRange.deleteContents()
  }

  setState(newState) {
    if (this.state === null || typeof this.state !== 'object') {
      this.state = newState
      this.rerender()
      return
    }
    //执行深拷贝
    const merge = (oldState, newState) => {
      for (let a in newState) {
        if (oldState[a] === null || typeof oldState[a] !== 'object') {
          oldState[a] = newState[a]
        } else {
          merge(oldState[a], newState[a])
        }
      }
    }
    merge(this.state, newState)
    this.rerender()
  }

}

export function createElement(type, attr, ...children) {
  let el;
  if (typeof type === 'string') {
    el = new ElementWraaper(type)
  } else {
    el = new type
  }
  for (let a in attr) {
    el.setAttribute(a, attr[a])
  }
  let insertChildren = (children) => {
    for (let child of children) {
      if (child === null) {
        continue
      }
      if (typeof child === 'string') {
        child = new TextWraaper(child)
      }
      if (typeof child === 'object' && child instanceof Array) {
        insertChildren(child)
      } else {
        el.appendChild(child)
      }
    }
  }
  insertChildren(children)
  return el
}

export function render(component, parentElement) {
  let range = document.createRange()
  range.setStart(parentElement, 0)
  range.setEnd(parentElement, parentElement.childNodes.length)
  range.deleteContents()
  component[RENDER_TO_DOM](range)
}