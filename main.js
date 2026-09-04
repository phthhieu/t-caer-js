// Ref: https://pomb.us/build-your-own-react/
// Step I: The createElement Function
// Step II: The render Function
// Step III: Concurrent Mode
// Step IV: Fibers
// Step V: Render and Commit Phases
// Step VI: Reconciliation
// Step VII: Function Components
// Step VIII: Hooks

const createTextElement = (text) => {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  }
}
const createElement = (type, props, ...children) => {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === "object"
          ? child
          : createTextElement(child)
      ),
    },
  }
}

const render = (element, container) => {
  const dom =
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type)

  const isProperty = (key) => key !== "children"

  Object.keys(element.props)
    .filter(isProperty)
    .forEach((name) => (dom[name] = element.props[name]))

  element.props.children.forEach((child) =>
    render(child, dom)
  )

  container.appendChild(dom)
}

function createDom(fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type)

  const isProperty = (key) => key !== "children"

  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach((name) => (dom[name] = fiber.props[name]))

  return dom
}

const asyncRender = (element, container) => {
  function performNextUnitOfWork(fiber) {
    // Fiber node:
    // ┌──────────────────────────────────────────────┐
    // │  props, dom, type                            │
    // │  parent  ──────────────────────────────────► │ parent fiber
    // │  child   ──────────────────────────────────► │ first child
    // │  sibling ──────────────────────────────────► │ next sibling
    // └──────────────────────────────────────────────┘
    if (fiber.dom == null) {
      fiber.dom = createDom(fiber)
    }

    if (fiber.parent) {
      fiber.parent.dom.appendChild(fiber.dom)
    }

    const elements = fiber.props.children
    let index = 0
    let prevSibling = null

    while (index < elements.length) {
      const element = elements[index]
      const newFiber = {
        type: element.type,
        props: element.props,
        parent: fiber,
        dom: null,
      }
      if (index === 0) {
        fiber.child = newFiber
      } else {
        prevSibling.sibling = newFiber
      }
      prevSibling = newFiber
      index++
    }
    if (fiber.child) {
      return fiber.child
    }
    let nextFiber = fiber
    while (nextFiber) {
      if (nextFiber.sibling) {
        return nextFiber.sibling
      }
      nextFiber = nextFiber.parent
    }
  }

  root = {
    dom: container,
    props: {
      children: [element],
    },
  }

  let nextUnitOfWork = root

  function commitWork(fiber) {
    if (fiber == null) {
      return
    }
    const parent = fiber.parent.dom
    console.log("fiber dom", fiber.dom)
    parent.appendChild(fiber.dom)
    commitWork(fiber.child)
    commitWork(fiber.sibling)
  }

  function workLoop() {
    while (nextUnitOfWork != null) {
      nextUnitOfWork = performNextUnitOfWork(nextUnitOfWork)
    }

    commitWork(root.child)
  }
  requestIdleCallback(workLoop)
}

const Tcaer = {
  createElement,
  render,
  asyncRender,
}

const DEPTH = 16
const COLS = 256
const CELL = 8

const WAVE_PERIOD = 8

const t = Date.now() / 1000

const plasmaColor = (index) => {
  const col = index % COLS
  const row = Math.floor(index / COLS)
  const f1 = Math.sin(col / WAVE_PERIOD + t)
  const f2 = Math.sin(row / WAVE_PERIOD + t)
  const f3 = Math.sin((row + col) / (WAVE_PERIOD * 1.5) + t)
  const f4 = Math.sin(
    Math.sqrt(col * col + row * row) / WAVE_PERIOD + t
  )
  const hue = (f1 + f2 + f3 + f4) * 45 + 180
  return {
    color: `hsl(${hue},90%,55%)`,
    col,
    row,
  }
}

const buildHeavyTree = (depth, index = 0) => {
  if (depth === 0) {
    const { color } = plasmaColor(index)
    return Tcaer.createElement("div", {
      style: `width:${CELL}px;height:${CELL}px;background:${color};display:inline-block`,
    })
  }
  return Tcaer.createElement(
    "div",
    { style: "display:inline" },
    buildHeavyTree(depth - 1, index * 2),
    buildHeavyTree(depth - 1, index * 2 + 1)
  )
}

const container = document.getElementById("root")
// container.style = `width:${COLS * CELL}px;line-height:0;font-size:0`

/** @jsx Tcaer.createElement */
const heavyElement = (
  <div>
    <span>
      <span />
      <span />
    </span>
    <span />
  </div>
)

console.time("render")
Tcaer.asyncRender(heavyElement, container)
console.timeEnd("render")
