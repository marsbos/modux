/* eslint-disable */
import React, { useEffect, useMemo, useState } from 'react'

/**
 * Observer class
 * Uses a Proxy to 'intercept' state assigments on the 'atom'.
 * Whenever new state is assigned, all subscribers are called with the new state.
 */
class Observer {
  constructor(atom) {
    return this.observe(atom)
  }

  observe(atom) {
    const proxy = new Proxy(atom, {
      set(t, p, value) {
        const blSetResult = Reflect.set(t, p, value)
        if (p === 'state') {
          const subscribers = t.subscribers
          if (subscribers) subscribers.forEach((s) => s(t.getValue()))
        }
        return blSetResult
      }
    })
    return proxy
  }
}

/**
 * Atom class.
 * Holds subscribers to state and has a state setter (next).
 */
class Atom {
  constructor(initialValue) {
    this.state = initialValue
    this.subscribers = null
  }

  subscribe(subscriberFn) {
    if (!this.subscribers) {
      this.subscribers = new Set()
    }
    if (!this.subscribers.has(subscriberFn)) {
      this.subscribers.add(subscriberFn)
      subscriberFn(this.getValue())
    }
    return () => {
      this.subscribers.delete(subscriberFn)
    }
  }

  getValue() {
    return this.state
  }

  next(newState) {
    if (typeof newState === 'function') {
      this.state = newState(this.getValue())
    } else {
      this.state = newState
    }
  }
}

/**
 * Composes reducer functions and their slice (key).
 * @param  {...any} fns The reducer functions.
 */
const compose = (...fns) => {
  const slices = {}
  const _reducers = fns.slice().map((fn) => {
    const slice = Object.keys(fn)[0]
    const reducerFn = fn[slice]
    slices[reducerFn] = slice
    return reducerFn
  })
  const reducerKeys = Object.keys(fns)
  return (state = {}, action) => {
    const nextState = {}
    let hasChanged = false
    for (const reducer of _reducers) {
      const reducerKey = slices[reducer]
      const prevSliceState = state[reducerKey]
      const nextSliceState = reducer(prevSliceState, action)
      nextState[reducerKey] = nextSliceState
      hasChanged = hasChanged || nextSliceState !== prevSliceState
    }
    hasChanged = hasChanged || Object.keys(state).length !== reducerKeys.length
    return hasChanged ? nextState : state
  }
}

/**
 * Combines multiple (slice) reducers into one `reducer` function.
 * @param  {...any} reducers
 * @returns A function that is composed of the given reducers.
 */
export const combineReducers = (...reducers) => compose(...reducers)

export const fromState = (initialState, hookFactoryFn) => {
  const subject = new Observer(new Atom(initialState))

  const getValue = () => subject.getValue()

  const setNextState = (newState) => {
    if (typeof newState === 'function') {
      subject.next(newState(getValue()))
    } else {
      subject.next(newState)
    }
  }
  const subscribe = (subscriber) => {
    const unsubscribe = subject.subscribe(subscriber)
    return () => unsubscribe()
  }
  // The hook
  const fromStateHookFn = () => {
    const [state, setState] = useState(getValue())
    useEffect(() => {
      const unsubscribe = subscribe((newState) => setState(newState))
      return () => unsubscribe()
    }, [])
    return [state, setNextState]
  }
  return hookFactoryFn ? hookFactoryFn(fromStateHookFn) : fromStateHookFn
}

/**
 * Creates a (thunk) dispatcher which creates new state and a subscriber function.
 * @param {*} reducer The (combined) reducer function which creates new state.
 * @param {*} initialState Initial state.
 * @returns a tuple: dispatch & subscribe functions
 */
export const fromReducer = (reducer, initialState) => {
  const subject = new Observer(new Atom(initialState))

  const getState = () => subject.getValue()
  const thunkDispatcher = (dispatch, getState) => (action) => {
    if (typeof action === 'function') {
      action(thunkDispatcher(dispatch, getState), getState)
    } else {
      dispatch(action)
    }
  }
  const dispatcher = (action) => {
    subject.next(reducer(getState(), action))
  }
  const dispatch = thunkDispatcher(dispatcher, getState)
  const subscribe = (subscriber) => {
    const unsubscribe = subject.subscribe(subscriber)
    return () => unsubscribe()
  }
  if (!initialState) {
    subject.next(reducer(getState(), { type: '__INIT__' }))
  }
  return [dispatch, subscribe]
}

/**
 * Same as the HoC 'withReducerState', but this only creates a hook function.
 * @param {*} mapState
 * @param {*} mapDispatch
 */
export const createUseReducerState = (mapState, mapDispatch) => (fromReducerSubject) => {
  const [dispatch, subscribe] = fromReducerSubject
  // The hook:
  return () => {
    const [state, setState] = useState()
    useEffect(() => {
      const unsubscribe = subscribe((data) => setState(mapState ? mapState(data) : data))
      return () => unsubscribe()
    }, [])

    return [state, mapDispatch ? mapDispatch(dispatch) : dispatch]
  }
}
/**
 * Hoc which 'injects' new state and mapped dispatch actions into the given component.
 * It subscribes to the atom which fromReducer created.
 * @param {*} mapState Map state
 * @param {*} mapDispatch Map dispatch
 */
export const withReducerState = (mapState, mapDispatch) => (fromReducerSubject) => (Component) => {
  const [dispatch, subscribe] = fromReducerSubject

  return (props) => {
    const [state, setState] = useState()
    const mappedDispatch = useMemo(() => {
      if (mapDispatch) return mapDispatch(dispatch)
      return null
    }, [dispatch, mapDispatch])
    useEffect(() => {
      const unsubscribe = subscribe((data) => setState((s) => ({ ...s, ...mapState(data) })))
      return () => unsubscribe()
    }, [])
    return <Component {...props} {...state} {...(mappedDispatch && mappedDispatch)} />
  }
}
