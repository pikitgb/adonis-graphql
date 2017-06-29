'use strict'

const genToPromise = require('co')

const {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLSchema,
  GraphQLString,
  GraphQLList,
  GraphQLInt,
  GraphQLBoolean
} = require('graphql/type')

const {
  nodeDefinitions,
  fromGlobalId,
  globalIdField,
  connectionDefinitions,
  connectionFromPromisedArray,
  connectionArgs
} = require('graphql-relay')

// todo: fix it
function getObjectById (type, id) {
  const resolvers = {
    [UserType.name]: (id) => User.find(id)
  }

  if (type in resolvers) {
    return resolvers[type](id)
  }
}

const {nodeInterface, nodeField} = nodeDefinitions(
  (globalId) => {
    const {type, id} = fromGlobalId(globalId)

    return getObjectById(type, id)
  },
  (object) => {
    if (object.email) {
      return UserType
    }

    return null
  }
)

const User = use('App/Model/User')

const UserType = new GraphQLObjectType({
  name: 'user',
  description: 'A User',
  interfaces: [nodeInterface],
  fields: () => ({
    id: globalIdField(),
    username: {
      type: GraphQLString,
      description: 'The Username of the User'
    },
    email: {
      type: GraphQLString,
      description: 'The Email of the User'
    }
  })
})

const {connectionType: UserConnection} = connectionDefinitions({
  nodeType: UserType
})

const rootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    node: nodeField,
    users: {
      type: UserConnection,
      args: connectionArgs,
      resolve: (root, args, source, fieldASTs) => connectionFromPromisedArray(
        genToPromise(function * () {
          const {before, after, first, last} = args
          let offset = 0
          let limit = 25

          if (before && after) {
            throw new Error('Combining `before` and `after` is not supported')
          }

          if (after) {
            offset = getOffset(after) || 0
            limit = parseInt(first || 25, 10)
          } else if (before) {
            limit = parseInt(last || 25, 10)
            offset = Math.max(0, (getOffset(before) || 0) - limit)
          }

          const users = yield User.query().fetch()
          return users.value()
        }),
        args
      )
    }
  }
})

const schema = new GraphQLSchema({
  query: rootQuery
})

module.exports = schema
