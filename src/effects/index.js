import {
  __,
  adjust,
  always,
  compose,
  cond,
  curry,
  evolve,
  F,
  identity,
  ifElse,
  is,
  mergeDeepLeft,
  objOf,
  pathEq,
  pathSatisfies,
  pick,
  pipe,
  T,
  test,
  tryCatch,
  unless,
  when
} from "ramda"
import { makeShaper } from "shapey"
import { isPlainObj, isPromise } from "../util/is"

/**
 * A slightly opinionated way to handle successful effects and creating a new
 * Action to be dispatched. This default success handler assumes you're alright
 * with appending _SUCCESS to the original action type, and merging the return object
 * (from your effect function) into the new Action. However, if your effect does NOT
 * return an object, that return value will be merged onto the new Action onto a prop
 * called "payload". The other assumption it makes is that if you have suffixed your
 * original Action with _REQUEST or _EFFECT, that will be removed. A (somewhat) standard
 * pattern in the Redux community is to suffix _SUCCESS for effects that succeed
 * and either _ERROR or _FAIL for those that failed. You can always override
 * with your own success handler by providing it when you create an effect in
 * the ducks.
 *
 * @function
 * @sig String|{k: v} -> {k: v} -> {k: v}
 * @param {string | Object} result The result returned from your effect function
 * @param {Object} action The original Redux action that triggered the effect
 * @returns {Object} A new Action object that contains the "payload" that was
 * caught when the effect was created (unless your effect function returned an
 * object, in which case it will be merged onto this)
 */
export const defaultSuccessHandler = curry((result, action) =>
  compose(
    mergeDeepLeft(__, { ...unless(isPlainObj, objOf("payload"))(result) }),
    when(
      pathSatisfies(is(String), ["type"]),
      compose(
        evolve({ type: t => `${t.replace(/_REQUEST$/i, "").replace(/_EFFECT$/i, "")}_SUCCESS` }),
        pick(["type"])
      )
    )
  )(action)
)

/**
 * A slightly opinionated way to handle catching an exception and creating a new
 * Action to be dispatched. This default error handler assumes you're alright
 * with appending _ERROR to the original action type, and pruning out all of the
 * other fields from the original action and setting only an "error" prop on the
 * new Action. The other assumption it makes is that if you have suffixed your
 * original Action with _REQUEST or _EFFECT, that will be removed. A (somewhat) standard
 * pattern in the Redux community is to suffix _SUCCESS for effects that succeed
 * and either _ERROR or _FAIL for those that failed. You can always override
 * with your own error handler by providing it when you create an effect in
 * the ducks.
 *
 * @function
 * @sig String|{k: v} -> {k: v} -> {k: v}
 * @param {string | Object} error An error that was caught when the effect was
 * triggered
 * @param {Object} action The original Redux action that triggered the effect
 * @returns {Object} A new Action object that contains the "error" that was
 * caught when the effect was created
 */
export const defaultErrorHandler = curry((error, action) =>
  compose(
    mergeDeepLeft({ error: unless(isPlainObj, String)(error) }),
    when(
      pathSatisfies(is(String), ["type"]),
      compose(
        evolve({ type: t => `${t.replace(/_REQUEST$/i, "").replace(/_EFFECT$/i, "")}_ERROR` }),
        pick(["type"])
      )
    )
  )(action)
)

/* eslint-disable jsdoc/check-param-names */
/**
 * Makes a predicate function out of either a String, RegExp, or a Function,
 * which can then be applied to an Object that contains a "type" property.
 * This is meant to be used to evaluate if a Redux action matches the predicate.
 * If neither a String, RegExp, nor Function is supplied here, then the result
 * will be to give back a function that always returns false.
 * @function
 * @param fn
 * @sig String|RegExp|({k: v} -> Boolean) -> ({k: v} -> Boolean)
 * @param {string | RegExp | function} pattern A String to be exactly matched to an
 * Object's "type" property, OR a Regular expression to be matched against it,
 * OR a function to be used to match against any custom criteria on that Object
 * @returns {function} A predicate function to be applied later to an Object
 * (ideally, one containing a "type" property)
 */
export const makePredicate = cond([
  [is(String), pathEq(["type"])],
  [is(RegExp), compose(pathSatisfies(__, ["type"]), test)],
  [is(Function), (fn) => compose(Boolean, fn)],
  [T, always(F)]
])
/* eslint-enable jsdoc/check-param-names */

/**
 * Creates a function that handles the effect result (either success or failure)
 *
 * @function
 * @sig (a -> b) -> (a -> b) -> (a -> b)
 * @param {function} defaultHandler The fall through handler function to be used
 * in case the handler passed into this function is null/undefined
 * @param {string | Object | function} handler The handler function or the
 * String/Object to be turned into a handler function (if String/Object, it will
 * be turned into a Shapey spec-mapping function)
 * @returns {function} A success OR error handler function to be applied after
 * the effect is finished
 */
export const makeResponseHandler = curry(
  (defaultHandler, handler) => cond([
    [is(String), compose(makeShaper, objOf("type"))],
    [isPlainObj, makeShaper],
    [is(Function), identity],
    [T, always(defaultHandler)]
  ])(handler)
)

/**
 * Creates a robust effect handler from a predicate, an effect creating
 * function, as well as a success and error handler. This curried function can
 * then be applied safely to any Action that matches the predicate (if the
 * Action does NOT match, this is simply an identity function - which returns
 * the Action as-is).
 *
 * @function
 * @param {string | RegExp | function} pattern A String to be exactly matched to an
 * Object's "type" property, OR a Regular expression to be matched against it,
 * OR a function to be used to match against any custom criteria on that Object
 * @param {function} effectHandler A custom function that creates some kind of
 * normal (but "impure") effect which may succeed or it may fail
 * @param {function} successHandler A function that receives the input of the
 * effect creating function and creates a new Action containing its result
 * @param {function} errorHandler A function that receives the caught exception
 * from the effect creating function and creates a new Action from it
 * @returns {Object} Either the original action (if it didn't match the
 * predicate) or a new Action that represents the succes of the effect or
 * alternatively it's failure
 */
export const makeEffectHandler = curry((effect, action) =>
  pipe(
    adjust(makePredicate, 0),
    ([pattern, effectHandler, successHandler, errorHandler]) => [
      makePredicate(pattern),
      effectHandler,
      makeResponseHandler(defaultSuccessHandler, successHandler),
      makeResponseHandler(defaultErrorHandler, errorHandler)
    ],
    ([predicate, effectHandler, successHandler, errorHandler]) => when(
      predicate,
      tryCatch(
        pipe(
          effectHandler,
          ifElse(
            isPromise,
            promise => promise
              .then(res => successHandler(res, action))
              .catch(err => errorHandler(err, action)),
            res => successHandler(res, action)
          )
        ),
        ex => errorHandler(ex, action)
      )
    )(action)
  )(effect)
)
