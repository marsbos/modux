# modux
Just an effort to mix redux, rxjs &amp; mobx features.

## Usage: 

```js
import { authenticationReducer, errorReducer, login, logout } from './state'
import { createUseReducerState, fromReducer, withReducerState, combineReducers } from './state-utils'

const auth = fromReducer(combineReducers({ auth: authenticationReducer }, { error: errorReducer }))

export const withAuth = withReducerState(
  (state) => {
    return { ...state?.auth }
  },
  (dispatch) => {
    return {
      clear: () => dispatch({ type: 'CLEAR' }),
      login: (...args) => dispatch(login(...args)),
      logout: () => dispatch(logout())
    }
  }
)(auth)

export const withAuthErrors = withReducerState((state) => {
  return { ...state?.error }
})(auth)


```
