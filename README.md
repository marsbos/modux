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

### Reducer:
```js
export const authenticationReducer = (state = initialAuthState, action) => {
   return reducerSwitch[action.type]?reducerSwitch[action.type](state, action):initialAuthState
}
```

### Actions:
```js
...
const action = (actionType) => (payload) => ({ type: actionType, payload })

const request = action(authConstants.LOGIN_REQUEST)
const success = action(authConstants.LOGIN_SUCCESS)
const failure = action(authConstants.LOGIN_FAILURE)

const login =
  ({ email, password }) =>
  (dispatch, getState) => {
    dispatch(request({ email }))
    authService
      .loginUser({ email, password })
      .then((response) => {
          dispatch(success(response.data))
      })
      .catch((err) => {
        dispatch(failure(JSON.parse(err.message)))
      })
  }
...
export { login, logout }
```
