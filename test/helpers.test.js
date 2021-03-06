/* eslint "max-len": "off" */
import test from 'tape'
import spected from 'spected'
import {zipObj} from 'ramda'
import {
  getCurrentState,
  createMachines,
  getTransitionsForMachine,
  getStateInputsForMachine,
  getStateInputsForAllMachines
} from '../src/machines'
import {createPayloadValidationsLogger, createPayloadPruner} from '../src/validators'
import {isStringieThingie} from '../src/util'
import {isOldEnough, isYoungEnough, isValidEmail, isLongerThan, isShorterThan} from './util'

test('getTransitionsForMachine', (t) => {
  const machine = {
    init: {
      ACTION_TYPE2: 'two',
      ACTION_TYPE1: 'one'
    },
    one: {
      ACTION_TYPE2: 'two'
    },
    two: {
      ACTION_TYPE1: 'one'
    }
  }

  t.deepEqual(
    getTransitionsForMachine(machine),
    ['two', 'one'],
    'verify the transitions are extracted from each the nested object'
  )
  t.deepEqual(
    getTransitionsForMachine({...machine, three: {}}),
    ['two', 'one'],
    'verify it isn\'t just pulling the keys from the machine'
  )
  t.end()
})

test('getStateInputsForMachine', (t) => {
  const machine = {
    init: {
      ACTION_TYPE2: 'two',
      ACTION_TYPE1: 'one'
    },
    one: {
      ACTION_TYPE2: 'two'
    },
    two: {
      ACTION_TYPE1: 'one'
    }
  }

  t.deepEqual(
    getStateInputsForMachine(machine),
    ['ACTION_TYPE2', 'ACTION_TYPE1'],
    'verify the inputs are extracted from each of the nested objects'
  )
  t.end()
})

test('getStateInputsForAllMachines', (t) => {
  const mockDuck = {
    machines: {
      auth: {
        init: {
          ACTION_TYPE2: 'two',
          ACTION_TYPE1: 'one'
        },
        one: {
          ACTION_TYPE2: 'two'
        },
        two: {
          ACTION_TYPE1: 'one'
        }
      },
      notAuth: {
        init: {
          ACTION_TYPE2: 'notTwo',
          ACTION_TYPE1: 'notOne',
          FREEZE: 'disabled'
        },
        notOne: {
          ACTION_TYPE2: 'notTwo',
          FREEZE: 'disabled'
        },
        notTwo: {
          ACTION_TYPE1: 'notOne',
          FREEZE: 'disabled'
        },
        disabled: {}
      }
    }
  }

  t.deepEqual(
    getStateInputsForAllMachines(mockDuck),
    ['ACTION_TYPE2', 'ACTION_TYPE1', 'FREEZE'],
    'verify the inputs are extracted from each of the nested objects on each of the duck\'s machines'
  )
  t.end()
})

test('createPayloadValidationsLogger', (t) => {
  const validators = {
    TEST_VALIDATOR: spected({
      email: [
        [isStringieThingie, 'Email is required'],
        [isValidEmail, 'Invalid format for email address']
      ],
      user: {
        name: {
          first: [
            [isStringieThingie, 'First name is required'],
            [isLongerThan(2), 'Come on now; be serious. What\'s your REAL name?'],
            [isShorterThan(200), 'Your name is too long; have you considered a nickname?']
          ],
          last: [
            [isStringieThingie, 'Last name is required'],
            [isLongerThan(2), 'Your last name is too short; ask your parents for more letters'],
            [isShorterThan(200), 'Your last name is too long; English speakers are lazy and give up pronouncing words with more than five syllables']
          ]
        },
        age: [
          [isOldEnough, 'You are too young; please go get your parents'],
          [isYoungEnough, 'Impressive that you can operate a computer without punch-cards, but seriously you are way too old']
        ]
      }
    })
  }

  const validator = createPayloadValidationsLogger(validators)
  const pruner = createPayloadPruner(validators)

  t.deepEqual(
    validator({type: 'TEST_VALIDATOR', user: {name: {first: 'lorem', last: 'ipsum'}, age: 11}}),
    {user: {age: ['You are too young; please go get your parents']}},
    'confirm failing validations returns an object of validation errors'
  )
  t.deepEqual(
    pruner({type: 'TEST_VALIDATOR', user: {name: {first: 'lorem', last: 'ipsum'}, age: 11}}),
    {type: 'TEST_VALIDATOR', user: {name: {first: 'lorem', last: 'ipsum'}}},
    'confirm failing validations are pruned from the dispatched action'
  )
  t.deepEqual(
    validator({type: 'TEST_VALIDATOR', user: {name: {first: 'lorem', last: 'ipsum'}, age: 19, something: 'else'}}),
    null,
    'confirm passing validations returns null for validation errors'
  )
    
  t.end()
})

test('getCurrentState', (t) => {
  const initialState = {
    states: {
      auth: 'initial',
      termsOfService: 'initial'
    }
  }
  const types = ['LOGIN_SUCCESSFUL', 'LOGOUT_SUCCESSFUL', 'AGREE_TO_TERMS', 'REJECTED_TERMS']
  const machines = {
    auth: {
      initial: {
        LOGIN_SUCCESSFUL: 'loggedIn'
      },
      loggedIn: {
        LOGOUT_SUCCESSFUL: 'loggedOut'
      },
      loggedOut: {
        LOGIN_SUCCESSFUL: 'loggedIn'
      }
    },
    termsOfService: {
      initial: {
        AGREE_TO_TERMS: 'agreed',
        REJECTED_TERMS: 'rejected'
      },
      agreed: {},
      rejected: {}
    }
  }

  test('...fails to createMachines when inputs aren\'t action types', (nt) => {
    nt.deepEqual(
      createMachines(machines, {types: {ONE: 'ONE', TWO: 'TWO', THREE: 'THREE'}}), {
        auth: {initial: {}, loggedIn: {}, loggedOut: {}},
        termsOfService: {initial: {}, agreed: {}, rejected: {}}
      }, 'machines are empty if input types aren\'t registered'
    )
    nt.end()
  })

  test('...succeeds in createMachines attempt when inputs are also action types', (nt) => {
    nt.deepEqual(
      createMachines(machines, {types: zipObj(types, types)}),
      machines,
      'machines contain all the registered action types as inputs'
    )
    nt.end()
  })

  test('...fails gracefully', (nt) => {
    nt.deepEqual(getCurrentState()(), {}, 'always returns an object')
    nt.end()
  })

  test('...retrieves current state of each machine', (nt) => {
    nt.deepEqual(
      getCurrentState({machines, stateMachinesPropName: 'states'})(initialState),
      {auth: 'initial', termsOfService: 'initial'},
      'verify the current state of \'initial\''
    )
    nt.end()
  })
  t.end()
})
