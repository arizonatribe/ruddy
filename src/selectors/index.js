/**
 * Helper utility to assist in composing the selectors.
 * Previously defined selectors can be used to derive future selectors.
 * Any selector which is a pre-extracted state is expected to have a
 * `needsExtraction: true` and an accompanying `justAddDuckSelectors` prop
 * which performs the extraction. This function creates a sort of running total
 * of all selectors and passes them into each `justAddDuckSelectors()`.
 *
 * @function
 * @sig {k: v} -> {k: v}
 * @param {Object} selectors An Object of selector functions, some of which may
 * need to be extracted (those which require access to fellow selectors)
 * @returns {Object} selectors, but now with access to fellow selectors
 */
export function deriveSelectors(selectors = {}) {
  const { needsExtraction, ...restOfSelectors } = selectors

  if (needsExtraction !== true) {
    return selectors
  } 

  return Object.entries(restOfSelectors).reduce((composedSelectors, [key, selector]) => {
    return {
      ...composedSelectors,
      [key]: selector.justAddDuckSelectors(composedSelectors)
    }
  }, {})
}

/**
 * A simple, Ramda implementation of Reselect's `createSelector()` function,
 * taken from [this example](https://twitter.com/sharifsbeat/status/891001130632830976)
 * The cost of all the Ramda functions which make up this library has already been
 * paid, so may as well save on another dependency. You can still use Reselect
 * if you prefer; they both work the same.
 *
 * @function
 * @sig (*... -> a) -> (*... -> a)
 * @ param {...Function} selectors One or more selector functions to be "merged" into one
 * @returns {function} A memoized "selector" function
 */
export function createSelector(...selectors) {
  const cache = {}
  const outputSelector = selectors.slice(-1)
  const inputSelectors = selectors.slice(0, selectors.length - 1)

  const fn = (data) => {
    const input = inputSelectors.map(selector => selector(data))
    return outputSelector(...input)
  }

  return (data) => {
    const key = JSON.stringify(data)
    if (cache[key] === undefined) {
      cache[key] = fn(data)
    }
    return cache[key]
  }
}

/**
 * Selectors that require one or more of the existing selectors are built using this helper,
 * and the extraction function is passed in as a param. The simplest type of
 * extractor function that this helper was initially built to handle would be:
 *
 * selectors => state => selectors.getSomethingFrom(state)
 *
 * Additionally, the return Object is in a ready-to-be-extracted state (which is
 * why it is flagged `needsExtraction: true`) and so invoking its
 * `justAddDuckSelectors()` will perform the final step of running the extractor
 * (ideally when the rest of the selectors are all being derived)
 *
 * @function
 * @sig Function -> {k: v}
 * @param {function} extractFunction A helper that will extract all the existing selectors
 * @returns {Object}
 */
export function createDuckSelector(extractFunction) {
  return {
    needsExtraction: true,
    justAddDuckSelectors(allSelectorsObject = {}) {
      const extracted = extractFunction(allSelectorsObject)
      if (Array.isArray(extracted)) {
        return createSelector(...extracted)
      }
      return extracted
    }
  }
}
