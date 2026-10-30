/** @jsx Tcaer.createElement */

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

const isEvent = (key) => key.startsWith("on")

const isProperty = (key) =>
  key !== "children" && !isEvent(key)

const createDom = (fiber) => {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type)

  updateDom(dom, {}, fiber.props)

  return dom
}

const isNew = (prev, next) => (key) =>
  prev[key] !== next[key]
const isGone = (prev, next) => (key) => !(key in next)

function updateDom(dom, prevProps, nextProps) {
  // Remove event listener
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(
      (prop) =>
        !(key in nextProps) ||
        isNew(prevProps, nextProps)(key)
    )
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2)
      dom.removeEventListener(eventType, prevProps[name])
    })
  // Remove old property
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone)
    .forEach((prop) => (dom[prop] = ""))
  // Set new or update
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((prop) => {
      dom[prop] = nextProps[prop]
    })
  // Add event listener
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2)
      dom.addEventListener(eventType, nextProps[name])
    })
}

const commitWork = (fiber) => {
  if (!fiber) {
    return
  }
  const domParent = fiber.parent.dom
  // Handle effectTags
  // domParent.appendChild(fiber.dom)
  if (
    fiber.effectTag === "PLACEMENT" &&
    fiber.dom != null
  ) {
    domParent.appendChild(fiber.dom)
  } else if (fiber.effectTag === "DELETION") {
    domParent.removeChild(fiber.dom)
  } else if (
    fiber.effectTag === "UPDATE" &&
    fiber.dom != null
  ) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props)
  }

  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

const commitRoot = () => {
  deletions.forEach(commitWork)
  commitWork(wipRoot.child)
  currentRoot = wipRoot
  wipRoot = null
}

const render = (element, container) => {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  }
  deletions = []
  nextUnitOfWork = wipRoot
}

let nextUnitOfWork = null
let wipRoot = null
let currentRoot = null
let deletions = null

function workLoop(deadline) {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    shouldYield = deadline.timeRemaining() < 1
  }
  if (!nextUnitOfWork && wipRoot) {
    commitRoot()
  }
  requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

function performUnitOfWork(fiber) {
  if (fiber.dom == null) {
    fiber.dom = createDom(fiber)
  }

  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom)
  }

  const elements = fiber.props.children
  reconcileChildren(fiber, elements)

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

function reconcileChildren(wipFiber, elements) {
  let index = 0
  let oldFiber =
    wipFiber.alternate && wipFiber.alternate.child
  let prevSibling = null

  while (index < elements.length || oldFiber != null) {
    const element = elements[index]
    let newFiber = null

    // TODO: compare oldFiber with element
    const sameType =
      oldFiber && element && element.type == oldFiber.type
    if (sameType) {
      // Update
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      }
    }
    if (element && !sameType) {
      // Add new element
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      }
    }
    if (oldFiber && !sameType) {
      // Delete old fiber's node
      oldFiber.effectTag = "DELETION"
      deletions.push(oldFiber)
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling
    }

    if (index === 0) {
      wipFiber.child = newFiber
    } else if (element) {
      prevSibling.sibling = newFiber
    }

    prevSibling = newFiber
    index++
  }
}

const Tcaer = {
  createElement,
  render,
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
    return (
      /** @jsx Tcaer.createElement */
      <div
        style={`width:${CELL}px;height:${CELL}px;background:${color};display:inline-block`}
      />
    )
  }
  return (
    /** @jsx Tcaer.createElement */
    <div style="display:inline">
      {buildHeavyTree(depth - 1, index * 2)}
      {buildHeavyTree(depth - 1, index * 2 + 1)}
    </div>
  )
}

const container = document.getElementById("root")

// container.style = `width:${COLS * CELL}px;line-height:0;font-size:0`

// const heavyElement = buildHeavyTree(DEPTH)

// console.time("render")
// Tcaer.render(heavyElement, container)
// console.timeEnd("render")

function App(props) {
  return (
    <button onClick={() => alert("test")}>Click me</button>
  )
}

Tcaer.render(<App />, container)
