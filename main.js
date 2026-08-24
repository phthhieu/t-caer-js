// Ref: https://pomb.us/build-your-own-react/
// Step I: The createElement Function
// Step II: The render Function
// Step III: Concurrent Mode
// Step IV: Fibers
// Step V: Render and Commit Phases
// Step VI: Reconciliation
// Step VII: Function Components
// Step VIII: Hooks

const element = (
    <div id="food">
        <a>bar</a>
        <br />
    </div>
)

const container = document.getElementById("root")

ReactDOM.render(element, container)
