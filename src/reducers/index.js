import { addTransitionsToState, getNextState } from "../machines"

/**
 * Creates a layered reducer which invokes one and then the other, passing in
 * the result of the first reducer as the 'state' param to the second reducer.
 *
 * @function
 * @sig {k: v} -> {k: v} -> {k: v} -> {k: v} -> {k: v}
 * @param {Object} parentOptions An options object for a duck being extended, containing
 * types, consts, validators and other helpers that are used to carry out the reducer's logic
 * @param {Object} childOptions An options object for a duck that has yet to be created
 * but which are being extened from an existing duck to validate the action and (potentially)
 * apply a change to state.
 * @param {Object} state The current state of a certain portion of the store
 * @param {Object} action A dispatched redux action, with (at minimum) a 'type' prop
 * @param {Object} duck A duck, containing types, consts, validators and other
 * helpers that are used to carry out the reducer's logic
 * @returns {Object} Returns a clone of the state, potentially different than
 * the original state if the action object caused a change. Because this is a
 * curried function, you can omit the final two params (state and action) to set
 * this partially curried function as a redux reducer in the combineReducers() setup.
 */
export function makeExtendedReducer(parentOptions) {
  const parentReducer = parentOptions && parentOptions.reducer
    ? parentOptions.reducer
    : val => val

  return (childOptions, state, action, duck) => {
    const reducedState = parentReducer(state == null ? duck.initialState : state, action, duck)
    const reducer = childOptions && childOptions.reducer
      ? childOptions.reducer
      : val => val
    return reducer(reducedState, action, duck)
  }
}

/**
 * Parses the reducer from a duck (inside the 'options' prop),
 * wraps it with the duck (as context) so that the reducer code will be able to execute
 * (as it likely parses the types or other items from the duck to carry out its logic on the action payload).
 * The resulting function is then ready to be passed state and a dispatched action.
 *
 * @function
 * @sig {k: v} -> ((a, b) -> a)
 * @param {Object} duck A duck, containing a reducer prop inside of its options prop
 * @returns {function} A wrapped reducer, ready to be invoked with state and action params
 */
export function createReducer(duck) {
  const reducer = duck && duck.options && duck.options.reducer
    ? duck.options.reducer
    : val => val
  return (state, action) => reducer(state, action, duck)
}

/**
 * Parses the reducer from a duck (inside the 'options' prop),
 * wraps it with the duck (as context) so that the reducer code will be able to execute
 * (as it likely parses the types or other items from the duck to carry out its logic on the action payload),
 * and finally a state machine transitions validation is appended to the
 * reducer, so that the portion of the store that tracks state transitions will
 * be updated.
 * The resulting function is then ready to be passed state and a dispatched action.
 *
 * @function
 * @sig {k: v} -> ((a, b) -> a)
 * @param {Object} duck A duck, containing a reducer prop inside of its options prop
 * @returns {function} A wrapped reducer, ready to be invoked with state and action params
 */
export function createTransitionsPostReducer(duck) {
  const reducer = duck && duck.options && duck.options.reducer
    ? duck.options.reducer
    : val => val
  return (state, action) => {
    const stateWithTransitions = addTransitionsToState(state == null ? duck.initialState : state, duck)

    const updatedStates = { [duck.stateMachinesPropName]: getNextState(stateWithTransitions, action, duck) }
    return {
      ...reducer({ ...stateWithTransitions, ...updatedStates }, action, duck),
      ...updatedStates
    }
  }
}
