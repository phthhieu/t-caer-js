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

const Tcaer = {
  createElement,
  render,
}

/** @jsx Tcaer.createElement */
const element = (
  <div style="font-size: 64px;">
    <div style="background: yellow; color: green; padding: 8px; text-align: center;">
      Hello world
    </div>
    <div style="background: green; color: yellow; margin-top: 12px; padding: 8px; text-align: center">
      This is T-caer
    </div>
  </div>
)

const container = document.getElementById("root")

Tcaer.render(element, container)
