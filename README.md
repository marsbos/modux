# modux
Just an effort to mix redux, rxjs &amp; mobx features.
Main benefits:
- You can wrap any component with your own created HoC's, from anywhere.
- Built-in support for 'thunks', no extra work needed.
- State will be automatically injected in your components.
- 


## Usage: 

### Create a HOC:
```js
import { login, logout } from './actions'
import { authenticationReducer, errorReducer } from './reducers'
import { fromReducer, withReducerState, combineReducers } from './state-utils'

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

### Usage with (React) components:
```js
import { withAuth, withAuthErrors } from './hocs'

const LoginUserPage = withAuth(({ user, login, loading }) => {
    return <><button onClick={()=> login(formData)}>/button></>
})
```

```js
export const Header = withAuth(({ user, logout }) => {
  ...do something with the user object...
})
```
