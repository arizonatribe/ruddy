import test from 'tape'
import {createDuck, extendDuck} from '../src/duck'

test('lets the original reducer reference the duck instance', (t) => {
  const duck = createDuck({
    types: ['FETCH'],
    reducer: (state, action, { types }) => {
      switch (action.type) {
      case types.FETCH:
        return {worked: true}
      default:
        return state
      }
    }
  })
  t.deepEqual(
    duck.reducer({}, {type: duck.types.FETCH}),
    {worked: true},
    'verify the reducer was invoked and changed the store in response to a FETCH action type'
  )
  t.end()
})

test('adds the new reducer keeping the old ones', (t) => {
  const parentDuck = createDuck({
    reducer: (state, action) => {
      switch (action.type) {
      case 'FETCH':
        return {...state, parentDuck: true}
      default:
        return state
      }
    }
  })
  const duck = extendDuck(parentDuck, {
    reducer: (state, action) => {
      switch (action.type) {
      case 'FETCH':
        return {...state, duck: true}
      default:
        return state
      }
    }
  })
  t.deepEqual(
    duck.reducer({}, {type: 'FETCH'}),
    {parentDuck: true, duck: true},
    'verify the state of the store reflects both parent and child reducers mutations'
  )
  t.end()
})

test('extending still allows the original duck reducer to behave as it did before', (t) => {
  const parentDuck = createDuck({
    reducer: (state, action) => {
      switch (action.type) {
      case 'FETCH':
        return {...state, parentDuck: true}
      default:
        return state
      }
    }
  })
  extendDuck(parentDuck, {
    reducer: (state, action) => {
      switch (action.type) {
      case 'FETCH':
        return {...state, duck: true}
      default:
        return state
      }
    }
  })
  t.deepEqual(
    parentDuck.reducer({}, {type: 'FETCH'}),
    {parentDuck: true},
    'verify that only the parent duck mutates state in response to a FETCH action type'
  )
  t.end()
})
