# Ruddy

<img
  src="https://raw.githubusercontent.com/arizonatribe/ruddy/master/media/logo.png"
  alt="Ruddy JS"
  width="250"
  height="250"
  align="right"
/>

Modularized state-management tools for modern front-end applications. With it you can manage dispatched messages in a clean and predictable way - for either small or large scale projects.

## State Management Tooling

Working on front-end applications you spend a good amount of time interacting with data sources. Various data validation and data re-shaping operations are needed to manage larger maps of JSON in centralized "stores". Funneling data through those pipelines cleanly and efficiently is a challenge.

Tools like [Redux](https://github.com/reactjs/redux) can help to manage state in large applications with large datasets. Redux introduced a middleware chain to the which mirrors the way back-end frameworks leverage middleware to handle inbound http requests. And when users interact with the web application "Actions" are dispatched into the Redux middleware chain, at the end of which a change is usually produced in the store. There are many tools compatible with this middleware flow and it's easy to write your own. __Ruddy__ is one of those attempts and it is itself part of a chain of ideas floating around the React and Redux communities.

## Modular Redux proposal

Several years back Erik Rasmussen (the author of [Redux Form](https://github.com/erikras/redux-form)) [suggested an approach to managing Redux boilerplate](https://github.com/erikras/ducks-modular-redux) so that the component itself would be more reusable across applications. He found himself often copying and pasting from a predicable template of boilerplate code, and suggested some modularization patterns to help avoid the pitfalls. The Ruby and Java ecosystems have their names own names for modules and he suggested a name from the last syllable of Redux, so "ducks" 🦆 are now a (somewhat) common way to refer to these modularized bundles of Redux boilerplate.

## Extensible ducks

Several implementations of modularized ducks are available across the Redux ecosystem, [one in particular is extensible](https://github.com/investtools/extensible-duck) and provides the entire module to any function you write within it (your Reducers, Selectors, Action Creators all have access to their own parent object). With it you can work with fully namespaced types without having to type out long `Strings` all the time. This now feels even more familiar as popular libraries like GraphQL and their server-side implementations heavily use a context object where your individual resolves can have access on each inbound request.

Ruddy is forked from that library and adds several additional pieces, resulting in a full middleware solution (micro-framework). Some of its additions include:

* state machines
* web workers
* rich form validations
* action enhancers
* action multipliers
* action throttling/debouncing/depth-limiting

Your programming paradigm - functional or object-oriented - is up to you, and Ruddy just provides the tools for working with Objects (actions) dispatched into a middleware chain.

### Inspirations and/or Dependencies

* [modular redux proposal](https://github.com/erikras/ducks-modular-redux) - Inspired the creation of `extensible-duck`
* [Extensible-Duck](https://github.com/investtools/extensible-duck) - Ruddy is a fork of it
* [Spected](https://github.com/25th-floor/spected) - A great syntax for applying a bunch of validation rules (works well with [Redux Form](https://github.com/erikras/redux-form) or [Formik](https://github.com/jaredpalmer/formik)
* [Shapey](https://github.com/arizonatribe/shapey) - A syntax for composing object transformations on "spec" objects (used in Ruddy's action enhancers)
* [Ramda](https://github.com/erikras/ramda) - A suite of functions for common operations in JavaScript (the main dependency of Ruddy, Spected and Shapey), and similar to Lodash or Underscore. With it you can [essentially get Re-Select for free](https://twitter.com/sharifsbeat/status/891001130632830976).

# Installation

```sh
🦆 npm install ruddy
```

# Usage

```javascript
import { createDuck } from 'ruddy'

const dux = createDuck({/* options */})
```

## Options

When instantiating a `Duck` you'll pass a single prop, which is just an `Object` containing one or more configuration options. These options will also be provided - where needed - to other portions of the state management functions you create.

### Namespace and Store
* __namespace__ - (__required__) A `String` value representing the module/application you are building (ie, `todo-app`).
* __store__ - (__required__) A `String` value corresponding to a particular section of the Redux store.

The combination of a namespace and a store ensures action types and other sections of the app's state management functionality is separated from the rest. Naming collisions of action types and deeply complex reducers are less likely due to the ability to chop them up (hierarchically) and separate their logic from one another. Note that the store is the same idea as the store you describe to a Redux `combineReducers()` when setting up the chain of reducers through which each dispated action will pass.

### Initial State
* __initialState__ - Usually an `Object` (or a `Function` returning one) describing the structure of that section of the store.

Sometimes people demonstrate examples where the initialState of the Redux store is a primitive value, but certainly isn't as common. This represents the initial condition you want this section of your Redux store to have.

### Action Types
* __types__ - An `Array` of `String` values which represent the actions you intend to create and dispatch throughout your application.

According to the modular ducks proposal, action types are formatted so they are hierarchically organized underneath a namespace and a store name, to avoid naming collisions. And since this formatting takes place automatically within this library, you don't need to make your action type names long and overly descriptive. Their uniqueness comes primarily from the namespace and store names prepended to the action type name.

### Consts
* __consts__ - An `Object` containing any simple primitive-ish values that your application may use.

These constants are items used by the ducks which essentially don't belong in any of the other categories. Mostly these constants will be `String`, `Number` and other simple values (`Date`, `RegExp`, `Boolean`). Even an `Array` is an acceptable prop to place inside the consts. Arrays are converted into an `Object` whose values match the values from your array, but whose keys are stringified representations of the values. Only `Date`, `String`, `Number`, `Boolean` or `RegExp` are acceptable in your array, in part because their stringified value will still be unique.

Although these consts can be configured inside of an object, they can also optionally be configured as a function which returns an object.

## Reducers
* __reducer__ - A `Function` that modifies/re-shapes your store in response to a specific type of action dispatched in your application.

You can write your reducer in the way you've always written them in Redux, but with the added benefit of the Duck instance is provided as the third prop provided. As a reminder, the first two props provided to any Redux reducer are always `state` and `action`, respectively. You can leverage `types`, state `machines`, `consts` or anything else on your Duck instance, which (hopefully) makes the code you write simpler or more powerful.

### Selectors
* __selectors__ - An `Object` of scalar functions (or a `Function` returning an `Object` of them) returning a single value from the Redux store (no matter how deeply nested).

Most often you use these for the first argument to the Redux `connect()` function, which maps the store to your component's props. These functions are memoized for performance and it's become common to leverage a tool like [Reselect](https://github.com/reactjs/reselect) to facilitate this process, however a simple, copycat version of Reselect's `createSelector()` function is provided for your use as a named export you can import directly from `ruddy`

```javascript
import { createSelector } from "ruddy"

export const areaOfTriangle = createSelector(
  state => +state.base,
  state => +state.height,
  (base, height) => base * height * 0.5
)
```

### State Machines
* __machines__ - An `Object` of state machine `Object`s.

A [state machine](https://github.com/arizonatribe/machines) is an object whose key represents a possible "state" for your component and the values represent the possible transitions to new states which are possible from that current state. Your component (or app) can be in only one state at a time and that "current state" is a `String` value that will be automatically populated when your dispatched Redux action forces a change to a different state.

For the nested object: the key is the unique name for that state and the value (which is an object) contains all the transitions to which that state is allowed to change. When representing those allowed state transitions the key must match a Redux action `type` (ie, "LOGIN_USER_SUCCESSFUL", "LOGIN_USER_ERROR", etc.) and the value must match a the name of one of the other states defined for that machine.

State machines may be a little confusing themselves or confusing to figure out how you would graft them into the Redux ecosystem, but the author of the [stent](https://github.com/krasimir/stent) library wrote up a [great article](http://krasimirtsonev.com/blog/article/managing-state-in-javascript-with-state-machines-stent) to help describe the possibilities. However Ruddy has not implemented state machines using Stent nor have state machines been grafted into Redux in the way that author or others have attempted. The [redux-machine](https://github.com/mheiber/redux-machine) library is the closest to the way state machines have been implemented in Ruddy, which just sets a "status" prop to represent the current/new state whenever your reducer is invoked.

### Action Creators
* __creators__ - An `Object` of action-creator functions (or a `Function` returning an `Object` of them).

Action creator functions always return an `Object` representing the action to be dispatched to your reducers, and it must always define a `type` prop.

### Action Enhancers
* __enhancers__ - An `Object` (or a `Function` returning an object) of simple action-enhancer functions applied onto a dispatched action in the middleware chain, prior to hitting the reducers

To write an enhancer is to define an object whose keys represent names of existing props on the action to change or new props to create on the action. These enhancers are useful for simple, light, formatting operations, and to clean up and set default values so that reducers are easy to write. A prop defined on an enhancer object which isn't already in the action will create that new prop, and these can even be defined as static values instead of functions to run over an action prop. See [shapey](https://github.com/arizonatribe/shapey) for further examples on this type of API.

For these action enhancers you don't usually set a `type` prop on the enhancer function's spec object. If you're trying to make sure that the action has a type property it is an unecessary step since actions would implicitly require a type to be defined to even reach this point in the middleware chain. But there is a special edge-case feature with action enhancers that if you _do_ define this property, the behavior of the action enhancer is to _replace_ the entire action with what you define for this enhancer. Again, this is an edge-case, but can be useful in debugging scenarios.

### Action Multipliers
* __multipliers__ - An `Object` of functions (or a `Function` returning an `Object` of them) which return an Array of one or more `Object`.

An action multiplier creates many actions from a single source action. This provides a fanout behavior to an action dispatched into the Redux middleware chain. One powerful use for action multipliers is to keep sections of the ducks (relatively) unaware of other sections. For example, after a user login completes successfully an action multiplier may respond to a "post login" action create new actions to start off responding behavior in several sections of the application (fetching user details, loading dashboards, setting up background session refresh countdowns, etc.). Sections of the state management - organized via Ruddy into ducks - are always coupled to one another to some degree, but imagine an application where the majority of that cross-communication is located in this one spot.

To dovetail off the previous section on [action enhancers](#action-enhancers), a multiplier defines an action as a reaction to another, but this action it creates is itself written as an enhancer. So you can hardcode default values or represent props to create in the new action as individual functions which set their values based on the input values derived from the original source action.

### Effects
* __effects__ - An `Array` of `Arrays` that contains an action type (or predicate function) to match, followed by the effect (function) and optional success/fail handlers

1. Predicate (required) Matches a dispatched action
2. Effect (required) A function which creates an effect
3. Success (optional) A success handler function
4. Failure (optional) An error handler function

Similar to Redux Saga, Redux Offline and other Redux middleware libraries, the intent of an effect handler is to sandbox the "side effects". The completely normal and necessary areas of the application which regularly encounter success or fail situations are given special attention in software application design. Sometimes this is as simple as wrapping it in a `try`/`catch` block, but sometimes it comes out cleaner to peel these parts out into their own layer. That is the intent here of effect handlers: define action types which trigger the effect, define the effect behavior, and define the success/fail response behavior.

A common example of "side effects" are fetching external data in blocks of `async` code. External APIs are implicitly unpredictable and though they are a normal part of applications they can't quite be coded as easily as pure functions.

The `Array` of ["predicate", "effect handler", "success handler", "error handler"] gets compiled into a single function that is applied to every Redux action coming through the middleware chain, only triggering the effect handler if the action type matches. If the action _does_ match the predicate, the effect creating function is applied to the action, and the success or failure of that operation is routed into the appropriate success handler or error handler.

The pattern/predicate you must supply as the first item in the effect `Array` can be either:

a) a string which should be the exact name of a particular Redux Action type
b) a regular expression which will be matched against a Redux Action type
c) a function which receives the entire action as its single argument and returns a `Boolean` value

The default success handler will take the output of the effect handler and merge it into a new Redux action. If the result was _not_ and `Object`, it will be placed onto a prop called "payload". The new `type` prop will be the same as the original action but with `_SUCCESS` appended to it. Similar to the default success handler the default error handler will append `_ERROR` to the new action it creates when the effect fails, and the cause of the failure will be placed onto a prop called "error".

You can override the default success or error handlers by providing your own. Similar to Redux Saga, the original action is always passed into any custom success and/or error handler you provide as the _last_ argument.

### Validators
* __validators__ - An `Object` of "validators" (or a `Function` returning an `Object` of them).

Validators are functions you can use throughout the ducks but are attached directly to the ducks. Validations can take up a lot of code in typical applications, so these validators attempt to reduce the amount of code you write and describe validations according to a specific, predictable schema.

Validators leverage an outstanding, simple library called [spected](https://github.com/25th-floor/spected). Spected is a simple, small, yet powerful tool (built using only [Ramda](https://ramdajs.com)) and it curries your validation schema. Which means you can extract that curried validator from the Duck instance and run it as often as you wish against any input that must match your schema. Also, the author of spected built a form validation library on top of spected, called [Revalidation](https://github.com/25th-floor/revalidation) which you can leverage instead of Redux Form, if you find its API to be more suited to how you compose front-end components.

The simplest use for a validator is to use it in your `reduxForm()` function call (if you do use [redux-form](https://github.com/erikras/redux-form)) and it will return an object where valid and invalid values are represented with `true` and and `Array` of error messages, respectively.

* __validationLevel__ - If you have set your __validators__ and you've named any of them to match a redux action type, they will be applied in the middleware chain to validate the action's payload according to one of four possible strategies:
    * `LOG` - will always pass through a dispatched action but will append a `validationErrors` prop to the payload if any validations fail
    * `PRUNE` - will always pass through a dispatched action but will remove any invalid fields from the payload
    * `CANCEL` (default) - stops the middleware chain when validations fail on a dispatched action
    * `STRICT` - will only pass validated payloads whose action types are listed as inputs for the _current_ state of a given state machine

Also, if you wish to track machine states on a prop other than `states` (at the root of the `initialState` object), provide an alternate value for the `stateMachinesPropName` prop (defaults to 'states'). This value can be any one of the following:

* a single string value representing the prop name to place at the root of the `initialState` object (ie, 'status')
* an array of string values representing a nested path (ie, ['user', 'login', 'currentState']
* a single dot-separated string value representing the nested path (ie, 'user.login.currentState')

#### Middleware

Validators can be applied also as middleware, to auto-validate any of the dispatched actions. If you give a validator the same name as a redux action type, then it is automatically used to validate an inbound redux action.

You would apply these validators to the Redux middleware chain via the `createMiddleware()` function when you configure the redux store.

```javascript
//store.js

import {createStore, applyMiddleware} from 'redux'
import createMiddleware from 'ruddy'

import initialState from './initialState'
import reducers from './reducers'
import allDucks from './ducks'

export default createStore(
    reducers,
    initialState,
    applyMiddleware(createMiddleware(allDucks))
)
```

And to create the "row" of ducks (very similar to `combineReducers()` for your Redux reducers:

```javascript
// ducks.js

import {createRow} from 'ruddy'
import authDuck from './components/auth/duck'
import products from './components/products/duck'
import customers from './components/customers/duck'
import ordersDuck from './components/orders/duck'

export default createRow(authDuck, products, customers, orders)
```

__Note__: It doesn't matter what alias you give your duck when importing, because `createRow()` will use the `.store` prop from each duck (which is a String) to format the row as:
