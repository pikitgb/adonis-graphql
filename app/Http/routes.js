'use strict'

const GraphiQL = require('graphql-server-module-graphiql')
const {runHttpQuery} = require('graphql-server-core')

/*
|--------------------------------------------------------------------------
| Router
|--------------------------------------------------------------------------
|
| AdonisJs Router helps you in defining urls and their actions. It supports
| all major HTTP conventions to keep your routes file descriptive and
| clean.
|
| @example
| Route.get('/user', 'UserController.index')
| Route.post('/user', 'UserController.store')
| Route.resource('user', 'UserController')
*/

const Route = use('Route')
const User = use('App/Model/User')

Route.get('/test', function * (req, res) {
  const users = yield User.all()
  res.send(users)
})

Route.post('/graphql', function * (req, res) {
  const GraphQLSchema = use('App/GraphQL/Schema')

  try {
    const gqlResponse = yield runHttpQuery([req, res], {
      method: req.method(),
      query: req.all(),
      options: {
        schema: GraphQLSchema,
        // formatError?: Function;
        // rootValue?: any;
        // context?: any;
        // logFunction?: LogFunction;
        // formatParams?: Function;
        // validationRules?: Array<(context: ValidationContext) => any>;
        // formatResponse?: Function;
        debug: true
      }
    })

    res.send(gqlResponse)
  } catch (error) {
    console.log(error)
    // We only want to handle HttpQueryErrors so if it's anything else we rethrow it
    if (error.name !== 'HttpQueryError') {
      throw error
    }

    if (error.headers) {
      Object.keys(error.headers).forEach((header) => {
        res.header(header, error.headers[header])
      })
    }

    yield res.status(error.statusCode).send(error.message)
  }
}).as('graphql')

Route.get('/graphiql', function * (req, res) {
  // Render the GraphiQL instance as a string (returns a full HTML page) and send it as the response
  const graphiql = yield GraphiQL.resolveGraphiQLString(req.get('query'), {
    endpointURL: Route.url('graphql'),
    passHeader: `'x-csrf-token': '${req.csrfToken()}'`
  })

  // Send the rendered GraphiQL instance as the response
  yield res.send(graphiql)
}).as('graphiql')
